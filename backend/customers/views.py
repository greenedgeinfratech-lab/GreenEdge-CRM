from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db import transaction
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.core.mail import send_mail
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from base64 import b64encode

from customers.models import Customer, CustomerContact
from customers.serializers import (
    CustomerListSerializer, CustomerDetailSerializer,
    CustomerCreateSerializer, CustomerUpdateSerializer, CustomerInteractionSerializer,
)
from common.pagination import StandardResultsSetPagination
from common.services import NumberingService


class CustomerViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Customers.
    Supports search, filtering, and auto-numbering.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        if self.action == 'create':
            return CustomerCreateSerializer
        if self.action in ('update', 'partial_update'):
            return CustomerUpdateSerializer
        return CustomerDetailSerializer

    def get_queryset(self):
        qs = Customer.objects.filter(
            company=self.request.user.company,
            is_active=True,
        ).select_related('assigned_to', 'converted_from_lead')

        # Search
        search = self.request.query_params.get('search', None)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(mobile__icontains=search) |
                Q(email__icontains=search) |
                Q(customer_number__icontains=search)
            )

        # Filters
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            qs = qs.filter(status=status_filter)

        customer_type = self.request.query_params.get('customer_type', None)
        if customer_type:
            qs = qs.filter(customer_type=customer_type)

        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        city = self.request.query_params.get('city', None)
        if city:
            qs = qs.filter(city__icontains=city)

        state = self.request.query_params.get('state', None)
        if state:
            qs = qs.filter(state__icontains=state)

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        customer = serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user,
        )
        # Generate customer number
        customer.customer_number = NumberingService.generate_number(
            company=self.request.user.company,
            entity_name='Customer',
            prefix='CUST',
        )
        customer.save(update_fields=['customer_number'])

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['get', 'post'])
    def interactions(self, request, pk=None):
        customer = self.get_object()
        if request.method == 'GET':
            return Response(CustomerInteractionSerializer(customer.interactions.all(), many=True).data)
        serializer = CustomerInteractionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(customer=customer, company=request.user.company, created_by=request.user, updated_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def receive_payment(self, request, pk=None):
        customer = self.get_object()
        try:
            amount = Decimal(str(request.data.get('amount')))
        except (TypeError, ValueError, InvalidOperation):
            return Response({'amount': ['Enter a valid payment amount.']}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= Decimal('0'):
            return Response({'amount': ['Payment amount must be greater than zero.']}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            customer.outstanding = max(customer.outstanding - amount, Decimal('0'))
            customer.updated_by = request.user
            customer.save(update_fields=['outstanding', 'updated_by', 'updated_at'])
            interaction = customer.interactions.create(
                company=request.user.company, created_by=request.user, updated_by=request.user,
                interaction_type='payment', amount=amount, notes=request.data.get('notes', ''),
            )
        return Response({'customer': CustomerDetailSerializer(customer).data, 'interaction': CustomerInteractionSerializer(interaction).data})

    def _create_delivery_interaction(self, customer, interaction_type, notes):
        return customer.interactions.create(
            company=self.request.user.company, created_by=self.request.user, updated_by=self.request.user,
            interaction_type=interaction_type, notes=notes, delivery_status='pending',
        )

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        customer = self.get_object()
        recipient = request.data.get('email') or customer.email
        subject = request.data.get('subject') or 'Recovery follow-up'
        message = request.data.get('message') or ''
        interaction = self._create_delivery_interaction(customer, 'email', message)
        if not recipient:
            interaction.delivery_status, interaction.delivery_error = 'failed', 'Customer has no email address.'
            interaction.save(update_fields=['delivery_status', 'delivery_error', 'updated_at'])
            return Response({'detail': interaction.delivery_error}, status=status.HTTP_400_BAD_REQUEST)
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
            interaction.delivery_status = 'sent'
            interaction.save(update_fields=['delivery_status', 'updated_at'])
            return Response(CustomerInteractionSerializer(interaction).data)
        except Exception as exc:
            interaction.delivery_status, interaction.delivery_error = 'failed', str(exc)
            interaction.save(update_fields=['delivery_status', 'delivery_error', 'updated_at'])
            return Response({'detail': 'Email delivery failed. Check SMTP configuration.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=True, methods=['post'])
    def send_whatsapp(self, request, pk=None):
        customer = self.get_object()
        message = request.data.get('message') or 'Recovery follow-up'
        interaction = self._create_delivery_interaction(customer, 'whatsapp', message)
        mobile = ''.join(filter(str.isdigit, request.data.get('mobile') or customer.mobile or ''))[-10:]
        sid, token = settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN
        if len(mobile) != 10 or not sid or not token:
            interaction.delivery_status, interaction.delivery_error = 'failed', 'A customer mobile number and Twilio credentials are required.'
            interaction.save(update_fields=['delivery_status', 'delivery_error', 'updated_at'])
            return Response({'detail': interaction.delivery_error}, status=status.HTTP_400_BAD_REQUEST)
        try:
            body = urlencode({'From': settings.TWILIO_WHATSAPP_FROM, 'To': f'whatsapp:+91{mobile}', 'Body': message}).encode()
            request_obj = Request(f'https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json', data=body)
            request_obj.add_header('Authorization', f'Basic {b64encode(f"{sid}:{token}".encode()).decode()}')
            urlopen(request_obj, timeout=15).read()
            interaction.delivery_status = 'sent'
            interaction.save(update_fields=['delivery_status', 'updated_at'])
            return Response(CustomerInteractionSerializer(interaction).data)
        except Exception as exc:
            interaction.delivery_status, interaction.delivery_error = 'failed', str(exc)
            interaction.save(update_fields=['delivery_status', 'delivery_error', 'updated_at'])
            return Response({'detail': 'WhatsApp delivery failed. Check Twilio configuration.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle customer between active/inactive."""
        customer = self.get_object()
        if customer.status == 'active':
            customer.status = 'inactive'
        else:
            customer.status = 'active'
        customer.save(update_fields=['status', 'updated_at'])
        return Response({'status': customer.status})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return customer summary counts."""
        company = request.user.company
        qs = Customer.objects.filter(company=company, is_active=True)
        return Response({
            'total': qs.count(),
            'active': qs.filter(status='active').count(),
            'inactive': qs.filter(status='inactive').count(),
            'blocked': qs.filter(status='blocked').count(),
            'individual': qs.filter(customer_type='individual').count(),
            'business': qs.filter(customer_type='business').count(),
        })
