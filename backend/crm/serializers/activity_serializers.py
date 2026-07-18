from rest_framework import serializers
from crm.models import (
    LeadFollowup, Appointment, LeadNote,
    LeadAttachment, LeadAssignmentHistory, LeadTimeline,
)


# ── Follow-ups ────────────────────────────────────────────────────────────────

class LeadFollowupSerializer(serializers.ModelSerializer):
    followup_type_display = serializers.CharField(source='get_followup_type_display', read_only=True)
    status_display        = serializers.CharField(source='get_status_display', read_only=True)
    completed_by_name     = serializers.SerializerMethodField()

    assigned_to_name      = serializers.SerializerMethodField()

    class Meta:
        model = LeadFollowup
        fields = [
            'id', 'followup_type', 'followup_type_display',
            'notes', 'next_followup_date',
            'status', 'status_display',
            'completed_at', 'completed_by', 'completed_by_name',
            'date', 'duration', 'outcome', 'assigned_to', 'assigned_to_name',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_completed_by_name(self, obj):
        emp = obj.completed_by
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None

    def get_assigned_to_name(self, obj):
        emp = obj.assigned_to
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None


class LeadFollowupCreateSerializer(serializers.ModelSerializer):
    schedule_reminder = serializers.BooleanField(required=False, default=False, write_only=True)
    reminder_time = serializers.DateTimeField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = LeadFollowup
        fields = [
            'followup_type', 'notes', 'next_followup_date',
            'date', 'duration', 'outcome', 'assigned_to',
            'schedule_reminder', 'reminder_time'
        ]

    def validate_followup_type(self, value):
        valid = [c[0] for c in LeadFollowup.FollowupType.choices]
        if value not in valid:
            raise serializers.ValidationError(f"Must be one of: {', '.join(valid)}")
        return value


# ── Appointments ──────────────────────────────────────────────────────────────

class AppointmentSerializer(serializers.ModelSerializer):
    type_display   = serializers.CharField(source='get_appointment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'title', 'appointment_type', 'type_display',
            'notes', 'start_time', 'end_time',
            'assigned_to', 'assigned_to_name',
            'status', 'status_display',
            'location', 'meeting_link',
            'reminder', 'reminder_type', 'priority',
            'outcome', 'remarks', 'completed_by',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_assigned_to_name(self, obj):
        emp = obj.assigned_to
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'title', 'appointment_type', 'notes',
            'start_time', 'end_time', 'assigned_to',
            'location', 'meeting_link',
        ]

    def validate(self, attrs):
        if attrs.get('end_time') and attrs.get('start_time'):
            if attrs['end_time'] <= attrs['start_time']:
                raise serializers.ValidationError({'end_time': 'End time must be after start time.'})
        return attrs


# ── Notes ─────────────────────────────────────────────────────────────────────

class LeadNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeadNote
        fields = ['id', 'text', 'pinned', 'is_rich_text', 'mentions', 'attachments', 'history', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']

    def get_created_by_name(self, obj):
        user = obj.created_by
        if user:
            return f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
        return None


class LeadNoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadNote
        fields = ['text', 'pinned']

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Note text cannot be blank.")
        return value.strip()


# ── Attachments ───────────────────────────────────────────────────────────────

class LeadAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = LeadAttachment
        fields = [
            'id', 'file_name', 'file_path', 'file_url',
            'file_size', 'file_type', 'mime_type',
            'uploaded_by', 'uploaded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_uploaded_by_name(self, obj):
        emp = obj.uploaded_by
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file_path and request:
            from django.conf import settings
            media_url = getattr(settings, 'MEDIA_URL', '/media/')
            return request.build_absolute_uri(f"{media_url}{obj.file_path}")
        return obj.file_path


# ── Assignment History ────────────────────────────────────────────────────────

class LeadAssignmentHistorySerializer(serializers.ModelSerializer):
    from_employee_name = serializers.SerializerMethodField()
    to_employee_name   = serializers.SerializerMethodField()
    changed_by_name    = serializers.SerializerMethodField()

    class Meta:
        model = LeadAssignmentHistory
        fields = [
            'id', 'from_employee', 'from_employee_name',
            'to_employee', 'to_employee_name',
            'changed_by', 'changed_by_name',
            'reason', 'changed_at',
        ]

    def _emp_name(self, emp):
        if emp:
            return f"{getattr(emp, 'first_name', '')} {getattr(emp, 'last_name', '')}".strip()
        return None

    def get_from_employee_name(self, obj):
        return self._emp_name(obj.from_employee)

    def get_to_employee_name(self, obj):
        return self._emp_name(obj.to_employee)

    def get_changed_by_name(self, obj):
        user = obj.changed_by
        if user:
            return f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
        return None


# ── Timeline ──────────────────────────────────────────────────────────────────

class LeadTimelineSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    performed_by_name  = serializers.SerializerMethodField()

    class Meta:
        model = LeadTimeline
        fields = [
            'id', 'event_type', 'event_type_display',
            'title', 'body', 'metadata',
            'performed_by', 'performed_by_name',
            'performed_at',
            'related_followup_id', 'related_note_id', 'related_appointment_id',
        ]

    def get_performed_by_name(self, obj):
        user = obj.performed_by
        if user:
            return f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
        return 'System'
