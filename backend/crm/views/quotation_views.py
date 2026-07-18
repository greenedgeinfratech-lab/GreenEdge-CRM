from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django.db.models import Q
from django.utils import timezone

from crm.models import Quotation
from crm.permissions import CanViewCRM
from crm.views.stage_views import CompanyScopedMixin
from crm.serializers import QuotationSerializer

class QuotationViewSet(CompanyScopedMixin, ModelViewSet):
    """
    ViewSet for managing Quotations.
    """
    queryset_model = Quotation
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self._trigger_deliveries(serializer.instance)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        self._trigger_deliveries(serializer.instance)

    def _trigger_deliveries(self, quotation):
        if quotation.share_email:
            from crm.tasks import send_quotation_email_task
            send_quotation_email_task.delay(str(quotation.id))
        if quotation.share_whatsapp:
            from crm.tasks import send_quotation_whatsapp_task
            send_quotation_whatsapp_task.delay(str(quotation.id))

    def get_queryset(self):
        # Scopes to company and active via CompanyScopedMixin
        qs = super().get_queryset()

        # Search parameter
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(customer_name__icontains=search) |
                Q(quote_number__icontains=search) |
                Q(reference__icontains=search)
            )

        # Filters from UI
        q_type = self.request.query_params.get('type')
        if q_type and q_type != 'All':
            # Map Proforma Invoices tab label to DB type
            if q_type == 'Proforma Invoices':
                qs = qs.filter(type='Proforma Invoice')
            elif q_type == 'Quotations':
                qs = qs.filter(type='Quotation')
            else:
                qs = qs.filter(type__iexact=q_type)

        status_val = self.request.query_params.get('status')
        if status_val and status_val != 'All Status':
            qs = qs.filter(status__iexact=status_val)

        executive = self.request.query_params.get('executive')
        if executive and executive != 'All Executives':
            qs = qs.filter(
                Q(sales_credit__icontains=executive) |
                Q(created_by__first_name__icontains=executive) |
                Q(created_by__last_name__icontains=executive)
            )

        date_range = self.request.query_params.get('date_range')
        if date_range == 'this_month':
            now = timezone.now()
            # Check both created_at or quote_date
            qs = qs.filter(quote_date__year=now.year, quote_date__month=now.month)

        return qs
