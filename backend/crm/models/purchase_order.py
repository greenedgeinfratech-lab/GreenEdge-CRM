from django.db import models
from common.models import TenantBaseModel

class PurchaseOrder(TenantBaseModel):
    """
    Model representing a Purchase Order.
    """
    supplier_name = models.CharField(max_length=200, blank=True, null=True)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    source_address = models.TextField(blank=True, null=True)
    shipping_details = models.TextField(blank=True, null=True)
    
    po_no = models.CharField(max_length=50, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    po_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    terms_conditions = models.JSONField(default=list, blank=True)
    
    status = models.CharField(max_length=50, default='Pending')
    
    share_email = models.BooleanField(default=False)
    share_whatsapp = models.BooleanField(default=False)
    print_after_save = models.BooleanField(default=False)
    
    extra_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    custom_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    total_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_cgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_sgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_igst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.po_no} - {self.supplier_name}"


class PurchaseOrderItem(TenantBaseModel):
    """
    Line items within a Purchase Order.
    """
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    item_description = models.CharField(max_length=255)
    hsn_sac = models.CharField(max_length=50, blank=True, null=True)
    qty = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=50, default='nos')
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    igst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    amt = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.item_description} ({self.qty} {self.unit})"
