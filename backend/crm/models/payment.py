from django.db import models
from common.models import TenantBaseModel


class InvoicePayment(TenantBaseModel):
    """
    Records a payment received against an Invoice.
    """
    class PaymentMethod(models.TextChoices):
        CASH = 'Cash', 'Cash'
        BANK = 'Bank Transfer', 'Bank Transfer'
        UPI = 'UPI', 'UPI'
        CHEQUE = 'Cheque', 'Cheque'
        NEFT = 'NEFT', 'NEFT'
        RTGS = 'RTGS', 'RTGS'
        OTHER = 'Other', 'Other'

    invoice = models.ForeignKey(
        'crm.Invoice',
        on_delete=models.CASCADE,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_date = models.DateField()
    method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']
        verbose_name = 'Invoice Payment'
        verbose_name_plural = 'Invoice Payments'

    def __str__(self):
        return f"Payment {self.id} | {self.invoice.invoice_no or self.invoice.id} | {self.amount}"
