from rest_framework import serializers
from crm.models import InvoicePayment


class InvoicePaymentSerializer(serializers.ModelSerializer):
    invoice_no = serializers.CharField(source='invoice.invoice_no', read_only=True)
    customer_name = serializers.CharField(source='invoice.customer_name', read_only=True)

    class Meta:
        model = InvoicePayment
        fields = [
            'id', 'invoice', 'invoice_no', 'customer_name',
            'amount', 'payment_date', 'method',
            'reference_no', 'notes',
            'created_at', 'updated_at', 'created_by',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
