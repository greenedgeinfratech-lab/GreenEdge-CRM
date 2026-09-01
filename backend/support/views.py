from django.utils import timezone
from django.db.models import Q

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import SupportTicket, TicketComment
from .serializers import (
    SupportTicketSerializer, SupportTicketListSerializer, TicketCommentSerializer
)


class SupportTicketViewSet(ModelViewSet):
    """
    CRUD for Support Tickets.

    Filters:
      ?status=pending|in_progress|resolved|closed
      ?priority=low|medium|high|critical
      ?search=<text>
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = self.request.user.company
        qs = SupportTicket.objects.filter(company=company, is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(ticket_no__icontains=search) |
                Q(customer_name__icontains=search)
            )

        status_val = self.request.query_params.get('status')
        if status_val and status_val != 'all':
            qs = qs.filter(status=status_val)

        priority = self.request.query_params.get('priority')
        if priority and priority != 'all':
            qs = qs.filter(priority=priority)

        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer

    def perform_create(self, serializer):
        company = self.request.user.company

        # Auto-generate ticket_no
        count = SupportTicket.objects.filter(company=company).count() + 1
        ticket_no = f"TKT-{str(count).zfill(5)}"

        serializer.save(
            company=company,
            created_by=self.request.user,
            updated_by=self.request.user,
            ticket_no=ticket_no,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    # ── Custom Actions ──────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """POST /api/v1/support/tickets/{id}/resolve/"""
        ticket = self.get_object()
        ticket.status      = 'resolved'
        ticket.resolved_at = timezone.now()
        ticket.updated_by  = request.user
        ticket.save()

        # Add a system comment
        TicketComment.objects.create(
            company=ticket.company,
            ticket=ticket,
            text=f"Ticket marked as resolved by {request.user.get_full_name() or request.user.email}.",
            is_internal=True,
            created_by=request.user,
            updated_by=request.user,
        )
        return Response(SupportTicketSerializer(ticket).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """POST /api/v1/support/tickets/{id}/close/"""
        ticket = self.get_object()
        ticket.status    = 'closed'
        ticket.closed_at = timezone.now()
        ticket.updated_by = request.user
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data)

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """GET/POST /api/v1/support/tickets/{id}/comments/"""
        ticket = self.get_object()

        if request.method == 'GET':
            qs = TicketComment.objects.filter(ticket=ticket).order_by('created_at')
            return Response(TicketCommentSerializer(qs, many=True).data)

        serializer = TicketCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            company=ticket.company,
            ticket=ticket,
            created_by=request.user,
            updated_by=request.user,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """GET /api/v1/support/tickets/summary/ — dashboard KPIs"""
        company = request.user.company
        qs = SupportTicket.objects.filter(company=company, is_active=True)

        return Response({
            'total':       qs.count(),
            'pending':     qs.filter(status='pending').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'resolved':    qs.filter(status='resolved').count(),
            'closed':      qs.filter(status='closed').count(),
            'critical':    qs.filter(priority='critical', status__in=['pending', 'in_progress']).count(),
        })
