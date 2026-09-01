from django.db import models
from common.models import TenantBaseModel


class ProductionJob(TenantBaseModel):
    """
    Represents a manufacturing / production job order.
    """
    STATUS_CHOICES = [
        ('draft',       'Draft'),
        ('in_progress', 'In Progress'),
        ('on_hold',     'On Hold'),
        ('completed',   'Completed'),
        ('cancelled',   'Cancelled'),
    ]

    job_no       = models.CharField(max_length=50, blank=True, null=True)
    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True, null=True)

    # What is being produced
    product_name = models.CharField(max_length=255, blank=True, null=True)
    quantity     = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit         = models.CharField(max_length=50, default='Nos')

    # Scheduling
    start_date   = models.DateField(blank=True, null=True)
    due_date     = models.DateField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='medium'
    )

    # Assignments
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='manufacturing_jobs'
    )

    # Links
    purchase_order = models.ForeignKey(
        'crm.PurchaseOrder',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='production_jobs'
    )

    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_no or 'Draft'} — {self.title}"


class JobActivity(TenantBaseModel):
    """
    Activity / log entry for a ProductionJob.
    """
    ACTIVITY_TYPES = [
        ('note',           'Note'),
        ('status_change',  'Status Change'),
        ('material_added', 'Material Added'),
        ('inspection',     'Inspection'),
        ('issue',          'Issue Reported'),
    ]

    job           = models.ForeignKey(ProductionJob, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES, default='note')
    notes         = models.TextField()
    timestamp     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.activity_type} on {self.job}"
