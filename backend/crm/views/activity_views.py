"""
Activity Views
==============
Nested ViewSets for all activity entities under a Lead.

Routes (all nested under /leads/{lead_pk}/):
  followups/          — LeadFollowupViewSet
  appointments/       — AppointmentViewSet
  notes/              — LeadNoteViewSet
  attachments/        — LeadAttachmentViewSet
  timeline/           — LeadTimelineView (GET only)
  assignment-history/ — LeadAssignmentHistoryView (GET only)
"""

from rest_framework import status, filters
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from crm.models import (
    Lead, LeadFollowup, Appointment, LeadNote,
    LeadAttachment, LeadAssignmentHistory, LeadTimeline,
)
from crm.permissions import CanViewCRM, CanEditLead
from crm.serializers import (
    LeadFollowupSerializer, LeadFollowupCreateSerializer,
    AppointmentSerializer, AppointmentCreateSerializer,
    LeadNoteSerializer, LeadNoteCreateSerializer,
    LeadAttachmentSerializer,
    LeadAssignmentHistorySerializer,
    LeadTimelineSerializer,
)
from crm.services.timeline_service import TimelineService
from common.models import ActivityLog


def _get_lead(lead_pk, company):
    """Helper — retrieve lead and verify company ownership."""
    try:
        return Lead.objects.get(id=lead_pk, company=company, is_active=True)
    except Lead.DoesNotExist:
        return None


# ── Follow-ups ────────────────────────────────────────────────────────────────

