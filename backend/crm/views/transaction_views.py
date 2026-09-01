from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from crm.models import Transaction
from crm.serializers.transaction_serializers import TransactionSerializer
from common.pagination import StandardResultsSetPagination


class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Ledger Transactions (Journal Entries).
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['debit_ledger', 'credit_ledger', 'date', 'reference_type']
    search_fields = ['voucher_no', 'narration', 'reference_no']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        return Transaction.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
