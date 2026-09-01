"""
Customers Module — Models
=========================
Customer           — Core customer entity (converted leads + manual entries).
CustomerContact    — Additional contacts per customer.
"""

from django.db import models
from common.models import TenantBaseModel
from common.validators import validate_mobile


class Customer(TenantBaseModel):
    """
    Customer entity. Created manually or automatically when a Lead is converted.
    """

    class CustomerType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        BUSINESS   = 'business',   'Business'

    class Status(models.TextChoices):
        ACTIVE   = 'active',   'Active'
        INACTIVE = 'inactive', 'Inactive'
        BLOCKED  = 'blocked',  'Blocked'

    # ─── Identity ───────────────────────────────────────────────────────────────
    customer_number = models.CharField(max_length=30, blank=True, null=True, db_index=True)
    name            = models.CharField(max_length=200)
    company_name    = models.CharField(max_length=200, blank=True, null=True)
    customer_type   = models.CharField(max_length=20, choices=CustomerType.choices, default=CustomerType.BUSINESS)
    status          = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    # ─── Contact ────────────────────────────────────────────────────────────────
    mobile           = models.CharField(max_length=15, blank=True, null=True, validators=[validate_mobile])
    alternate_mobile = models.CharField(max_length=15, blank=True, null=True, validators=[validate_mobile])
    email            = models.EmailField(blank=True, null=True)
    secondary_email  = models.EmailField(blank=True, null=True)
    phone            = models.CharField(max_length=20, blank=True, null=True)
    website          = models.URLField(blank=True, null=True)

    # ─── Tax / Legal ────────────────────────────────────────────────────────────
    gst_number = models.CharField(max_length=15, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)

    # ─── Address ────────────────────────────────────────────────────────────────
    address = models.TextField(blank=True, null=True)
    city    = models.CharField(max_length=100, blank=True, null=True)
    state   = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True, default='India')
    pincode = models.CharField(max_length=10, blank=True, null=True)

    billing_address  = models.TextField(blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)

    # ─── Classification ─────────────────────────────────────────────────────────
    industry   = models.CharField(max_length=100, blank=True, null=True)
    source     = models.CharField(max_length=100, blank=True, null=True)
    tags       = models.JSONField(default=list, blank=True)

    # ─── Financials ─────────────────────────────────────────────────────────────
    credit_limit   = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    outstanding    = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_orders   = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_invoices = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # ─── Assignment ─────────────────────────────────────────────────────────────
    assigned_to = models.ForeignKey(
        'users.EmployeeProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_customers'
    )

    # ─── Origin ─────────────────────────────────────────────────────────────────
    converted_from_lead = models.ForeignKey(
        'crm.Lead', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='converted_customers'
    )

    # ─── Misc ───────────────────────────────────────────────────────────────────
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'customer_number']),
            models.Index(fields=['mobile']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.customer_number or self.pk} — {self.name}"


class CustomerInteraction(TenantBaseModel):
    """Auditable recovery activities for a customer."""
    TYPE_CHOICES = [
        ('reminder', 'Reminder'), ('appointment', 'Appointment'),
        ('payment', 'Payment received'), ('email', 'Email'), ('whatsapp', 'WhatsApp'),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    notes = models.TextField(blank=True, null=True)
    scheduled_for = models.DateTimeField(blank=True, null=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    delivery_status = models.CharField(max_length=20, default='not_applicable')
    delivery_error = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']


class CustomerContact(TenantBaseModel):
    """
    Additional contacts linked to a customer (e.g., accounts dept, site manager).
    """
    customer    = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    name        = models.CharField(max_length=200)
    designation = models.CharField(max_length=100, blank=True, null=True)
    mobile      = models.CharField(max_length=15, blank=True, null=True, validators=[validate_mobile])
    email       = models.EmailField(blank=True, null=True)
    is_primary  = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_primary', 'name']

    def __str__(self):
        return f"{self.customer.name} — {self.name}"
