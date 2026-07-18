from django.utils import timezone
from django.db import transaction
from crm.models import LeadFollowup
from crm.services.timeline_service import TimelineService
from common.models import ActivityLog
from crm.services.score_service import ScoreService
from dashboard.services.notification_service import NotificationService

class InteractionService:

    @staticmethod
    @transaction.atomic
    def log_interaction(lead, user, data) -> LeadFollowup:
        followup = LeadFollowup.objects.create(
            lead=lead,
            company=lead.company,
            created_by=user,
            updated_by=user,
            followup_type=data['followup_type'],
            notes=data.get('notes', ''),
            next_followup_date=data.get('next_followup_date'),
            date=data.get('date', timezone.now()),
            duration=data.get('duration'),
            outcome=data.get('outcome'),
            assigned_to_id=data.get('assigned_to'),
            status=LeadFollowup.FollowupStatus.COMPLETED,
            completed_at=timezone.now(),
            completed_by=getattr(user, 'employee_profile', None),
        )

        # Update lead dates
        lead.last_contact_date = followup.date.date()
        if followup.next_followup_date:
            lead.next_followup_date = followup.next_followup_date
        lead.save(update_fields=['last_contact_date', 'next_followup_date'])

        # Recalculate lead score
        lead.lead_score = ScoreService.calculate(lead)
        lead.save(update_fields=['lead_score'])

        # Log timeline
        TimelineService.followup_logged(lead, user, followup)

        # Log Activity
        ActivityLog.objects.create(
            company=lead.company,
            user=user,
            activity_type=f"crm_{followup.followup_type}_logged",
            description=f"{followup.get_followup_type_display()} logged for lead {lead.lead_number}",
            related_model='Lead',
            related_object_id=lead.id,
        )

        # Create Task for next followup if specified
        if followup.next_followup_date:
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
                )
            except Exception:
                pass

        # Create a notification reminder if specified in metadata
        if data.get('schedule_reminder'):
            remind_time = data.get('reminder_time')
            if remind_time:
                # Notify now or schedule (for simulation, we create a notification entry)
                NotificationService.create_notification(
                    user=user,
                    company=lead.company,
                    title='Follow-up Reminder scheduled',
                    message=f"Reminder scheduled: Follow up with {lead.full_name} on {remind_time}",
                    notification_type='task',
                    related_url=f'/crm/{lead.id}',
                    related_module='crm',
                    related_object_id=lead.id,
                )

        return followup
