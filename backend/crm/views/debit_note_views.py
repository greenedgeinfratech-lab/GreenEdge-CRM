from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from common.pagination import StandardResultsSetPagination
from crm.models import DebitNote
from crm.serializers.debit_note_serializers import DebitNoteSerializer


class DebitNoteViewSet(ModelViewSet):
    serializer_class = DebitNoteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return DebitNote.objects.filter(company=self.request.user.company).prefetch_related('items')

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
