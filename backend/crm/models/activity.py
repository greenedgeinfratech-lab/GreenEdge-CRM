"""
CRM Activity Models
====================
All activity / interaction entities attached to a Lead:

  LeadFollowup         — Call, visit, meeting log
  Appointment          — Scheduled appointments
  LeadNote             — Immutable notes (append-only)
  LeadAttachment       — Files (images, PDFs, etc.)
  LeadAssignmentHistory — Ownership change trail
  LeadTimeline         — Unified chronological event feed
"""

from django.db import models
from django.utils import timezone

from common.models import TenantBaseModel


# ─── Follow-ups ─────────────────────────────────────────────────────────────────

class LeadFollowup(TenantBaseModel):
    """
    Records an interaction attempt (call, visit, meeting, WhatsApp, email).
    On creation: updates lead.next_followup_date and triggers a Dashboard Task.
    """

    class FollowupType(models.TextChoices):
        CALL           = 'call',            'Call'
        WHATSAPP       = 'whatsapp',        'WhatsApp'
        EMAIL          = 'email',           'Email'
        OFFICE_MEETING = 'office_meeting',  'Office Meeting'
        SITE_VISIT     = 'site_visit',      'Site Visit'
        ONLINE_MEETING = 'online_meeting',  'Online Meeting'
        VIDEO_CALL     = 'video_call',      'Video Call'
        OTHER          = 'other',           'Other'

    class FollowupStatus(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        COMPLETED = 'completed', 'Completed'
        MISSED    = 'missed',    'Missed'
        CANCELLED = 'cancelled', 'Cancelled'

    lead              = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, related_name='followups')
    followup_type     = models.CharField(max_length=20, choices=FollowupType.choices, default=FollowupType.CALL)
    notes             = models.TextField(blank=True, null=True)
    next_followup_date = models.DateField(null=True, blank=True)
    completed_at      = models.DateTimeField(null=True, blank=True)
    completed_by      = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='completed_followups'
    )
    status = models.CharField(
        max_length=15, choices=FollowupStatus.choices, default=FollowupStatus.PENDING
    )
    
    # Detailed Interaction Log fields
    date              = models.DateTimeField(default=timezone.now)
    duration          = models.PositiveIntegerField(null=True, blank=True, help_text="Duration in minutes")
    outcome           = models.CharField(max_length=255, null=True, blank=True)
    assigned_to       = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_followups'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lead', 'status']),
            models.Index(fields=['company', 'next_followup_date']),
        ]

    def __str__(self):
        return f"{self.lead_id} — {self.get_followup_type_display()} ({self.status})"

    def mark_complete(self, employee):
        self.status = self.FollowupStatus.COMPLETED
        self.completed_at = timezone.now()
        self.completed_by = employee
        self.save(update_fields=['status', 'completed_at', 'completed_by', 'updated_at'])


# ─── Appointments ───────────────────────────────────────────────────────────────

class Appointment(TenantBaseModel):
    """
    Scheduled appointments with leads.
    Creating an appointment: generates a Notification + ActivityLog entry.
    """

    class AppointmentType(models.TextChoices):
        CALL           = 'call',            'Call'
        OFFICE_MEETING = 'office_meeting',  'Office Meeting'
        SITE_VISIT     = 'site_visit',      'Site Visit'
        ONLINE_MEETING = 'online_meeting',  'Online Meeting'

    class AppointmentStatus(models.TextChoices):
        SCHEDULED  = 'scheduled',  'Scheduled'
        COMPLETED  = 'completed',  'Completed'
        CANCELLED  = 'cancelled',  'Cancelled'
        RESCHEDULED = 'rescheduled', 'Rescheduled'
        NO_SHOW    = 'no_show',    'No Show'

    class ReminderType(models.TextChoices):
        EMAIL      = 'email',      'Email'
        SYSTEM     = 'system',     'System'
        WHATSAPP   = 'whatsapp',   'WhatsApp'

    class Priority(models.TextChoices):
        HIGH       = 'high',       'High'
        MEDIUM     = 'medium',     'Medium'
        LOW        = 'low',        'Low'

    lead              = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, related_name='appointments')
    appointment_type  = models.CharField(max_length=20, choices=AppointmentType.choices)
    title             = models.CharField(max_length=200)
    notes             = models.TextField(blank=True, null=True)
    start_time        = models.DateTimeField()
    end_time          = models.DateTimeField(null=True, blank=True)
    assigned_to       = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='appointments'
    )
    status            = models.CharField(
        max_length=15, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED
    )
    location          = models.CharField(max_length=300, blank=True, null=True)
    meeting_link      = models.URLField(blank=True, null=True)

    # New fields for Biziverse replica
    reminder          = models.BooleanField(default=False)
    reminder_type     = models.CharField(max_length=20, choices=ReminderType.choices, blank=True, null=True)
    priority          = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    outcome           = models.CharField(max_length=255, blank=True, null=True)
    remarks           = models.TextField(blank=True, null=True)
    completed_by      = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='completed_appointments'
    )

    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['lead', 'status']),
            models.Index(fields=['company', 'start_time']),
            models.Index(fields=['assigned_to', 'start_time']),
        ]

    def __str__(self):
        return f"{self.title} — {self.start_time.date()}"


