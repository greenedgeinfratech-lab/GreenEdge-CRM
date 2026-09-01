from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from crm.models import InvoicePayment, Invoice
from crm.serializers.payment_serializers import InvoicePaymentSerializer
from common.pagination import StandardResultsSetPagination


class InvoicePaymentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Invoice Payments.
    Supports:
      - /payments/ — list all payments
      - /payments/?invoice={uuid} — filter by invoice
      - /payments/{invoice_id}/payments/ — nested endpoint
    """
    serializer_class = InvoicePaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['invoice', 'method', 'payment_date']
    search_fields = ['reference_no', 'notes']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date', '-created_at']

    def get_queryset(self):
        qs = InvoicePayment.objects.filter(company=self.request.user.company)
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            qs = qs.filter(invoice_id=invoice_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user,
        )
        # Auto-update invoice recovery_amt and status
        self._update_invoice_recovery(instance.invoice)

    def _update_invoice_recovery(self, invoice):
        """Recalculate recovery amount and status from all payments."""
        total_paid = sum(p.amount for p in invoice.payments.all())
        invoice.recovery_amt = total_paid
        if total_paid >= invoice.grand_total:
            invoice.invoice_status = 'Paid'
        elif total_paid > 0:
            invoice.invoice_status = 'Partial'
        else:
            invoice.invoice_status = 'Unpaid'
        invoice.save(update_fields=['recovery_amt', 'invoice_status', 'updated_at'])

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        self._update_invoice_recovery(instance.invoice)

    def perform_destroy(self, instance):
        invoice = instance.invoice
        instance.delete()
        self._update_invoice_recovery(invoice)
