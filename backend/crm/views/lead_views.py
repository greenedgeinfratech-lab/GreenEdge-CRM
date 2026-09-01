"""
Lead ViewSet
============
Full CRUD + custom actions for Lead management.

Actions:
  list, create, retrieve, partial_update, destroy — standard REST
  stage_change   — POST /leads/{id}/stage/
  assign         — POST /leads/{id}/assign/
  toggle_star    — POST /leads/{id}/star/
  duplicate_check — POST /leads/check-duplicate/
  convert        — POST /leads/{id}/convert/
  bulk_action    — POST /leads/bulk/
  export         — GET  /leads/export/
  import_leads   — POST /leads/import/
"""

import csv
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema, OpenApiParameter

from crm.filters import LeadFilter
from crm.models import Lead, LeadStage
from crm.permissions import (
    CanViewCRM, CanCreateLead, CanEditLead,
    CanDeleteLead, CanAssignLead, CanExportCRM, CanImportCRM, CanConvertLead,
)
from crm.serializers import (
    LeadListSerializer, LeadDetailSerializer,
    LeadCreateSerializer, LeadUpdateSerializer,
)
from crm.serializers.lead_serializers import (
    StageChangeSerializer, LeadAssignSerializer, BulkActionSerializer,
)
from crm.services import LeadService, ImportExportService, ConversionService, DuplicateService
from crm.services.command_center_service import LeadCommandCenterService
from common.pagination import StandardResultsSetPagination


