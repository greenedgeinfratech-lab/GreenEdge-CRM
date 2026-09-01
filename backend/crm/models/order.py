from django.db import models
from common.models import TenantBaseModel

class Order(TenantBaseModel):
    """
    Model representing a Sale Order.
    """
    lead = models.ForeignKey(
        'crm.Lead',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    customer_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    sales_credit = models.CharField(max_length=200, blank=True, null=True)
    same_as_billing = models.BooleanField(default=True)
    shipping_address = models.TextField(blank=True, null=True)
    
    order_number = models.CharField(max_length=50, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    order_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    customer_po_number = models.CharField(max_length=100, blank=True, null=True)
    executive = models.CharField(max_length=200, blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)
    terms_conditions = models.JSONField(default=list, blank=True)
    
    extra_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    custom_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    total_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_cgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_sgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_igst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    share_email = models.BooleanField(default=False)
    share_whatsapp = models.BooleanField(default=False)
    print_after_save = models.BooleanField(default=False)
    
    status = models.CharField(max_length=50, default='Received')  # Received, Pending, Processing, Dispatched, Delivered, Cancelled

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number or 'Draft'} - {self.customer_name}"


class OrderItem(TenantBaseModel):
    """
    A single line item in a Sale Order.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    item_description = models.TextField()
    hsn_sac = models.CharField(max_length=50, blank=True, null=True)
    qty = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, default='Nos')
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    igst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lead_time = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.item_description
