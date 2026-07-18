from crm.models import Appointment, LeadFollowup, LeadNote, LeadTimeline
from crm.serializers.activity_serializers import (
    AppointmentSerializer, LeadFollowupSerializer, LeadNoteSerializer, LeadTimelineSerializer
)

class BusinessHistoryService:

    @classmethod
    def get_history(cls, lead) -> list:
        history = []

        # 1. Timeline events
        timeline_events = LeadTimeline.objects.filter(lead=lead).select_related('performed_by').order_by('-performed_at')
        for te in timeline_events:
            history.append({
                'id': f"timeline-{te.id}",
                'type': 'timeline',
                'title': te.title,
                'description': te.body or '',
                'date': te.performed_at,
                'user': f"{te.performed_by.first_name} {te.performed_by.last_name}".strip() if te.performed_by else 'System',
                'meta': te.metadata or {}
            })

        # 2. Appointments
        appointments = Appointment.objects.filter(lead=lead).select_related('assigned_to', 'completed_by').order_by('-start_time')
        for appt in appointments:
            history.append({
                'id': f"appt-{appt.id}",
                'type': 'appointment',
                'title': f"Appointment: {appt.title} ({appt.get_appointment_type_display()})",
                'description': f"Status: {appt.get_status_display()}. Notes: {appt.notes or ''}. Remarks: {appt.remarks or ''}",
                'date': appt.start_time,
                'user': f"{appt.assigned_to.first_name} {appt.assigned_to.last_name}".strip() if appt.assigned_to else 'Unassigned',
                'meta': {
                    'status': appt.status,
                    'outcome': appt.outcome,
                    'priority': appt.priority,
                    'location': appt.location,
                    'meeting_link': appt.meeting_link,
                }
            })

        # 3. Interactions (Follow-ups)
        followups = LeadFollowup.objects.filter(lead=lead, is_active=True).select_related('completed_by', 'assigned_to').order_by('-created_at')
        for f in followups:
            history.append({
                'id': f"followup-{f.id}",
                'type': 'interaction',
                'title': f"Interaction: {f.get_followup_type_display()}",
                'description': f.notes or '',
                'date': f.date if hasattr(f, 'date') else f.created_at,
                'user': f"{f.completed_by.first_name} {f.completed_by.last_name}".strip() if f.completed_by else 'System',
                'meta': {
                    'duration': getattr(f, 'duration', None),
                    'outcome': getattr(f, 'outcome', None),
                    'status': f.status,
                }
            })

        # 4. Notes
        notes = LeadNote.objects.filter(lead=lead).select_related('created_by').order_by('-created_at')
        for n in notes:
            history.append({
                'id': f"note-{n.id}",
                'type': 'note',
                'title': 'Note added',
                'description': n.text,
                'date': n.created_at,
                'user': f"{n.created_by.first_name} {n.created_by.last_name}".strip() if n.created_by else 'Unknown',
                'meta': {
                    'pinned': n.pinned,
                }
            })

        # Sort the combined history by date descending
        history.sort(key=lambda x: x['date'], reverse=True)
        return history
