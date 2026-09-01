from django.db import models
from common.models import TenantBaseModel


class Transaction(TenantBaseModel):
    """
    Double-entry ledger transaction (journal entry).
    Each transaction debits one ledger and credits another.
    """
    date = models.DateField()
    voucher_no = models.CharField(max_length=50, blank=True, null=True)

    debit_ledger = models.ForeignKey(
        'crm.Ledger',
        on_delete=models.PROTECT,
        related_name='debit_transactions',
    )
    credit_ledger = models.ForeignKey(
        'crm.Ledger',
        on_delete=models.PROTECT,
        related_name='credit_transactions',
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    narration = models.TextField(blank=True, null=True)

    # Optional link to source document
    reference_type = models.CharField(max_length=50, blank=True, null=True)  # e.g. 'Invoice', 'Order'
    reference_id = models.UUIDField(blank=True, null=True)
    reference_no = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'

    def __str__(self):
        return f"{self.voucher_no or self.id} | {self.date} | Dr {self.debit_ledger.name} / Cr {self.credit_ledger.name} | {self.amount}"
