"""
CRM Analytics Views
====================
Read-only analytics endpoints:
  /api/v1/crm/analytics/     — Full analytics breakdown
  /api/v1/crm/dashboard/     — Dashboard summary (used by dashboard service)
"""

from datetime import timedelta

from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from crm.models import Lead, LeadStage, LeadFollowup, Appointment
from crm.permissions import CanViewCRM
from crm.services.stage_service import StageService


@extend_schema(tags=['CRM — Analytics'])
class CRMAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get(self, request):
        company = request.user.company
        today   = timezone.localdate()
        fy_start = _get_fy_start(today)

        qs = Lead.objects.filter(company=company)

        # ── Summary counts ──────────────────────────────────────────────────
        # Pipeline stages are the source of truth. Keep status values as a
        # fallback for older leads that do not have a stage yet.
        closed_statuses = ['won', 'lost', 'converted', 'archived']
        active_leads = qs.filter(is_active=True).exclude(
            Q(stage__is_won=True) | Q(stage__is_lost=True) | Q(status__in=closed_statuses)
        )
        won_leads = qs.filter(Q(stage__is_won=True) | Q(status__in=['won', 'converted']))
        lost_leads = qs.filter(Q(stage__is_lost=True) | Q(status='lost'))

        total_active = active_leads.count()
        total_won = won_leads.count()
        total_lost = lost_leads.count()
        total_pipeline_value = active_leads.aggregate(v=Sum('estimated_value'))['v'] or 0

        won_value = won_leads.aggregate(v=Sum('estimated_value'))['v'] or 0
        conversion_rate = round(total_won / (total_won + total_lost) * 100, 1) if (total_won + total_lost) else 0
        avg_score = qs.filter(is_active=True).aggregate(v=Avg('lead_score'))['v'] or 0

        # ── Leads by stage ─────────────────────────────────────────────────
        by_stage = StageService.get_pipeline_summary(company)

        # ── Leads by source ────────────────────────────────────────────────
        by_source = list(
            active_leads.filter(source__isnull=False)
            .values('source__name')
            .annotate(count=Count('id'), value=Sum('estimated_value'))
            .order_by('-count')
        )

        # ── Leads by priority ──────────────────────────────────────────────
        by_priority = list(
            active_leads
            .values('priority')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # ── Today's follow-ups ─────────────────────────────────────────────
        todays_followups = LeadFollowup.objects.filter(
            company=company,
            next_followup_date=today,
            status='pending',
            is_active=True,
        ).count()

        overdue_followups = LeadFollowup.objects.filter(
            company=company,
            next_followup_date__lt=today,
            status='pending',
            is_active=True,
        ).count()

        # ── Today's appointments ───────────────────────────────────────────
        todays_appointments = Appointment.objects.filter(
            company=company,
            start_time__date=today,
            status='scheduled',
            is_active=True,
        ).count()

        # ── Monthly trend (last 6 months) ──────────────────────────────────
        monthly_trend = []
        for i in range(5, -1, -1):
            month_date = (today.replace(day=1) - timedelta(days=i * 28))
            month_start = month_date.replace(day=1)
            if month_date.month == 12:
                month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
            else:
                month_end = month_date.replace(month=month_date.month + 1, day=1)

            month_leads = qs.filter(created_at__date__gte=month_start, created_at__date__lt=month_end)
            monthly_trend.append({
                'month': month_start.strftime('%b %Y'),
                'new_leads': month_leads.count(),
                'won': month_leads.filter(status='won').count(),
                'lost': month_leads.filter(status='lost').count(),
                'value': float(month_leads.filter(status='won').aggregate(v=Sum('estimated_value'))['v'] or 0),
            })

        # ── FY comparison ──────────────────────────────────────────────────
        fy_leads = qs.filter(created_at__date__gte=fy_start)

        return Response({
            'summary': {
                'total_active': total_active,
                'total_won': total_won,
                'total_lost': total_lost,
                'conversion_rate': conversion_rate,
                'total_pipeline_value': float(total_pipeline_value),
                'won_value': float(won_value),
                'avg_score': round(float(avg_score), 1),
                'todays_followups': todays_followups,
                'overdue_followups': overdue_followups,
                'todays_appointments': todays_appointments,
            },
            'by_stage': by_stage,
            'by_source': by_source,
            'by_priority': by_priority,
            'monthly_trend': monthly_trend,
            'financial_year': {
                'start': str(fy_start),
                'new_leads': fy_leads.count(),
                'won_count': fy_leads.filter(status='won').count(),
                'won_value': float(fy_leads.filter(status='won').aggregate(v=Sum('estimated_value'))['v'] or 0),
            }
        })


@extend_schema(tags=['CRM — Analytics'])
class CRMDashboardSummaryView(APIView):
    """
    Lightweight summary consumed by the Dashboard service.
    Returns the same shape as CRMService.get_funnel().
    """
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get(self, request):
        company = request.user.company
        today   = timezone.localdate()

        stages = StageService.get_pipeline_summary(company)
        won_stages = [s for s in stages if s['is_won']]
        active_stages = [s for s in stages if not s['is_lost']]

        total_active = sum(s['count'] for s in active_stages if not s['is_won'])
        won_count = sum(s['count'] for s in won_stages)
        won_value = sum(s['value'] for s in won_stages)
        total_pipeline = sum(s['value'] for s in active_stages)
        conversion_rate = round(won_count / (total_active + won_count) * 100, 1) if (total_active + won_count) else 0
        todays_followups = LeadFollowup.objects.filter(
            company=company, next_followup_date=today, status='pending', is_active=True
        ).count()

        return Response({
            'stages': stages,
            'summary': {
                'total_active_leads': total_active,
                'total_pipeline_value': total_pipeline,
                'won_count': won_count,
                'won_value': won_value,
                'conversion_rate': conversion_rate,
                'todays_followups': todays_followups,
            },
            'is_mock': False,
        })


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_fy_start(today):
    """Returns the start date of the Indian financial year (April 1)."""
    fy_year = today.year if today.month >= 4 else today.year - 1
    from datetime import date
    return date(fy_year, 4, 1)

@extend_schema(tags=['CRM — Analytics'])
class RawLeadsDashboardView(APIView):
    """
    Returns specific data for the Raw Leads Dashboard view.
    """
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get(self, request):
        company = request.user.company
        period = request.query_params.get('period', 'this_month')
        
        today = timezone.localdate()
        if period == 'this_month':
            start_date = today.replace(day=1)
            end_date = today
        elif period == 'last_month':
            end_date = today.replace(day=1) - timedelta(days=1)
            start_date = end_date.replace(day=1)
        elif period == 'this_year':
            start_date = today.replace(month=1, day=1)
            end_date = today
        else:
            start_date = today.replace(day=1)
            end_date = today

        qs = Lead.objects.filter(company=company, created_at__date__gte=start_date, created_at__date__lte=end_date)

        # ── KPI Blocks ────────────────────────────────────────────────────────
        leads_received = qs.count()
        qualified_leads = qs.filter(status='won').count()
        rejected_leads = qs.filter(status='lost').count()
        active_leads = qs.filter(is_active=True, status__in=['open', 'in_progress', 'on_hold']).count()

        appointments = Appointment.objects.filter(company=company, start_time__date__gte=start_date, start_time__date__lte=end_date).count()
        missed_appointments = Appointment.objects.filter(company=company, start_time__date__gte=start_date, start_time__date__lt=timezone.now(), status='scheduled').count()

        unassigned_leads = qs.filter(assigned_to__isnull=True).count()
        no_interactions = qs.annotate(f_count=Count('followups')).filter(f_count=0).count()

        # ── Pie Charts ────────────────────────────────────────────────────────
        source_wise = list(qs.filter(source__isnull=False).values('source__name').annotate(value=Count('id')).order_by('-value'))
        product_wise = list(qs.exclude(product_interested='').values('product_interested').annotate(value=Count('id')).order_by('-value'))

        # Rename keys for charts
        source_wise = [{'name': s['source__name'], 'value': s['value']} for s in source_wise]
        product_wise = [{'name': s['product_interested'], 'value': s['value']} for s in product_wise]

        # ── Key Data ──────────────────────────────────────────────────────────
        best_source = source_wise[0]['name'] if source_wise else '-'
        best_product = product_wise[0]['name'] if product_wise else '-'

        # Finding most missed appointments user
        users_missed = list(Appointment.objects.filter(company=company, start_time__date__gte=start_date, start_time__date__lt=timezone.now(), status='scheduled', assigned_to__isnull=False).values('assigned_to__first_name', 'assigned_to__last_name').annotate(count=Count('id')).order_by('-count')[:1])
        most_missed = f"{users_missed[0]['assigned_to__first_name']} {users_missed[0]['assigned_to__last_name']}" if users_missed else '-'

        # Finding most uncontacted leads user
        users_uncontacted = list(qs.filter(assigned_to__isnull=False).annotate(f_count=Count('followups')).filter(f_count=0).values('assigned_to__first_name', 'assigned_to__last_name').annotate(count=Count('id')).order_by('-count')[:1])
        most_uncontacted = f"{users_uncontacted[0]['assigned_to__first_name']} {users_uncontacted[0]['assigned_to__last_name']}" if users_uncontacted else '-'

        return Response({
            'leads_received': leads_received,
            'qualified_leads': qualified_leads,
            'rejected_leads': rejected_leads,
            'active_leads': active_leads,
            'appointments': appointments,
            'missed_appointments': missed_appointments,
            'no_interactions': no_interactions,
            'unassigned_leads': unassigned_leads,
            'source_wise': source_wise,
            'product_wise': product_wise,
            'key_data': {
                'best_source': best_source,
                'best_product': best_product,
                'most_missed_appointments': most_missed,
                'most_uncontacted': most_uncontacted,
                'max_converted': '-',
                'max_count': '-',
                'most_rejected': '-'
            }
        })
