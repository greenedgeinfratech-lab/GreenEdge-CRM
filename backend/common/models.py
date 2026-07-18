import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # User who created/updated. Can be null for system actions (like creating the very first company)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated"
    )
    
    # Soft delete and active status
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()

    def restore(self):
        self.deleted_at = None
        self.is_active = True
        self.save()


class TenantBaseModel(BaseModel):
    """
    Base model for any entity that belongs to a specific company (tenant).
    """
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_related"
    )

    class Meta:
        abstract = True


class AuditLog(models.Model):
    """
    Model for storing system-wide audit logs.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('users.Company', on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50) # CREATE, UPDATE, DELETE
    model_name = models.CharField(max_length=100)
    object_id = models.UUIDField(null=True, blank=True)
    changes = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} on {self.model_name}"


class ActivityLog(models.Model):
    """
    Model for user-facing activity logs (e.g., timeline of events).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('users.Company', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    activity_type = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    related_model = models.CharField(max_length=100, null=True, blank=True)
    related_object_id = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']


class DocumentSequence(TenantBaseModel):
    """
    Generic sequence engine for document numbering (e.g., Quotations, Orders, Employees).
    """
    entity_name = models.CharField(max_length=100, help_text="e.g., Quotation, SalesOrder, Employee")
    prefix = models.CharField(max_length=50, null=True, blank=True)
    suffix = models.CharField(max_length=50, null=True, blank=True)
    padding_length = models.IntegerField(default=4, help_text="Number of digits, e.g., 4 means 0001")
    current_value = models.IntegerField(default=0)

    class Meta:
        unique_together = ('company', 'entity_name')

    def __str__(self):
        return f"{self.company} - {self.entity_name} Sequence"


class MasterData(TenantBaseModel):
    """
    Generic table to hold all system dropdowns and master configurations.
    """
    CATEGORY_CHOICES = [
        ('Industry', 'Industry'),
        ('LeadSource', 'Lead Source'),
        ('Currency', 'Currency'),
        ('Country', 'Country'),
        ('State', 'State'),
        ('EmploymentType', 'Employment Type'),
    ]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    key = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['category', 'sort_order', 'key']
        unique_together = ('company', 'category', 'key')

    def __str__(self):
        return f"{self.category}: {self.value}"

