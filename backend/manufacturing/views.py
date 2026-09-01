import uuid
from django.utils import timezone
from django.db.models import Q, Count

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import ProductionJob, JobActivity
from .serializers import ProductionJobSerializer, ProductionJobListSerializer, JobActivitySerializer


class ProductionJobViewSet(ModelViewSet):
    """
    CRUD + status-update for Production Jobs.

    Filters:
      ?status=in_progress|draft|on_hold|completed|cancelled
      ?search=<text>
      ?priority=low|medium|high
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = self.request.user.company
        qs = ProductionJob.objects.filter(company=company, is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(job_no__icontains=search) |
                Q(product_name__icontains=search)
            )

        status_val = self.request.query_params.get('status')
        if status_val and status_val != 'all':
            qs = qs.filter(status=status_val)

        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)

        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductionJobListSerializer
        return ProductionJobSerializer

    def perform_create(self, serializer):
        company = self.request.user.company

        # Auto-generate job_no
        count = ProductionJob.objects.filter(company=company).count() + 1
        job_no = f"MFG-{str(count).zfill(4)}"

        serializer.save(
            company=company,
            created_by=self.request.user,
            updated_by=self.request.user,
            job_no=job_no,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """POST /api/v1/manufacturing/jobs/{id}/update-status/ { status: "completed" }"""
        job = self.get_object()
        new_status = request.data.get('status')

        valid = [s[0] for s in ProductionJob.STATUS_CHOICES]
        if new_status not in valid:
            return Response(
                {'detail': f'Invalid status. Choose from: {valid}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = job.status
        job.status = new_status
        if new_status == 'completed':
            job.completed_at = timezone.now()
        job.updated_by = request.user
        job.save()

        # Log the status change
        JobActivity.objects.create(
            company=job.company,
            job=job,
            activity_type='status_change',
            notes=f"Status changed from '{old_status}' to '{new_status}'",
            created_by=request.user,
            updated_by=request.user,
        )

        return Response(ProductionJobSerializer(job).data)

    @action(detail=True, methods=['get', 'post'], url_path='activities')
    def activities(self, request, pk=None):
        """GET/POST /api/v1/manufacturing/jobs/{id}/activities/"""
        job = self.get_object()

        if request.method == 'GET':
            acts = JobActivity.objects.filter(job=job).order_by('-timestamp')
            return Response(JobActivitySerializer(acts, many=True).data)

        serializer = JobActivitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            company=job.company,
            job=job,
            created_by=request.user,
            updated_by=request.user,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """GET /api/v1/manufacturing/jobs/summary/ — dashboard KPIs"""
        company = request.user.company
        qs = ProductionJob.objects.filter(company=company, is_active=True)

        return Response({
            'total':       qs.count(),
            'draft':       qs.filter(status='draft').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'on_hold':     qs.filter(status='on_hold').count(),
            'completed':   qs.filter(status='completed').count(),
            'cancelled':   qs.filter(status='cancelled').count(),
        })
