"""
CRM Reminder Model
==================
Dedicated reminder entity for CRM leads.

Reminders are distinct from Notifications:
  - Notifications are system-generated alerts.
  - Reminders are user-created, proactive follow-up actions.

Each reminder generates:
  - A Timeline entry on creation/completion
  - An ActivityLog entry
  - A Dashboard Notification for the assigned user
"""

import uuid
from django.db import models
from django.utils import timezone

from common.models import TenantBaseModel


class Reminder(TenantBaseModel):
    """
    User-created reminder tied to a Lead.

    Lifecycle: PENDING → COMPLETED | CANCELLED
    Every status change writes to ActivityLog and LeadTimeline.
    """

    class ReminderType(models.TextChoices):
        CALL      = 'call',      'Call'
        EMAIL     = 'email',     'Email'
        WHATSAPP  = 'whatsapp',  'WhatsApp'
        VISIT     = 'visit',     'Visit'
        MEETING   = 'meeting',   'Meeting'
        CUSTOM    = 'custom',    'Custom'

    class ReminderStatus(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class ReminderPriority(models.TextChoices):
        LOW    = 'low',    'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH   = 'high',   'High'
        URGENT = 'urgent', 'Urgent'

    lead = models.ForeignKey(
        'crm.Lead', on_delete=models.CASCADE, related_name='reminders'
    )
    assigned_to = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='crm_reminders'
    )

    title             = models.CharField(max_length=255)
    description       = models.TextField(blank=True, null=True)
    reminder_type     = models.CharField(max_length=20, choices=ReminderType.choices, default=ReminderType.CALL)
    priority          = models.CharField(max_length=10, choices=ReminderPriority.choices, default=ReminderPriority.MEDIUM)
    status            = models.CharField(max_length=15, choices=ReminderStatus.choices, default=ReminderStatus.PENDING)
    remind_at         = models.DateTimeField()
    completed_at      = models.DateTimeField(null=True, blank=True)
    notification_sent = models.BooleanField(default=False)

    # Future: recurring reminder rules (JSON spec)
    repeat_rule = models.JSONField(null=True, blank=True, help_text='Recurring schedule spec — reserved for future use')

    class Meta:
        ordering = ['remind_at']
        indexes = [
            models.Index(fields=['lead', 'status']),
            models.Index(fields=['company', 'remind_at']),
            models.Index(fields=['assigned_to', 'remind_at']),
        ]

    def __str__(self):
        return f"Reminder: {self.title} — {self.remind_at.strftime('%d %b %Y %H:%M')}"

    def complete(self):
        self.status = self.ReminderStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])

    def cancel(self):
        self.status = self.ReminderStatus.CANCELLED
        self.save(update_fields=['status', 'updated_at'])
