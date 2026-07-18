"""
Reminder Views
==============
Nested under: /api/v1/crm/leads/{lead_pk}/reminders/

Endpoints:
  GET    /reminders/           — list reminders for a lead
  POST   /reminders/           — create reminder
  GET    /reminders/{id}/      — retrieve single reminder
  PATCH  /reminders/{id}/      — update reminder
  DELETE /reminders/{id}/      — soft-delete
  POST   /reminders/{id}/complete/ — mark completed
  POST   /reminders/{id}/cancel/   — cancel
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, DestroyModelMixin

from crm.models import Lead, Reminder
from crm.permissions import CanViewCRM, CanEditLead
from crm.serializers.reminder_serializers import ReminderSerializer, ReminderCreateSerializer
from crm.services.reminder_service import ReminderService


class ReminderViewSet(ListModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet):
    """
    Nested ViewSet for reminders under a lead.
    Parent lead is identified by `lead_pk` URL kwarg (set by NestedDefaultRouter).
    """
    permission_classes = [IsAuthenticated, CanViewCRM]
    serializer_class   = ReminderSerializer

    def _get_lead(self):
        """Fetch and verify the parent lead belongs to the current company."""
        return Lead.objects.get(
            id=self.kwargs['lead_pk'],
            company=self.request.user.company,
            is_active=True,
        )

    def get_queryset(self):
        return Reminder.objects.filter(
            lead__id=self.kwargs['lead_pk'],
            lead__company=self.request.user.company,
            is_active=True,
        ).select_related('assigned_to').order_by('remind_at')

    # ── Create ────────────────────────────────────────────────────────────────

    def create(self, request, *args, **kwargs):
        try:
            lead = self._get_lead()
        except Lead.DoesNotExist:
            return Response({'detail': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReminderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            reminder = ReminderService.create(lead, request.user, serializer.validated_data)
            return Response(ReminderSerializer(reminder).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Update ────────────────────────────────────────────────────────────────

    def partial_update(self, request, *args, **kwargs):
        try:
            reminder = self.get_object()
        except Reminder.DoesNotExist:
            return Response({'detail': 'Reminder not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReminderCreateSerializer(reminder, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            reminder = ReminderService.update(reminder, request.user, serializer.validated_data)
            return Response(ReminderSerializer(reminder).data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Soft Delete ───────────────────────────────────────────────────────────

    def destroy(self, request, *args, **kwargs):
        reminder = self.get_object()
        reminder.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Custom Actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def complete(self, request, *args, **kwargs):
        reminder = self.get_object()
        if reminder.status != Reminder.ReminderStatus.PENDING:
            return Response(
                {'detail': f"Cannot complete a reminder with status '{reminder.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        reminder = ReminderService.complete(reminder, request.user)
        return Response(ReminderSerializer(reminder).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, *args, **kwargs):
        reminder = self.get_object()
        if reminder.status != Reminder.ReminderStatus.PENDING:
            return Response(
                {'detail': f"Cannot cancel a reminder with status '{reminder.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        reminder = ReminderService.cancel(reminder, request.user)
        return Response(ReminderSerializer(reminder).data)
