from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from crm.models import Invoice
from crm.serializers.invoice_serializers import InvoiceSerializer
from common.pagination import StandardResultsSetPagination

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Invoices
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Invoice.objects.filter(company=self.request.user.company).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
