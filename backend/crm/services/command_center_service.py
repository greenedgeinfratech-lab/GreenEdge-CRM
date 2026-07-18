from django.db.models import Count, Q
from crm.models import Lead, Appointment, LeadFollowup, LeadNote, Reminder
from crm.serializers.lead_serializers import LeadDetailSerializer
from crm.serializers.activity_serializers import (
    AppointmentSerializer, LeadFollowupSerializer, LeadNoteSerializer,
    LeadTimelineSerializer, LeadAttachmentSerializer,
)
from crm.serializers.reminder_serializers import ReminderSerializer
from crm.models import LeadTimeline, LeadAttachment
from crm.services.score_service import ScoreService


class LeadCommandCenterService:
    @classmethod
    def get_command_center_data(cls, lead_id: str, user, company, request=None) -> dict:
        """
        Aggregates all data for the Lead Command Center in a single optimized query.
        Passing `request` enables absolute file URLs in attachment serializers.
        """
        # 1. Fetch Lead with optimized related fields
        try:
            lead = Lead.objects.select_related(
                'stage', 'source', 'assigned_to', 'lost_reason'
            ).prefetch_related(
                'tags', 'products'
            ).get(id=lead_id, company=company, is_active=True)
        except Lead.DoesNotExist:
            return None

        # Serialize Lead
        lead_data = LeadDetailSerializer(lead, context={'request': request}).data

        # Override score with detailed engine result
        lead_data['lead_score_details'] = ScoreService.get_detailed_score(lead)

        # 2. Fetch Appointments (optimized)
        appointments = Appointment.objects.filter(lead=lead).select_related(
            'assigned_to', 'created_by', 'completed_by'
        ).order_by('-start_time')
        appointments_data = AppointmentSerializer(appointments, many=True).data

        # 3. Fetch Followups
        followups = LeadFollowup.objects.filter(lead=lead, is_active=True).select_related(
            'completed_by', 'assigned_to'
        ).order_by('-created_at')
        followups_data = LeadFollowupSerializer(followups, many=True).data

        # 4. Fetch Notes
        notes = LeadNote.objects.filter(
            lead=lead, is_active=True
        ).prefetch_related('mentions', 'attachments').order_by('-pinned', '-created_at')
        notes_data = LeadNoteSerializer(notes, many=True).data

        # 5. Fetch Timeline
        timeline = LeadTimeline.objects.filter(lead=lead).select_related(
            'performed_by'
        ).order_by('-performed_at')
        timeline_data = LeadTimelineSerializer(timeline, many=True).data

        # 6. Fetch Attachments (with absolute URLs via request)
        attachments = LeadAttachment.objects.filter(
            lead=lead, is_active=True
        ).select_related('uploaded_by').order_by('-created_at')
        attachments_data = LeadAttachmentSerializer(
            attachments, many=True, context={'request': request}
        ).data

        # 7. Fetch Reminders (pending first)
        reminders = Reminder.objects.filter(
            lead=lead, is_active=True
        ).select_related('assigned_to').order_by('status', 'remind_at')
        reminders_data = ReminderSerializer(reminders, many=True).data

        # 8. Statistics (Aggregations)
        stats = {
            'total_interactions': followups.count() + appointments.count(),
            'completed_appointments': appointments.filter(status='completed').count(),
            'pending_followups': followups.filter(status='pending').count(),
            'notes_count': notes.count(),
            'pending_reminders': reminders.filter(status='pending').count(),
        }

        # 9. Assemble Payload
        from crm.services.business_history_service import BusinessHistoryService
        return {
            'lead': lead_data,
            'appointments': appointments_data,
            'followups': followups_data,
            'notes': notes_data,
            'timeline': timeline_data,
            'attachments': attachments_data,
            'reminders': reminders_data,
            'statistics': stats,
            'business_history': BusinessHistoryService.get_history(lead),
        }
