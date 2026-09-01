from django.db import models

from common.models import TenantBaseModel


class DebitNote(TenantBaseModel):
    """Supplier debit note, including its accounting and tax totals."""

    party = models.ForeignKey(
        'crm.Lead', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='debit_notes',
    )
    party_name = models.CharField(max_length=200)
    address = models.TextField(blank=True, null=True)
    debit_note_no = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, blank=True, null=True)
    note_date = models.DateField()
    due_date = models.DateField(blank=True, null=True)
    supplier_ledger = models.CharField(max_length=100, blank=True, null=True)
    pnl_ledger = models.CharField(max_length=100, blank=True, null=True)
    voucher_no = models.CharField(max_length=50, blank=True, null=True)
    voucher_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    bank_details = models.CharField(max_length=200, blank=True, null=True)
    terms_conditions = models.JSONField(default=list, blank=True)
    share_email = models.BooleanField(default=False)
    share_whatsapp = models.BooleanField(default=False)
    print_after_save = models.BooleanField(default=False)
    extra_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    custom_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_cgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_sgst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['company', 'debit_note_no'], name='unique_debit_note_number_per_company'
            ),
        ]

    def __str__(self):
        return f'{self.debit_note_no} - {self.party_name}'


class DebitNoteItem(TenantBaseModel):
    debit_note = models.ForeignKey(DebitNote, on_delete=models.CASCADE, related_name='items')
    item_description = models.TextField()
    hsn_sac = models.CharField(max_length=50, blank=True, null=True)
    qty = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=50, default='Nos')
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_amt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']
