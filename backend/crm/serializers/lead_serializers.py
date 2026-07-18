from rest_framework import serializers
from crm.models import Lead, LeadProduct
from crm.serializers.stage_serializers import (
    LeadStageSerializer, LeadSourceSerializer, LeadTagSerializer, LostReasonSerializer
)


# ── Nested helpers ────────────────────────────────────────────────────────────

class AssignedEmployeeSerializer(serializers.Serializer):
    id   = serializers.UUIDField()
    name = serializers.SerializerMethodField()
    email = serializers.EmailField()

    def get_name(self, obj):
        return f"{getattr(obj, 'first_name', '')} {getattr(obj, 'last_name', '')}".strip()


class LeadProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadProduct
        fields = ['id', 'product_name', 'quantity', 'estimated_price', 'unit', 'notes']
        read_only_fields = ['id']


# ── List Serializer (lightweight — for table view) ────────────────────────────

class LeadListSerializer(serializers.ModelSerializer):
    """
    Optimised for listing — returns only fields needed for the table.
    Avoids deep nesting; uses flat FK representations.
    """
    full_name     = serializers.ReadOnlyField()
    stage_name    = serializers.CharField(source='stage.name', read_only=True, default='')
    stage_color   = serializers.CharField(source='stage.color', read_only=True, default='')
    source_name   = serializers.CharField(source='source.name', read_only=True, default='')
    assigned_to_name = serializers.SerializerMethodField()
    tags          = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'lead_number', 'full_name', 'first_name', 'last_name',
            'company_name', 'mobile', 'email', 'city', 'state',
            'stage_name', 'stage_color', 'source_name',
            'estimated_value', 'priority', 'status',
            'lead_score', 'is_starred', 'is_duplicate',
            'assigned_to', 'assigned_to_name',
            'next_followup_date', 'last_contact_date',
            'product_interested', 'requirements',
            'tags', 'created_at',
        ]

    def get_assigned_to_name(self, obj):
        emp = obj.assigned_to
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None

    def get_tags(self, obj):
        return [{'id': str(t.id), 'name': t.name, 'color': t.color} for t in obj.tags.all()]


# ── Detail Serializer (full nested — for lead detail page) ────────────────────

class LeadDetailSerializer(serializers.ModelSerializer):
    full_name  = serializers.ReadOnlyField()
    stage      = LeadStageSerializer(read_only=True)
    source     = LeadSourceSerializer(read_only=True)
    tags       = LeadTagSerializer(many=True, read_only=True)
    lost_reason = LostReasonSerializer(read_only=True)
    products   = LeadProductSerializer(many=True, read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    followup_count   = serializers.SerializerMethodField()
    note_count       = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'lead_number', 'full_name',
            'first_name', 'last_name', 'company_name',
            'mobile', 'alternate_mobile', 'email',
            'secondary_email', 'alternate_contact', 'website',
            'gst_number', 'pan_number', 'social_links',
            'address', 'city', 'state', 'country', 'pincode',
            'stage', 'status', 'priority',
            'source', 'tags', 'lost_reason', 'lost_notes',
            'estimated_value', 'product_interested', 'requirements',
            'assigned_to', 'assigned_to_name',
            'last_contact_date', 'next_followup_date', 'last_followup_date',
            'won_at', 'lost_at', 'converted_at',
            'lead_score', 'is_starred', 'is_duplicate',
            'products',
            'followup_count', 'note_count', 'attachment_count',
            'created_at', 'updated_at',
        ]

    def get_assigned_to_name(self, obj):
        emp = obj.assigned_to
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None

    def get_followup_count(self, obj):
        return obj.followups.filter(is_active=True).count()

    def get_note_count(self, obj):
        return obj.notes.filter(is_active=True).count()

    def get_attachment_count(self, obj):
        return obj.attachments.filter(is_active=True).count()


# ── Create Serializer ─────────────────────────────────────────────────────────

class LeadCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list
    )
    override_duplicate = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Lead
        fields = [
            'first_name', 'last_name', 'company_name',
            'mobile', 'alternate_mobile', 'email',
            'secondary_email', 'alternate_contact', 'website',
            'gst_number', 'pan_number', 'social_links',
            'address', 'city', 'state', 'country', 'pincode',
            'stage', 'source', 'priority',
            'estimated_value', 'product_interested', 'requirements',
            'assigned_to', 'next_followup_date', 'tags',
            'override_duplicate',
        ]

    def validate_mobile(self, value):
        import re
        value = value.strip().replace(' ', '').replace('-', '')
        if not re.match(r'^[6-9]\d{9}$', value):
            raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6-9.")
        return value

    def validate_stage(self, value):
        company = self.context.get('company')
        if value and str(value.company_id) != str(company.id):
            raise serializers.ValidationError("Stage does not belong to this company.")
        return value


# ── Update Serializer ─────────────────────────────────────────────────────────

class LeadUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )

    class Meta:
        model = Lead
        fields = [
            'first_name', 'last_name', 'company_name',
            'mobile', 'alternate_mobile', 'email',
            'secondary_email', 'alternate_contact', 'website',
            'gst_number', 'pan_number', 'social_links',
            'address', 'city', 'state', 'country', 'pincode',
            'source', 'priority', 'status',
            'estimated_value', 'product_interested', 'requirements',
            'assigned_to', 'next_followup_date', 'tags',
        ]
        extra_kwargs = {f: {'required': False} for f in fields}


# ── Stage Change Serializer ───────────────────────────────────────────────────

class StageChangeSerializer(serializers.Serializer):
    stage_id    = serializers.UUIDField()
    lost_reason = serializers.UUIDField(required=False, allow_null=True)
    lost_notes  = serializers.CharField(required=False, allow_blank=True)


# ── Assignment Serializer ─────────────────────────────────────────────────────

class LeadAssignSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    reason      = serializers.CharField(required=False, allow_blank=True)


# ── Bulk Action Serializer ────────────────────────────────────────────────────

class BulkActionSerializer(serializers.Serializer):
    ACTION_CHOICES = ['assign', 'change_stage', 'delete', 'star', 'unstar']
    lead_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    action   = serializers.ChoiceField(choices=ACTION_CHOICES)
    # Optional params per action type
    employee_id = serializers.UUIDField(required=False)
    stage_id    = serializers.UUIDField(required=False)
