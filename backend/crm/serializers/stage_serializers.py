from rest_framework import serializers
from crm.models import LeadStage, LeadSource, LeadTag, LostReason


class LeadStageSerializer(serializers.ModelSerializer):
    lead_count = serializers.IntegerField(read_only=True, default=0)
    pipeline_value = serializers.FloatField(read_only=True, default=0)

    class Meta:
        model = LeadStage
        fields = [
            'id', 'name', 'sequence', 'color',
            'is_won', 'is_lost', 'is_default', 'is_active',
            'lead_count', 'pipeline_value',
        ]
        read_only_fields = ['id']


class LeadStageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadStage
        fields = ['name', 'sequence', 'color', 'is_won', 'is_lost', 'is_default']

    def validate_name(self, value):
        company = self.context['company']
        qs = LeadStage.objects.filter(company=company, name__iexact=value, is_active=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A stage with this name already exists.")
        return value


class LeadStageReorderSerializer(serializers.Serializer):
    """Accepts [{id: uuid, sequence: int}, ...]"""
    stages = serializers.ListField(
        child=serializers.DictField()
    )


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = ['id', 'name', 'description', 'is_active']
        read_only_fields = ['id']


class LeadTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadTag
        fields = ['id', 'name', 'color', 'is_active']
        read_only_fields = ['id']


class LostReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = LostReason
        fields = ['id', 'name', 'description', 'is_active']
        read_only_fields = ['id']
