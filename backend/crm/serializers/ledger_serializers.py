from rest_framework import serializers

from crm.models import AccountGroup, Ledger


class AccountGroupSerializer(serializers.ModelSerializer):
    ledger_count = serializers.IntegerField(read_only=True)
    opening_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = AccountGroup
        fields = ['id', 'name', 'parent', 'sequence', 'ledger_count', 'opening_total', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LedgerSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Ledger
        fields = ['id', 'group', 'group_name', 'name', 'code', 'opening_balance', 'balance_side', 'notes', 'is_favourite', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
