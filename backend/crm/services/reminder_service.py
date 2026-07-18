"""
Reminder Service
================
Business logic for CRM lead reminders.

Every action:
  - Writes to LeadTimeline
  - Writes to ActivityLog
  - Sends a Notification to the assigned user
  - Is wrapped in transaction.atomic()
"""

from django.db import transaction
from django.utils import timezone

from crm.models import Reminder
from crm.services.timeline_service import TimelineService
from common.models import ActivityLog


class ReminderService:

    @staticmethod
    @transaction.atomic
    def create(lead, user, data: dict) -> Reminder:
        """
        Create a new reminder for a lead.
        Notifies the assigned employee if specified.
        """
        assigned_to_id = data.get('assigned_to')
        assigned_to = None
        if assigned_to_id:
            from users.models import EmployeeProfile
            try:
                assigned_to = EmployeeProfile.objects.get(
                    id=assigned_to_id, company=lead.company, is_active=True
                )
            except EmployeeProfile.DoesNotExist:
                pass

        reminder = Reminder.objects.create(
            lead=lead,
            company=lead.company,
            created_by=user,
            updated_by=user,
            title=data['title'],
            description=data.get('description', ''),
            reminder_type=data.get('reminder_type', Reminder.ReminderType.CALL),
            priority=data.get('priority', Reminder.ReminderPriority.MEDIUM),
            remind_at=data['remind_at'],
            assigned_to=assigned_to,
        )

        # Timeline
        TimelineService._create(
            lead, user,
            event_type='lead_updated',
            title=f"Reminder set: {reminder.title}",
            body=f"Scheduled for {reminder.remind_at.strftime('%d %b %Y %H:%M')}",
            metadata={
                'reminder_id': str(reminder.id),
                'reminder_type': reminder.reminder_type,
                'remind_at': reminder.remind_at.isoformat(),
            }
        )

        # Activity Log
        ActivityLog.objects.create(
            company=lead.company,
            user=user,
            activity_type='reminder_created',
            description=f"Reminder '{reminder.title}' created for lead {lead.lead_number}",
            related_model='Lead',
            related_object_id=lead.id,
        )

        # Notification to assigned user
        ReminderService._notify_assigned(reminder, lead, user, 'Reminder Scheduled')

        return reminder

    @staticmethod
    @transaction.atomic
    def update(reminder: Reminder, user, data: dict) -> Reminder:
        """Update reminder fields."""
        updatable = ['title', 'description', 'reminder_type', 'priority', 'remind_at']
        for field in updatable:
            if field in data:
                setattr(reminder, field, data[field])

        if 'assigned_to' in data:
            assigned_to_id = data['assigned_to']
            if assigned_to_id:
                from users.models import EmployeeProfile
                try:
                    reminder.assigned_to = EmployeeProfile.objects.get(
                        id=assigned_to_id, company=reminder.lead.company
                    )
                except EmployeeProfile.DoesNotExist:
                    pass
            else:
                reminder.assigned_to = None

        reminder.updated_by = user
        reminder.save()

        ActivityLog.objects.create(
            company=reminder.lead.company,
            user=user,
            activity_type='reminder_updated',
            description=f"Reminder '{reminder.title}' updated for lead {reminder.lead.lead_number}",
            related_model='Lead',
            related_object_id=reminder.lead.id,
        )
        return reminder

    @staticmethod
    @transaction.atomic
    def complete(reminder: Reminder, user) -> Reminder:
        """Mark reminder as completed."""
        reminder.complete()
        reminder.updated_by = user
        reminder.save(update_fields=['updated_at', 'updated_by'])

        TimelineService._create(
            reminder.lead, user,
            event_type='lead_updated',
            title=f"Reminder completed: {reminder.title}",
            metadata={'reminder_id': str(reminder.id)}
        )
        ActivityLog.objects.create(
            company=reminder.lead.company,
            user=user,
            activity_type='reminder_completed',
            description=f"Reminder '{reminder.title}' completed for lead {reminder.lead.lead_number}",
            related_model='Lead',
            related_object_id=reminder.lead.id,
        )
        return reminder

    @staticmethod
    @transaction.atomic
    def cancel(reminder: Reminder, user) -> Reminder:
        """Cancel a pending reminder."""
        reminder.cancel()
        reminder.updated_by = user
        reminder.save(update_fields=['updated_at', 'updated_by'])

        ActivityLog.objects.create(
            company=reminder.lead.company,
            user=user,
            activity_type='reminder_cancelled',
            description=f"Reminder '{reminder.title}' cancelled for lead {reminder.lead.lead_number}",
            related_model='Lead',
            related_object_id=reminder.lead.id,
        )
        return reminder

    @staticmethod
    def get_upcoming(lead) -> 'QuerySet':
        """Return all pending reminders for a lead, ordered by remind_at."""
        return Reminder.objects.filter(
            lead=lead, status=Reminder.ReminderStatus.PENDING, is_active=True
        ).select_related('assigned_to').order_by('remind_at')

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _notify_assigned(reminder, lead, created_by, event_title):
        """Send a notification to the assigned employee (if set)."""
        try:
            target_user = None
            if reminder.assigned_to and hasattr(reminder.assigned_to, 'user'):
                target_user = reminder.assigned_to.user
            else:
                # Fall back to the creator
                target_user = created_by

            if target_user:
                from dashboard.services.notification_service import NotificationService
                NotificationService.create_notification(
                    user=target_user,
                    company=lead.company,
                    title=event_title,
                    message=f"Reminder: {reminder.title} — Lead {lead.full_name} on {reminder.remind_at.strftime('%d %b %Y %H:%M')}",
                    notification_type='task',
                    related_url=f'/crm/{lead.id}',
                    related_module='crm',
                    related_object_id=lead.id,
                )
        except Exception:
            pass  # Non-fatal
