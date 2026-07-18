"""
Stage Configuration Views
==========================
ViewSets for managing per-company pipeline configuration:
  - Lead Stages (with reorder action)
  - Lead Sources
  - Lead Tags
  - Lost Reasons
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from crm.models import LeadStage, LeadSource, LeadTag, LostReason
from crm.permissions import CanViewCRM
from crm.serializers import (
    LeadStageSerializer, LeadStageWriteSerializer, LeadStageReorderSerializer,
    LeadSourceSerializer, LeadTagSerializer, LostReasonSerializer,
)
from crm.services.stage_service import StageService


class CompanyScopedMixin:
    """Filters all queryset access to the authenticated user's company."""

    def get_queryset(self):
        return self.queryset_model.objects.filter(
            company=self.request.user.company, is_active=True
        )

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['company'] = self.request.user.company
        return ctx


@extend_schema(tags=['CRM — Pipeline Config'])
class LeadStageViewSet(CompanyScopedMixin, ModelViewSet):
    queryset_model = LeadStage
    serializer_class = LeadStageSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        from django.db.models import Count, Sum
        
        company = self.request.user.company
        
        # Auto-seed defaults if this company has no stages configured yet
        try:
            if not LeadStage.objects.filter(company=company).exists():
                StageService.seed_defaults(company, self.request.user)
        except Exception:
            pass # Failsafe if migrations haven't run
            
        return LeadStage.objects.filter(
            company=company, is_active=True
        ).annotate(
            lead_count=Count('leads', filter=__import__('django.db.models', fromlist=['Q']).Q(leads__is_active=True)),
            pipeline_value=Sum(
                'leads__estimated_value',
                filter=__import__('django.db.models', fromlist=['Q']).Q(leads__is_active=True)
            )
        ).order_by('sequence')

    def get_serializer_class(self):
        if self.action in ('create', 'partial_update'):
            return LeadStageWriteSerializer
        return LeadStageSerializer

    @extend_schema(summary='Reorder pipeline stages', request=LeadStageReorderSerializer)
    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        serializer = LeadStageReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        StageService.reorder_stages(request.user.company, serializer.validated_data['stages'])
        return Response({'detail': 'Stages reordered successfully.'})

    @extend_schema(summary='Seed default stages for this company')
    @action(detail=False, methods=['post'], url_path='seed-defaults')
    def seed_defaults(self, request):
        result = StageService.seed_defaults(request.user.company, request.user)
        return Response({'detail': 'Default stages seeded.', 'result': result})


@extend_schema(tags=['CRM — Pipeline Config'])
class LeadSourceViewSet(CompanyScopedMixin, ModelViewSet):
    queryset_model = LeadSource
    serializer_class = LeadSourceSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        company = self.request.user.company
        try:
            if not LeadSource.objects.filter(company=company).exists():
                StageService.seed_defaults(company, self.request.user)
        except Exception:
            pass
        return LeadSource.objects.filter(company=company, is_active=True)


@extend_schema(tags=['CRM — Pipeline Config'])
class LeadTagViewSet(CompanyScopedMixin, ModelViewSet):
    queryset_model = LeadTag
    serializer_class = LeadTagSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return LeadTag.objects.filter(company=self.request.user.company, is_active=True)


@extend_schema(tags=['CRM — Pipeline Config'])
class LostReasonViewSet(CompanyScopedMixin, ModelViewSet):
    queryset_model = LostReason
    serializer_class = LostReasonSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return LostReason.objects.filter(company=self.request.user.company, is_active=True)
