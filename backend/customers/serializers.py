from rest_framework import serializers
from customers.models import Customer, CustomerContact, CustomerInteraction


class CustomerContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerContact
        fields = [
            'id', 'name', 'designation', 'mobile', 'email', 'is_primary',
        ]
        read_only_fields = ['id']


class CustomerInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerInteraction
        fields = ['id', 'interaction_type', 'notes', 'scheduled_for', 'amount', 'delivery_status', 'delivery_error', 'created_at']
        read_only_fields = ['id', 'created_at', 'delivery_status', 'delivery_error']


class CustomerListSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    contact_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_number', 'name', 'company_name', 'customer_type',
            'status', 'mobile', 'email', 'city', 'state',
            'assigned_to', 'assigned_to_name', 'outstanding', 'total_orders',
            'contact_count', 'created_at',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name or ''}".strip()
        return None

    def get_contact_count(self, obj):
        return obj.contacts.count() if hasattr(obj, 'contacts') else 0


class CustomerDetailSerializer(serializers.ModelSerializer):
    contacts = CustomerContactSerializer(many=True, read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    converted_from_lead_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_number', 'name', 'company_name', 'customer_type',
            'status', 'mobile', 'alternate_mobile', 'email', 'secondary_email',
            'phone', 'website', 'gst_number', 'pan_number',
            'address', 'city', 'state', 'country', 'pincode',
            'billing_address', 'shipping_address',
            'industry', 'source', 'tags',
            'credit_limit', 'outstanding', 'total_orders', 'total_invoices',
            'assigned_to', 'assigned_to_name',
            'converted_from_lead', 'converted_from_lead_name',
            'notes', 'contacts',
            'created_at', 'updated_at', 'created_by',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name or ''}".strip()
        return None

    def get_converted_from_lead_name(self, obj):
        if obj.converted_from_lead:
            return obj.converted_from_lead.full_name
        return None


class CustomerCreateSerializer(serializers.ModelSerializer):
    contacts = CustomerContactSerializer(many=True, required=False)

    class Meta:
        model = Customer
        fields = [
            'name', 'company_name', 'customer_type', 'status',
            'mobile', 'alternate_mobile', 'email', 'secondary_email',
            'phone', 'website', 'gst_number', 'pan_number',
            'address', 'city', 'state', 'country', 'pincode',
            'billing_address', 'shipping_address',
            'industry', 'source', 'tags',
            'credit_limit', 'outstanding',
            'assigned_to', 'notes', 'contacts',
        ]

    def create(self, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        customer = Customer.objects.create(**validated_data)
        for contact_data in contacts_data:
            CustomerContact.objects.create(
                customer=customer,
                company=customer.company,
                created_by=customer.created_by,
                updated_by=customer.updated_by,
                **contact_data
            )
        return customer


class CustomerUpdateSerializer(serializers.ModelSerializer):
    contacts = CustomerContactSerializer(many=True, required=False)

    class Meta:
        model = Customer
        fields = [
            'name', 'company_name', 'customer_type', 'status',
            'mobile', 'alternate_mobile', 'email', 'secondary_email',
            'phone', 'website', 'gst_number', 'pan_number',
            'address', 'city', 'state', 'country', 'pincode',
            'billing_address', 'shipping_address',
            'industry', 'source', 'tags',
            'credit_limit', 'outstanding',
            'assigned_to', 'notes', 'contacts',
        ]

    def update(self, instance, validated_data):
        contacts_data = validated_data.pop('contacts', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if contacts_data is not None:
            instance.contacts.all().delete()
            for contact_data in contacts_data:
                CustomerContact.objects.create(
                    customer=instance,
                    company=instance.company,
                    created_by=instance.created_by,
                    updated_by=instance.updated_by,
                    **contact_data
                )
        return instance
