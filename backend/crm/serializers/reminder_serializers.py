from rest_framework import serializers
from crm.models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    """Full read serializer for Reminder."""
    status_display        = serializers.CharField(source='get_status_display', read_only=True)
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    priority_display      = serializers.CharField(source='get_priority_display', read_only=True)
    assigned_to_name      = serializers.SerializerMethodField()

    class Meta:
        model = Reminder
        fields = [
            'id', 'title', 'description',
            'reminder_type', 'reminder_type_display',
            'priority', 'priority_display',
            'status', 'status_display',
            'remind_at', 'completed_at',
            'assigned_to', 'assigned_to_name',
            'notification_sent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at', 'notification_sent']

    def get_assigned_to_name(self, obj):
        emp = obj.assigned_to
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None


class ReminderCreateSerializer(serializers.ModelSerializer):
    """Write serializer — used for create and partial_update."""
    assigned_to = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Reminder
        fields = [
            'title', 'description',
            'reminder_type', 'priority',
            'remind_at', 'assigned_to',
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Reminder title cannot be blank.")
        return value.strip()

    def validate_remind_at(self, value):
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("Reminder time must be in the future.")
        return value
