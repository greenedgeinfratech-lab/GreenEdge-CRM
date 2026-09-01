from django.db import models
from common.models import TenantBaseModel


class SupportTicket(TenantBaseModel):
    """
    A customer support / helpdesk ticket.
    """
    PRIORITY_CHOICES = [
        ('low',      'Low'),
        ('medium',   'Medium'),
        ('high',     'High'),
        ('critical', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('pending',     'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved',    'Resolved'),
        ('closed',      'Closed'),
    ]

    ticket_no    = models.CharField(max_length=50, blank=True, null=True)
    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True, null=True)

    # Customer reference (optional — can be entered as free text or linked)
    customer_name  = models.CharField(max_length=200, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='support_tickets'
    )

    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_tickets'
    )

    resolved_at = models.DateTimeField(blank=True, null=True)
    closed_at   = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ticket_no or 'Draft'} — {self.title}"


class TicketComment(TenantBaseModel):
    """
    A comment or internal note on a support ticket.
    """
    ticket    = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='comments')
    text      = models.TextField()
    is_internal = models.BooleanField(default=False, help_text='Internal notes not visible to customer')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment on {self.ticket} by {self.created_by}"
