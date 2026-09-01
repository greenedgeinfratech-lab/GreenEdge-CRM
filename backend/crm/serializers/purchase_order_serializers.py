from rest_framework import serializers
from crm.models import PurchaseOrder, PurchaseOrderItem

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'item_description', 'hsn_sac', 'qty', 'unit',
            'rate', 'discount', 'taxable', 'cgst_percent', 'sgst_percent',
            'igst_percent', 'cgst_amt', 'sgst_amt', 'igst_amt', 'amt'
        ]
        read_only_fields = ['id']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'supplier_name', 'contact_person', 'source_address', 'shipping_details',
            'po_no', 'reference', 'po_date', 'due_date',
            'notes', 'terms_conditions', 'status',
            'share_email', 'share_whatsapp', 'print_after_save',
            'extra_charge', 'custom_discount',
            'total_taxable', 'total_cgst', 'total_sgst', 'total_igst', 'grand_total',
            'items', 'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name or ''}".strip()
        return "System"

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                company=po.company,
                created_by=po.created_by,
                updated_by=po.updated_by,
                **item_data
            )
        return po

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    company=instance.company,
                    created_by=instance.created_by,
                    updated_by=instance.updated_by,
                    **item_data
                )
        return instance
