from django.db import models

from common.models import TenantBaseModel


class AccountGroup(TenantBaseModel):
    """A company-owned chart-of-accounts group."""
    name = models.CharField(max_length=120)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subgroups')
    sequence = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sequence', 'name']
        constraints = [models.UniqueConstraint(fields=['company', 'name'], name='unique_account_group_name')]

    def __str__(self):
        return self.name


class Ledger(TenantBaseModel):
    """A simple, tenant-scoped ledger with an opening balance."""
    class BalanceSide(models.TextChoices):
        DEBIT = 'Dr', 'Debit'
        CREDIT = 'Cr', 'Credit'

    group = models.ForeignKey(AccountGroup, on_delete=models.PROTECT, related_name='ledgers')
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=40, blank=True, null=True)
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_side = models.CharField(max_length=2, choices=BalanceSide.choices, default=BalanceSide.DEBIT)
    notes = models.TextField(blank=True, null=True)
    is_favourite = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']
        constraints = [models.UniqueConstraint(fields=['company', 'name'], name='unique_ledger_name')]

    def __str__(self):
        return self.name
