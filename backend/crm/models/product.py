from django.db import models
from common.models import TenantBaseModel

class ProductCatalog(TenantBaseModel):
    """
    Catalog of stock items and service items available for quotations, orders, and invoices.
    Fully supports all Biziverse ERP item attributes.
    """
    ITEM_TYPE_CHOICES = [
        ('Stock', 'Stock Item'),
        ('Service', 'Service / Non Stock Item'),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, blank=True, null=True)
    item_type = models.CharField(max_length=50, choices=ITEM_TYPE_CHOICES, default='Stock')
    category = models.CharField(max_length=100, blank=True, null=True)
    sub_category = models.CharField(max_length=100, blank=True, null=True)
    classification = models.CharField(max_length=100, default='Product')
    importance = models.CharField(max_length=50, default='Normal')
    
    opng_qty = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, default='no.s')
    at_store = models.CharField(max_length=100, blank=True, null=True)
    
    source = models.CharField(max_length=100, default='Internal Manufacturing')
    min_stock_qty = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lead_time = models.IntegerField(default=0)
    
    std_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    purch_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Std Sale Price
    
    hsn_sac = models.CharField(max_length=50, blank=True, null=True)
    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=9)
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=9)
    igst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    mrp = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    description = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    stock_qty = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.item_type})"
