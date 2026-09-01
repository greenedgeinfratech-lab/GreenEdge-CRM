from rest_framework import serializers
from crm.models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    debit_ledger_name = serializers.CharField(source='debit_ledger.name', read_only=True)
    credit_ledger_name = serializers.CharField(source='credit_ledger.name', read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'date', 'voucher_no',
            'debit_ledger', 'debit_ledger_name',
            'credit_ledger', 'credit_ledger_name',
            'amount', 'narration',
            'reference_type', 'reference_id', 'reference_no',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name or ''}".strip()
        return "System"
