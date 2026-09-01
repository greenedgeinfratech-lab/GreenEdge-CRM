from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from crm.models import PurchaseOrder
from crm.serializers.purchase_order_serializers import PurchaseOrderSerializer
from common.pagination import StandardResultsSetPagination

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Purchase Orders
    """
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return PurchaseOrder.objects.filter(company=self.request.user.company).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
