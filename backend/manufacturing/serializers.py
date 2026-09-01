from rest_framework import serializers
from .models import ProductionJob, JobActivity


class JobActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = JobActivity
        fields = [
            'id', 'activity_type', 'notes', 'timestamp',
            'created_by', 'created_by_name',
        ]
        read_only_fields = ['id', 'timestamp', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None


class ProductionJobSerializer(serializers.ModelSerializer):
    activities      = JobActivitySerializer(many=True, read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    status_display  = serializers.SerializerMethodField()

    class Meta:
        model = ProductionJob
        fields = [
            'id', 'job_no', 'title', 'description',
            'product_name', 'quantity', 'unit',
            'start_date', 'due_date', 'completed_at',
            'status', 'status_display', 'priority',
            'assigned_to', 'assigned_to_name',
            'purchase_order', 'notes',
            'activities',
            'created_at', 'updated_at', 'created_by',
        ]
        read_only_fields = ['id', 'job_no', 'created_at', 'updated_at', 'created_by']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email
        return None

    def get_status_display(self, obj):
        return obj.get_status_display()


class ProductionJobListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views (no nested activities)."""
    assigned_to_name = serializers.SerializerMethodField()
    status_display   = serializers.SerializerMethodField()

    class Meta:
        model = ProductionJob
        fields = [
            'id', 'job_no', 'title', 'product_name', 'quantity', 'unit',
            'start_date', 'due_date', 'status', 'status_display', 'priority',
            'assigned_to', 'assigned_to_name',
            'created_at',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
        return None

    def get_status_display(self, obj):
        return obj.get_status_display()