@extend_schema(tags=['CRM — Follow-ups'])
class LeadFollowupViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names  = ['get', 'post', 'patch', 'delete', 'head', 'options']
    ordering = ['-created_at']

    def get_lead(self):
        return _get_lead(self.kwargs['lead_pk'], self.request.user.company)

    def get_queryset(self):
        lead = self.get_lead()
        if not lead:
            return LeadFollowup.objects.none()
        return lead.followups.filter(is_active=True).select_related('completed_by').order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return LeadFollowupCreateSerializer
        return LeadFollowupSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = self.get_lead()
        if not lead:
            return Response({'detail': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        from crm.services.interaction_service import InteractionService
        followup = InteractionService.log_interaction(lead, request.user, serializer.validated_data)
        return Response(LeadFollowupSerializer(followup).data, status=status.HTTP_201_CREATED)

    @extend_schema(summary='Mark a follow-up as completed')
    @__import__('rest_framework.decorators', fromlist=['action']).action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, lead_pk=None, pk=None):
        try:
            followup = self.get_queryset().get(pk=pk)
        except LeadFollowup.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            employee = request.user.employee_profile
        except Exception:
            employee = None
        followup.mark_complete(employee)
        return Response(LeadFollowupSerializer(followup).data)


# ── Appointments ──────────────────────────────────────────────────────────────

@extend_schema(tags=['CRM — Appointments'])
class AppointmentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names  = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_lead(self):
        return _get_lead(self.kwargs['lead_pk'], self.request.user.company)

    def get_queryset(self):
        lead = self.get_lead()
        if not lead:
            return Appointment.objects.none()
        return lead.appointments.filter(is_active=True).select_related('assigned_to').order_by('-start_time')

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = self.get_lead()
        if not lead:
            return Response({'detail': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        from crm.services.appointment_service import AppointmentService
        appt = AppointmentService.create_appointment(lead, request.user, serializer.validated_data)
        return Response(AppointmentSerializer(appt).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        appt = self.get_object()
        from crm.services.appointment_service import AppointmentService
        AppointmentService.update_appointment(appt, self.request.user, serializer.validated_data)

    def perform_destroy(self, instance):
        instance.soft_delete()
        # Log to ActivityLog + Timeline
        TimelineService._create(
            instance.lead, self.request.user,
            event_type=instance.lead.timeline.model.EventType.LEAD_UPDATED,
            title=f"Appointment deleted: {instance.title}",
            appointment_id=instance.id
        )
        ActivityLog.objects.create(
            company=instance.lead.company,
            user=self.request.user,
            activity_type='appointment_deleted',
            description=f"Appointment '{instance.title}' was deleted",
            related_model='Lead',
            related_object_id=instance.lead.id,
        )

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, lead_pk=None, pk=None):
        appt = self.get_object()
        outcome = request.data.get('outcome', '')
        remarks = request.data.get('remarks', '')
        from crm.services.appointment_service import AppointmentService
        appt = AppointmentService.complete_appointment(appt, request.user, outcome, remarks)
        return Response(AppointmentSerializer(appt).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, lead_pk=None, pk=None):
        appt = self.get_object()
        remarks = request.data.get('remarks', '')
        from crm.services.appointment_service import AppointmentService
        appt = AppointmentService.cancel_appointment(appt, request.user, remarks)
        return Response(AppointmentSerializer(appt).data)

    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, lead_pk=None, pk=None):
        appt = self.get_object()
        new_start_time = request.data.get('start_time')
        new_end_time = request.data.get('end_time')
        if not new_start_time:
            return Response({'detail': 'start_time is required'}, status=status.HTTP_400_BAD_REQUEST)
        from crm.services.appointment_service import AppointmentService
        appt = AppointmentService.reschedule_appointment(appt, request.user, new_start_time, new_end_time)
        return Response(AppointmentSerializer(appt).data)


# ── Notes ─────────────────────────────────────────────────────────────────────

@extend_schema(tags=['CRM — Notes'])
class LeadNoteViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names  = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_lead(self):
        return _get_lead(self.kwargs['lead_pk'], self.request.user.company)

    def get_queryset(self):
        lead = self.get_lead()
        if not lead:
            return LeadNote.objects.none()
        return lead.notes.filter(is_active=True).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return LeadNoteCreateSerializer
        return LeadNoteSerializer

    def perform_create(self, serializer):
        lead = self.get_lead()
        note = serializer.save(
            lead=lead,
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user,
        )
        TimelineService.note_added(lead, self.request.user, note)
        ActivityLog.objects.create(
            company=lead.company,
            user=self.request.user,
            activity_type='note_added',
            description=f"Added note to lead {lead.lead_number}",
            related_model='Lead',
            related_object_id=lead.id,
        )

    def perform_update(self, serializer):
        note = self.get_object()
        from django.utils import timezone
        
        # Archive current text in history list
        history_record = {
            'text': note.text,
            'updated_at': timezone.now().isoformat(),
            'updated_by': f"{self.request.user.first_name} {self.request.user.last_name}".strip() or self.request.user.username,
        }
        note_history = note.history or []
        note_history.append(history_record)
        
        updated_note = serializer.save(history=note_history, updated_by=self.request.user)
        
        TimelineService._create(
            updated_note.lead, self.request.user,
            event_type=updated_note.lead.timeline.model.EventType.NOTE_ADDED,
            title='Note updated',
            body=updated_note.text[:200],
            note_id=updated_note.id
        )
        ActivityLog.objects.create(
            company=updated_note.lead.company,
            user=self.request.user,
            activity_type='note_updated',
            description=f"Updated note on lead {updated_note.lead.lead_number}",
            related_model='Lead',
            related_object_id=updated_note.lead.id,
        )

    def perform_destroy(self, instance):
        instance.soft_delete()
        TimelineService._create(
            instance.lead, self.request.user,
            event_type=instance.lead.timeline.model.EventType.NOTE_ADDED,
            title='Note deleted',
            note_id=instance.id
        )
        ActivityLog.objects.create(
            company=instance.lead.company,
            user=self.request.user,
            activity_type='note_deleted',
            description=f"Deleted note from lead {instance.lead.lead_number}",
            related_model='Lead',
            related_object_id=instance.lead.id,
        )


# ── Attachments ───────────────────────────────────────────────────────────────

@extend_schema(tags=['CRM — Attachments'])
class LeadAttachmentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewCRM]
    parser_classes     = [MultiPartParser, FormParser]
    http_method_names  = ['get', 'post', 'delete', 'head', 'options']

    def get_lead(self):
        return _get_lead(self.kwargs['lead_pk'], self.request.user.company)

    def get_queryset(self):
        lead = self.get_lead()
        if not lead:
            return LeadAttachment.objects.none()
        return lead.attachments.filter(is_active=True).order_by('-created_at')

    def get_serializer_class(self):
        return LeadAttachmentSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, lead_pk=None):
        lead = self.get_lead()
        if not lead:
            return Response({'detail': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            emp = request.user.employee_profile
        except Exception:
            emp = None

        # Detect MIME / file type
        import mimetypes
        mime, _ = mimetypes.guess_type(file_obj.name)
        file_type = _infer_file_type(file_obj.name, mime)

        # Store with a namespaced path
        from django.core.files.storage import default_storage
        path = default_storage.save(f"crm/attachments/{lead.id}/{file_obj.name}", file_obj)

        attachment = LeadAttachment.objects.create(
            lead=lead,
            company=request.user.company,
            file_name=file_obj.name,
            file_path=path,
            file_size=file_obj.size,
            file_type=file_type,
            mime_type=mime or '',
            uploaded_by=emp,
            created_by=request.user,
            updated_by=request.user,
        )
        TimelineService.attachment_added(lead, request.user, attachment)
        return Response(
            LeadAttachmentSerializer(attachment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# ── Timeline ──────────────────────────────────────────────────────────────────

@extend_schema(tags=['CRM — Timeline'])
class LeadTimelineView(APIView):
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get(self, request, lead_pk):
        lead = _get_lead(lead_pk, request.user.company)
        if not lead:
            return Response({'detail': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)
        events = lead.timeline.select_related('performed_by').order_by('-performed_at')
        serializer = LeadTimelineSerializer(events, many=True)
        return Response(serializer.data)


# ── Assignment History ────────────────────────────────────────────────────────

@extend_schema(tags=['CRM — Assignment'])
class LeadAssignmentHistoryView(APIView):
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get(self, request, lead_pk):
        lead = _get_lead(lead_pk, request.user.company)
        if not lead:
            return Response({'detail': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)
        history = lead.assignment_history.select_related(
            'from_employee', 'to_employee', 'changed_by'
        ).order_by('-changed_at')
        serializer = LeadAssignmentHistorySerializer(history, many=True)
        return Response(serializer.data)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _infer_file_type(filename: str, mime: str | None) -> str:
    name = filename.lower()
    if name.endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg')):
        return 'image'
    if name.endswith('.pdf'):
        return 'pdf'
    if 'quotation' in name:
        return 'quotation'
    if 'survey' in name:
        return 'survey_report'
    if 'site' in name or 'photo' in name:
        return 'site_photo'
    return 'other'


def _create_followup_task(lead, followup, user):
    """Create a Dashboard Task for the next follow-up date."""
    try:
        from dashboard.models import Task
        Task.objects.create(
            company=lead.company,
            title=f"Follow up: {lead.full_name} ({followup.get_followup_type_display()})",
            description=followup.notes or '',
            due_date=followup.next_followup_date,
            status='pending',
            priority='medium',
            assigned_to=user,
            created_by=user,
            updated_by=user,
        )
    except Exception:
        pass  # Non-fatal
