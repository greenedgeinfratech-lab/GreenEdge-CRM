from rest_framework import serializers
from crm.models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'item_description', 'hsn_sac', 'qty', 'unit',
            'rate', 'discount', 'taxable', 'cgst_percent', 'sgst_percent',
            'cgst_amt', 'sgst_amt', 'amt', 'lead_time'
        ]
        read_only_fields = ['id']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    lead_name = serializers.SerializerMethodField(read_only=True)
    issued_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'lead', 'lead_name', 'customer_name', 'contact_person', 'address',
            'sales_credit', 'same_as_billing', 'shipping_address',
            'order_number', 'reference', 'order_date', 'due_date', 'customer_po_number',
            'notes', 'bank_details', 'terms_conditions',
            'extra_charge', 'custom_discount', 'total_taxable',
            'total_cgst', 'total_sgst', 'grand_total',
            'share_email', 'share_whatsapp', 'print_after_save',
            'status', 'items', 'created_at', 'updated_at', 'created_by', 'issued_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_lead_name(self, obj):
        if obj.lead:
            return obj.lead.company_name or f"{obj.lead.first_name} {obj.lead.last_name or ''}".strip()
        return obj.customer_name

    def get_issued_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name or ''}".strip()
        return "System"

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                company=order.company,
                created_by=order.created_by,
                updated_by=order.updated_by,
                **item_data
            )
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            # Delete existing items and recreate
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(
                    order=instance,
                    company=instance.company,
                    created_by=instance.created_by,
                    updated_by=instance.updated_by,
                    **item_data
                )
        return instance