# ─── Notes ──────────────────────────────────────────────────────────────────────

class LeadNote(TenantBaseModel):
    """
    Immutable notes attached to a lead.
    Notes are NEVER overwritten — only new notes are appended.
    Delete is soft-delete only via TenantBaseModel.
    """
    lead    = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, related_name='notes')
    text    = models.TextField()
    pinned  = models.BooleanField(default=False)
    is_rich_text = models.BooleanField(default=True)
    mentions = models.ManyToManyField('users.EmployeeProfile', blank=True, related_name='mentioned_in_notes')
    attachments = models.ManyToManyField('crm.LeadAttachment', blank=True, related_name='notes')
    history = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lead']),
        ]

    def __str__(self):
        return f"Note on lead {self.lead_id}"


# ─── Attachments ────────────────────────────────────────────────────────────────

class LeadAttachment(TenantBaseModel):
    """
    File attachments on leads.
    Integrates with the existing FileUploadService via `file_path`.
    """

    class AttachmentType(models.TextChoices):
        IMAGE         = 'image',         'Image'
        PDF           = 'pdf',           'PDF'
        QUOTATION     = 'quotation',     'Quotation'
        SURVEY_REPORT = 'survey_report', 'Survey Report'
        SITE_PHOTO    = 'site_photo',    'Site Photo'
        OTHER         = 'other',         'Other'

    lead            = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, related_name='attachments')
    file_name       = models.CharField(max_length=255)
    file_path       = models.CharField(max_length=512)   # Relative path via FileUploadService
    file_size       = models.PositiveIntegerField(null=True, blank=True, help_text='Bytes')
    file_type       = models.CharField(max_length=20, choices=AttachmentType.choices, default=AttachmentType.OTHER)
    mime_type       = models.CharField(max_length=100, blank=True, null=True)
    uploaded_by     = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='crm_attachments'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name


# ─── Assignment History ─────────────────────────────────────────────────────────

class LeadAssignmentHistory(models.Model):
    """
    Immutable log of every ownership change on a lead.
    NOT soft-deleteable — this is an audit record.
    """
    id           = models.BigAutoField(primary_key=True)
    lead         = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, related_name='assignment_history')
    from_employee = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='led_from_assignments'
    )
    to_employee  = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='led_to_assignments'
    )
    changed_by   = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, related_name='crm_assignment_changes'
    )
    changed_at   = models.DateTimeField(auto_now_add=True)
    reason       = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"Lead {self.lead_id} reassigned at {self.changed_at}"


# ─── Timeline ───────────────────────────────────────────────────────────────────

class LeadTimeline(models.Model):
    """
    Unified, chronological event feed for a lead.

    All activity types collapse into this timeline:
      - Lead created / updated
      - Stage changed
      - Assigned / reassigned
      - Followup logged (call, visit, meeting, ...)
      - Note added
      - Attachment uploaded
      - Appointment scheduled / completed
      - Won / Lost / Converted

    This is append-only. No updates. No deletes.
    """

    class EventType(models.TextChoices):
        LEAD_CREATED      = 'lead_created',      'Lead Created'
        LEAD_UPDATED      = 'lead_updated',       'Lead Updated'
        STAGE_CHANGED     = 'stage_changed',      'Stage Changed'
        ASSIGNED          = 'assigned',           'Assigned'
        FOLLOWUP_LOGGED   = 'followup_logged',    'Follow-up Logged'
        CALL_LOGGED       = 'call_logged',        'Call Logged'
        WHATSAPP_SENT     = 'whatsapp_sent',      'WhatsApp Sent'
        EMAIL_SENT        = 'email_sent',         'Email Sent'
        SITE_VISIT        = 'site_visit',         'Site Visit'
        NOTE_ADDED        = 'note_added',         'Note Added'
        ATTACHMENT_ADDED  = 'attachment_added',   'Attachment Added'
        APPOINTMENT_CREATED = 'appointment_created', 'Appointment Created'
        APPOINTMENT_DONE  = 'appointment_done',   'Appointment Completed'
        WON               = 'won',                'Won'
        LOST              = 'lost',               'Lost'
        CONVERTED         = 'converted',          'Converted'
        SCORE_UPDATED     = 'score_updated',      'Score Updated'
        DUPLICATE_FLAGGED = 'duplicate_flagged',  'Duplicate Flagged'

    id         = models.BigAutoField(primary_key=True)
    lead       = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, related_name='timeline')
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    title      = models.CharField(max_length=255)
    body       = models.TextField(blank=True, null=True)
    metadata   = models.JSONField(null=True, blank=True, help_text='Structured event data (old/new values, etc.)')
    performed_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='crm_timeline_events'
    )
    performed_at = models.DateTimeField(default=timezone.now)

    # Optional back-refs for linking to specific objects
    related_followup_id   = models.UUIDField(null=True, blank=True)
    related_note_id       = models.UUIDField(null=True, blank=True)
    related_appointment_id = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['lead', 'performed_at']),
            models.Index(fields=['lead', 'event_type']),
        ]

    def __str__(self):
        return f"{self.event_type} on lead {self.lead_id} @ {self.performed_at}"
