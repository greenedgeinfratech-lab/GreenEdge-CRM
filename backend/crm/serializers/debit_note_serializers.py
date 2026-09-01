from rest_framework import serializers

from crm.models import DebitNote, DebitNoteItem


class DebitNoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebitNoteItem
        fields = ['id', 'item_description', 'hsn_sac', 'qty', 'unit', 'rate', 'discount',
                  'taxable', 'cgst_percent', 'sgst_percent', 'cgst_amt', 'sgst_amt', 'amount']
        read_only_fields = ['id']


class DebitNoteSerializer(serializers.ModelSerializer):
    items = DebitNoteItemSerializer(many=True, required=False)

    class Meta:
        model = DebitNote
        fields = ['id', 'party', 'party_name', 'address', 'debit_note_no', 'reference',
                  'note_date', 'due_date', 'supplier_ledger', 'pnl_ledger', 'voucher_no',
                  'voucher_date', 'notes', 'bank_details', 'terms_conditions', 'share_email',
                  'share_whatsapp', 'print_after_save', 'extra_charge', 'custom_discount',
                  'total_taxable', 'total_cgst', 'total_sgst', 'grand_total', 'items',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        items = validated_data.pop('items', [])
        debit_note = DebitNote.objects.create(**validated_data)
        for item in items:
            DebitNoteItem.objects.create(
                debit_note=debit_note, company=debit_note.company,
                created_by=debit_note.created_by, updated_by=debit_note.updated_by, **item,
            )
        return debit_note

    def update(self, instance, validated_data):
        items = validated_data.pop('items', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            for item in items:
                DebitNoteItem.objects.create(
                    debit_note=instance, company=instance.company,
                    created_by=instance.created_by, updated_by=instance.updated_by, **item,
                )
        return instance
