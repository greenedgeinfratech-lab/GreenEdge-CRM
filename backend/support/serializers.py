from rest_framework import serializers
from .models import SupportTicket, TicketComment


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = ['id', 'text', 'is_internal', 'created_at', 'created_by', 'author_name']
        read_only_fields = ['id', 'created_at', 'created_by']

    def get_author_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return 'System'


class SupportTicketSerializer(serializers.ModelSerializer):
    comments         = TicketCommentSerializer(many=True, read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    status_display   = serializers.SerializerMethodField()
    priority_display = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_no', 'title', 'description',
            'customer_name', 'customer_email', 'customer_phone', 'customer',
            'priority', 'priority_display', 'status', 'status_display',
            'assigned_to', 'assigned_to_name',
            'resolved_at', 'closed_at',
            'comments',
            'created_at', 'updated_at', 'created_by',
        ]
        read_only_fields = ['id', 'ticket_no', 'created_at', 'updated_at', 'created_by']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email
        return None

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_priority_display(self, obj):
        return obj.get_priority_display()


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Lighter list serializer — no nested comments."""
    assigned_to_name = serializers.SerializerMethodField()
    status_display   = serializers.SerializerMethodField()
    priority_display = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_no', 'title',
            'customer_name', 'priority', 'priority_display',
            'status', 'status_display',
            'assigned_to', 'assigned_to_name',
            'created_at',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
        return None

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_priority_display(self, obj):
        return obj.get_priority_display()