@extend_schema(tags=['CRM — Leads'])
class LeadViewSet(ModelViewSet):
    """
    Lead management ViewSet.
    All operations are company-scoped.
    """
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    filter_backends   = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class   = LeadFilter
    ordering_fields   = [
        'created_at', 'updated_at', 'estimated_value',
        'lead_score', 'next_followup_date', 'first_name',
    ]
    ordering = ['-created_at']
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        permission_map = {
            'list':           [IsAuthenticated, CanViewCRM],
            'retrieve':       [IsAuthenticated, CanViewCRM],
            'create':         [IsAuthenticated, CanCreateLead],
            'partial_update': [IsAuthenticated, CanEditLead],
            'destroy':        [IsAuthenticated, CanDeleteLead],
            'assign':         [IsAuthenticated, CanAssignLead],
            'export':         [IsAuthenticated, CanExportCRM],
            'import_leads':   [IsAuthenticated, CanImportCRM],
            'convert':        [IsAuthenticated, CanConvertLead],
        }
        permission_classes = permission_map.get(self.action, [IsAuthenticated, CanViewCRM])
        return [p() for p in permission_classes]

    def get_queryset(self):
        company = self.request.user.company
        qs = Lead.objects.filter(company=company, is_active=True).select_related(
            'stage', 'source', 'assigned_to', 'lost_reason',
        ).prefetch_related('tags')
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return LeadListSerializer
        if self.action == 'create':
            return LeadCreateSerializer
        if self.action == 'partial_update':
            return LeadUpdateSerializer
        return LeadDetailSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['company'] = self.request.user.company
        return ctx

    # ── Standard actions ──────────────────────────────────────────────────────

    @extend_schema(summary='List leads with filters and pagination')
    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(summary='Create a new lead')
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        override = validated.pop('override_duplicate', False)

        try:
            lead = LeadService.create_lead(
                company=request.user.company,
                user=request.user,
                data=validated,
                override_duplicate=override,
            )
        except DjangoValidationError as e:
            return Response(
                {'success': False, 'errors': e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)}},
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            LeadDetailSerializer(lead, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(summary='Update lead (partial)')
    def partial_update(self, request, *args, **kwargs):
        lead = self.get_object()
        serializer = self.get_serializer(lead, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = LeadService.update_lead(lead, request.user, serializer.validated_data)
        return Response(LeadDetailSerializer(updated, context=self.get_serializer_context()).data)

    @extend_schema(summary='Soft-delete a lead')
    def destroy(self, request, *args, **kwargs):
        lead = self.get_object()
        LeadService.delete_lead(lead, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Command Center ────────────────────────────────────────────────────────

    @extend_schema(summary='Get aggregated command center data for a lead')
    @action(detail=True, methods=['get'], url_path='command-center')
    def command_center(self, request, pk=None):
        lead = self.get_object()
        data = LeadCommandCenterService.get_command_center_data(
            str(lead.id), request.user, request.user.company, request=request
        )
        if not data:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)


    # ── Custom actions ────────────────────────────────────────────────────────

    @extend_schema(summary='Change pipeline stage', request=StageChangeSerializer)
    @action(detail=True, methods=['post'], url_path='stage')
    def stage_change(self, request, pk=None):
        lead = self.get_object()
        serializer = StageChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        try:
            new_stage = LeadStage.objects.get(id=vd['stage_id'], company=request.user.company)
        except LeadStage.DoesNotExist:
            return Response({'detail': 'Stage not found.'}, status=status.HTTP_404_NOT_FOUND)

        lost_reason = None
        if vd.get('lost_reason'):
            from crm.models import LostReason
            try:
                lost_reason = LostReason.objects.get(id=vd['lost_reason'], company=request.user.company)
            except LostReason.DoesNotExist:
                return Response({'detail': 'Lost reason not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            lead = LeadService.change_stage(
                lead, request.user, new_stage,
                lost_reason=lost_reason,
                lost_notes=vd.get('lost_notes', ''),
            )
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(LeadDetailSerializer(lead, context=self.get_serializer_context()).data)

    @extend_schema(summary='Assign lead to employee', request=LeadAssignSerializer)
    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        lead = self.get_object()
        serializer = LeadAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from users.models import EmployeeProfile
        try:
            employee = EmployeeProfile.objects.get(
                id=serializer.validated_data['employee_id'],
                company=request.user.company,
                is_active=True,
            )
        except EmployeeProfile.DoesNotExist:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

        lead = LeadService.assign_lead(
            lead, request.user, employee,
            reason=serializer.validated_data.get('reason', ''),
        )
        return Response(LeadDetailSerializer(lead, context=self.get_serializer_context()).data)

    @extend_schema(summary='Toggle lead starred status')
    @action(detail=True, methods=['post'], url_path='star')
    def toggle_star(self, request, pk=None):
        lead = self.get_object()
        lead = LeadService.toggle_star(lead, request.user)
        return Response({'is_starred': lead.is_starred})

    @extend_schema(summary='Check for duplicate lead before creation')
    @action(detail=False, methods=['post'], url_path='check-duplicate')
    def duplicate_check(self, request):
        result = DuplicateService.check(request.user.company, request.data)
        return Response(result)

    @extend_schema(summary='Convert lead to customer')
    @action(detail=True, methods=['post'], url_path='convert')
    def convert(self, request, pk=None):
        lead = self.get_object()
        result = ConversionService.convert(lead, request.user)
        code = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        return Response(result, status=code)

    @extend_schema(summary='Bulk action on multiple leads', request=BulkActionSerializer)
    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_action(self, request):
        serializer = BulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data
        company = request.user.company
        user = request.user

        action_name = vd['action']
        lead_ids = vd['lead_ids']

        if action_name == 'assign':
            from users.models import EmployeeProfile
            try:
                emp = EmployeeProfile.objects.get(id=vd['employee_id'], company=company)
            except EmployeeProfile.DoesNotExist:
                return Response({'detail': 'Employee not found.'}, status=404)
            count = LeadService.bulk_assign(lead_ids, company, user, emp)
            return Response({'updated': count})

        elif action_name == 'change_stage':
            try:
                stage = LeadStage.objects.get(id=vd['stage_id'], company=company)
            except LeadStage.DoesNotExist:
                return Response({'detail': 'Stage not found.'}, status=404)
            count = LeadService.bulk_change_stage(lead_ids, company, user, stage)
            return Response({'updated': count})

        elif action_name == 'delete':
            count = LeadService.bulk_delete(lead_ids, company, user)
            return Response({'deleted': count})

        elif action_name in ('star', 'unstar'):
            is_starred = action_name == 'star'
            count = Lead.objects.filter(id__in=lead_ids, company=company).update(is_starred=is_starred)
            return Response({'updated': count})

        return Response({'detail': 'Unknown action.'}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary='Export leads as CSV')
    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        qs = self.filter_queryset(self.get_queryset())
        return ImportExportService.export_csv(qs)

    @extend_schema(summary='Import leads from CSV')
    @action(detail=False, methods=['post'], url_path='import',
            parser_classes=[MultiPartParser, FormParser])
    def import_leads(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        if not file_obj.name.endswith('.csv'):
            return Response({'detail': 'Only CSV files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        result = ImportExportService.import_csv(request.user.company, request.user, file_obj)
        return Response(result, status=status.HTTP_201_CREATED if result['imported'] > 0 else status.HTTP_200_OK)
