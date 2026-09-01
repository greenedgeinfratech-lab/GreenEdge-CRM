from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from crm.models import Quotation, Invoice, InvoiceItem
from crm.permissions import CanViewCRM
from crm.views.stage_views import CompanyScopedMixin
from crm.serializers import QuotationSerializer
from crm.serializers.invoice_serializers import InvoiceSerializer

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

    @action(detail=True, methods=['post'], url_path='convert-to-invoice')
    def convert_to_invoice(self, request, pk=None):
        """Convert a Quotation to an Invoice, copying all line items."""
        quotation = self.get_object()

        if quotation.status == 'Converted':
            return Response({'detail': 'This quotation has already been converted to an invoice.'}, status=400)

        with transaction.atomic():
            # Create the invoice from quotation data
            invoice = Invoice.objects.create(
                company=request.user.company,
                created_by=request.user,
                updated_by=request.user,
                type='B2B Invoice',
                lead=quotation.lead,
                customer_name=quotation.customer_name,
                contact_person=quotation.contact_person,
                billing_address=quotation.address,
                same_as_billing=quotation.same_as_billing,
                shipping_details=quotation.shipping_address,
                reference=quotation.quote_number,
                invoice_date=timezone.now().date(),
                notes=quotation.notes,
                bank_details=quotation.bank_details,
                terms_conditions=quotation.terms_conditions,
                extra_charge=quotation.extra_charge,
                custom_discount=quotation.custom_discount,
                total_taxable=quotation.total_taxable,
                total_cgst=quotation.total_cgst,
                total_sgst=quotation.total_sgst,
                total_igst=quotation.total_igst,
                grand_total=quotation.grand_total,
                share_email=quotation.share_email,
                share_whatsapp=quotation.share_whatsapp,
            )

            # Copy line items
            for item in quotation.items.all():
                InvoiceItem.objects.create(
                    company=request.user.company,
                    created_by=request.user,
                    updated_by=request.user,
                    invoice=invoice,
                    item_description=item.item_description,
                    hsn_sac=item.hsn_sac,
                    qty=item.qty,
                    unit=item.unit,
                    rate=item.rate,
                    discount=item.discount,
                    taxable=item.taxable,
                    cgst_percent=item.cgst_percent,
                    sgst_percent=item.sgst_percent,
                    igst_percent=item.igst_percent,
                    cgst_amt=item.cgst_amt,
                    sgst_amt=item.sgst_amt,
                    igst_amt=item.igst_amt,
                    amt=item.amt,
                )

            # Mark quotation as converted
            quotation.status = 'Converted'
            quotation.save(update_fields=['status', 'updated_at'])

        return Response({
            'detail': 'Quotation successfully converted to invoice.',
            'invoice_id': str(invoice.id),
            'invoice_no': invoice.invoice_no,
        }, status=201)

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
