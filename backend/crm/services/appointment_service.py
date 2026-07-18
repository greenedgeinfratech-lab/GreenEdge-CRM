from django.utils import timezone
from django.db import transaction
from crm.models import Appointment
from crm.services.timeline_service import TimelineService
from common.models import ActivityLog
from dashboard.services.notification_service import NotificationService
from crm.services.score_service import ScoreService

class AppointmentService:

    @staticmethod
    @transaction.atomic
    def create_appointment(lead, user, data) -> Appointment:
        appt = Appointment.objects.create(
            lead=lead,
            company=lead.company,
            created_by=user,
            updated_by=user,
            appointment_type=data['appointment_type'],
            title=data['title'],
            notes=data.get('notes', ''),
            start_time=data['start_time'],
            end_time=data.get('end_time'),
            assigned_to_id=data.get('assigned_to'),
            location=data.get('location', ''),
            meeting_link=data.get('meeting_link', ''),
            reminder=data.get('reminder', False),
            reminder_type=data.get('reminder_type'),
            priority=data.get('priority', 'medium'),
        )
        
        # Timeline and Activity Log
        TimelineService.appointment_created(lead, user, appt)
        
        ActivityLog.objects.create(
            company=lead.company,
            user=user,
            activity_type='appointment_created',
            description=f"Appointment '{appt.title}' scheduled for lead {lead.lead_number}",
            related_model='Lead',
            related_object_id=lead.id,
        )

        # Notify Assignee
        if appt.assigned_to and hasattr(appt.assigned_to, 'user') and appt.assigned_to.user:
            NotificationService.create_notification(
                user=appt.assigned_to.user,
                company=lead.company,
                title='Appointment Scheduled',
                message=f"You have a {appt.get_appointment_type_display()} with {lead.full_name} on {appt.start_time.strftime('%d %b %Y %H:%M')}",
                notification_type='task',
                related_url=f'/crm/{lead.id}',
                related_module='crm',
                related_object_id=lead.id,
            )

        # Recalculate score
        lead.lead_score = ScoreService.calculate(lead)
        lead.save(update_fields=['lead_score'])

        return appt

    @staticmethod
    @transaction.atomic
    def update_appointment(appt, user, data) -> Appointment:
        for field in ['appointment_type', 'title', 'notes', 'start_time', 'end_time', 'location', 'meeting_link', 'reminder', 'reminder_type', 'priority', 'assigned_to']:
            if field in data:
                if field == 'assigned_to':
                    appt.assigned_to_id = data[field]
                else:
                    setattr(appt, field, data[field])
        
        appt.updated_by = user
        appt.save()

        # Log timeline
        TimelineService._create(
            appt.lead, user,
            event_type=appt.lead.timeline.model.EventType.LEAD_UPDATED,
            title=f"Appointment updated: {appt.title}",
            appointment_id=appt.id,
        )

        # Activity Log
        ActivityLog.objects.create(
            company=appt.lead.company,
            user=user,
            activity_type='appointment_updated',
            description=f"Appointment '{appt.title}' updated for lead {appt.lead.lead_number}",
            related_model='Lead',
            related_object_id=appt.lead.id,
        )

        return appt

    @staticmethod
    @transaction.atomic
    def complete_appointment(appt, user, outcome, remarks) -> Appointment:
        appt.status = Appointment.AppointmentStatus.COMPLETED
        appt.outcome = outcome
        appt.remarks = remarks
        appt.completed_by = getattr(user, 'employee_profile', None)
        appt.updated_by = user
        appt.save()

        TimelineService.appointment_completed(appt.lead, user, appt)

        ActivityLog.objects.create(
            company=appt.lead.company,
            user=user,
            activity_type='appointment_completed',
            description=f"Appointment '{appt.title}' completed: {outcome}",
            related_model='Lead',
            related_object_id=appt.lead.id,
        )

        # Recalculate lead score
        appt.lead.lead_score = ScoreService.calculate(appt.lead)
        appt.lead.save(update_fields=['lead_score'])

        return appt

    @staticmethod
    @transaction.atomic
    def cancel_appointment(appt, user, remarks='') -> Appointment:
        appt.status = Appointment.AppointmentStatus.CANCELLED
        appt.remarks = remarks
        appt.updated_by = user
        appt.save()

        TimelineService._create(
            appt.lead, user,
            event_type=appt.lead.timeline.model.EventType.LEAD_UPDATED,
            title=f"Appointment cancelled: {appt.title}",
            body=remarks,
            appointment_id=appt.id,
        )

        ActivityLog.objects.create(
            company=appt.lead.company,
            user=user,
            activity_type='appointment_cancelled',
            description=f"Appointment '{appt.title}' was cancelled",
            related_model='Lead',
            related_object_id=appt.lead.id,
        )

        # Recalculate score
        appt.lead.lead_score = ScoreService.calculate(appt.lead)
        appt.lead.save(update_fields=['lead_score'])

        return appt

    @staticmethod
    @transaction.atomic
    def reschedule_appointment(appt, user, new_start_time, new_end_time=None) -> Appointment:
        old_time = appt.start_time.strftime('%d %b %Y %H:%M')
        appt.start_time = new_start_time
        if new_end_time:
            appt.end_time = new_end_time
        appt.status = Appointment.AppointmentStatus.RESCHEDULED
        appt.updated_by = user
        appt.save()

        new_time_str = appt.start_time.strftime('%d %b %Y %H:%M')

        TimelineService._create(
            appt.lead, user,
            event_type=appt.lead.timeline.model.EventType.LEAD_UPDATED,
            title=f"Appointment rescheduled: {appt.title}",
            body=f"Moved from {old_time} to {new_time_str}",
            appointment_id=appt.id,
        )

        ActivityLog.objects.create(
            company=appt.lead.company,
            user=user,
            activity_type='appointment_rescheduled',
            description=f"Appointment '{appt.title}' rescheduled to {new_time_str}",
            related_model='Lead',
            related_object_id=appt.lead.id,
        )

        return appt
