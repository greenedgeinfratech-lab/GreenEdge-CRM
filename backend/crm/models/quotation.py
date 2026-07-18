from django.db import models
from common.models import TenantBaseModel

class Quotation(TenantBaseModel):
    """
    Model representing a Quotation or Proforma Invoice.
    """
    lead = models.ForeignKey(
        'crm.Lead',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quotations'
    )
    customer_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    sales_credit = models.CharField(max_length=200, blank=True, null=True)
    same_as_billing = models.BooleanField(default=True)
    shipping_address = models.TextField(blank=True, null=True)
    
    quote_number = models.CharField(max_length=50, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    quote_date = models.DateField(blank=True, null=True)
    valid_till = models.DateField(blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)
    terms_conditions = models.JSONField(default=list, blank=True)
    
    extra_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    custom_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    total_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_cgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_sgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    share_email = models.BooleanField(default=False)
    share_whatsapp = models.BooleanField(default=False)
    print_after_save = models.BooleanField(default=False)
    alert_on_opening = models.BooleanField(default=False)
    
    type = models.CharField(max_length=50, default='Quotation')  # e.g., Quotation, Proforma Invoice
    status = models.CharField(max_length=50, default='Pending')   # e.g., Pending, Sent, Accepted, Declined

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quote_number or 'Draft'} - {self.customer_name}"


class QuotationItem(TenantBaseModel):
    """
    A single line item in a Quotation.
    """
    quotation = models.ForeignKey(
        Quotation,
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
    cgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lead_time = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.item_description
