"""
Timeline Service
=================
Append-only event log for leads.
All CRM actions go through here — views never write LeadTimeline directly.
"""

from django.utils import timezone
from crm.models import LeadTimeline


class TimelineService:

    @staticmethod
    def _create(lead, user, event_type: str, title: str, body: str = '', metadata: dict = None,
                 followup_id=None, note_id=None, appointment_id=None):
        LeadTimeline.objects.create(
            lead=lead,
            event_type=event_type,
            title=title,
            body=body or '',
            metadata=metadata,
            performed_by=user,
            performed_at=timezone.now(),
            related_followup_id=followup_id,
            related_note_id=note_id,
            related_appointment_id=appointment_id,
        )

    # ── Lead lifecycle ────────────────────────────────────────────────────────

    @classmethod
    def lead_created(cls, lead, user):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.LEAD_CREATED,
            title=f"Lead created — {lead.full_name}",
            metadata={'lead_number': lead.lead_number},
        )

    @classmethod
    def lead_updated(cls, lead, user, changed_fields: list):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.LEAD_UPDATED,
            title="Lead details updated",
            body=f"Fields changed: {', '.join(changed_fields)}",
            metadata={'fields': changed_fields},
        )

    # ── Stage ────────────────────────────────────────────────────────────────

    @classmethod
    def stage_changed(cls, lead, user, from_stage: str, to_stage: str):
        event = LeadTimeline.EventType.WON if lead.stage and lead.stage.is_won else \
                LeadTimeline.EventType.LOST if lead.stage and lead.stage.is_lost else \
                LeadTimeline.EventType.STAGE_CHANGED
        cls._create(
            lead, user,
            event_type=event,
            title=f"Stage changed: {from_stage} → {to_stage}",
            metadata={'from': from_stage, 'to': to_stage},
        )

    # ── Assignment ───────────────────────────────────────────────────────────

    @classmethod
    def lead_assigned(cls, lead, user, from_emp, to_emp):
        from_name = f"{from_emp.first_name} {from_emp.last_name}".strip() if from_emp else 'Unassigned'
        to_name = f"{to_emp.first_name} {to_emp.last_name}".strip() if to_emp else 'Unassigned'
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.ASSIGNED,
            title=f"Assigned to {to_name}",
            body=f"Previously assigned to: {from_name}",
            metadata={'from': from_name, 'to': to_name},
        )

    # ── Follow-ups ───────────────────────────────────────────────────────────

    @classmethod
    def followup_logged(cls, lead, user, followup):
        type_map = {
            'call': LeadTimeline.EventType.CALL_LOGGED,
            'whatsapp': LeadTimeline.EventType.WHATSAPP_SENT,
            'email': LeadTimeline.EventType.EMAIL_SENT,
            'site_visit': LeadTimeline.EventType.SITE_VISIT,
            'office_meeting': LeadTimeline.EventType.FOLLOWUP_LOGGED,
            'online_meeting': LeadTimeline.EventType.FOLLOWUP_LOGGED,
            'other': LeadTimeline.EventType.FOLLOWUP_LOGGED,
        }
        event = type_map.get(followup.followup_type, LeadTimeline.EventType.FOLLOWUP_LOGGED)
        cls._create(
            lead, user,
            event_type=event,
            title=f"{followup.get_followup_type_display()} logged",
            body=followup.notes or '',
            metadata={'followup_type': followup.followup_type, 'next_date': str(followup.next_followup_date)},
            followup_id=followup.id,
        )

    # ── Notes ────────────────────────────────────────────────────────────────

    @classmethod
    def note_added(cls, lead, user, note):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.NOTE_ADDED,
            title='Note added',
            body=note.text[:200],
            note_id=note.id,
        )

    # ── Attachments ──────────────────────────────────────────────────────────

    @classmethod
    def attachment_added(cls, lead, user, attachment):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.ATTACHMENT_ADDED,
            title=f"Attachment uploaded: {attachment.file_name}",
            metadata={'file_type': attachment.file_type, 'file_name': attachment.file_name},
        )

    # ── Appointments ─────────────────────────────────────────────────────────

    @classmethod
    def appointment_created(cls, lead, user, appointment):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.APPOINTMENT_CREATED,
            title=f"Appointment: {appointment.title}",
            body=f"Scheduled for {appointment.start_time.strftime('%d %b %Y %H:%M')}",
            metadata={'appointment_type': appointment.appointment_type},
            appointment_id=appointment.id,
        )

    @classmethod
    def appointment_completed(cls, lead, user, appointment):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.APPOINTMENT_DONE,
            title=f"Appointment completed: {appointment.title}",
            appointment_id=appointment.id,
        )

    # ── Conversion ───────────────────────────────────────────────────────────

    @classmethod
    def lead_converted(cls, lead, user, customer_id=None):
        cls._create(
            lead, user,
            event_type=LeadTimeline.EventType.CONVERTED,
            title="Lead converted to Customer",
            metadata={'customer_id': str(customer_id) if customer_id else None},
        )
