"""
Dashboard Service
==================
Orchestrator — calls all widget services and assembles the single
API response for GET /api/v1/dashboard/

Also applies role-based visibility filtering.
"""

from django.utils import timezone
from common.models import ActivityLog
from .crm_service import CRMService
from .sales_service import SalesService
from .recovery_service import ActionAreasService
from .task_service import TaskService
from .notification_service import NotificationService


# Widgets visible by role name (case-insensitive match on role.name)
ROLE_WIDGET_MAP = {
    'admin': '__all__',
    'superuser': '__all__',
    'sales executive': ['crm_funnel', 'sales_overview', 'shortcuts', 'tasks', 'activity_feed', 'notifications', 'kpis'],
    'accounts': ['sales_overview', 'action_areas', 'notifications', 'tasks'],
    'inventory manager': ['action_areas', 'notifications', 'tasks'],
}
DEFAULT_WIDGETS = ['sales_overview', 'action_areas', 'shortcuts', 'tasks', 'activity_feed', 'notifications']


def _get_visible_widgets(user) -> list | str:
    """Return '__all__' or a list of widget keys for the user."""
    try:
        role_name = user.employee_profile.role.name.lower()
        for role_key, widgets in ROLE_WIDGET_MAP.items():
            if role_key in role_name:
                return widgets
    except Exception:
        pass
    return DEFAULT_WIDGETS


def _get_company_info(user) -> dict:
    company = user.company
    if not company:
        return {}
    logo_url = None
    if company.logo:
        try:
            logo_url = company.logo.url
        except Exception:
            pass
    return {
        'id': str(company.id),
        'name': company.name,
        'financial_year': company.financial_year or '2026-27',
        'currency': company.currency or 'INR',
        'logo': logo_url,
    }


def _get_user_info(user) -> dict:
    last_login = None
    try:
        session = user.sessions.filter(is_active=True).order_by('-login_time').first()
        if session:
            last_login = session.login_time.isoformat()
    except Exception:
        pass
    return {
        'id': str(user.id),
        'name': f"{user.first_name} {user.last_name}".strip() or user.email,
        'email': user.email,
        'last_login': last_login,
    }


def _get_activity_feed(company, limit=20) -> list:
    try:
        logs = ActivityLog.objects.filter(company=company).select_related('user')[:limit]
        return [
            {
                'id': str(log.id),
                'type': log.activity_type,
                'description': log.description,
                'timestamp': log.timestamp.isoformat(),
                'user': (
                    f"{log.user.first_name} {log.user.last_name}".strip()
                    if log.user else 'System'
                ),
                'related_model': log.related_model,
                'related_object_id': str(log.related_object_id) if log.related_object_id else None,
            }
            for log in logs
        ]
    except Exception:
        return []


def _get_kpis(company, sales_data: dict, crm_data: dict, action_areas: dict) -> dict:
    """Compute top-level KPI cards from aggregated data."""
    return {
        'total_pipeline': crm_data['summary']['total_pipeline_value'],
        'won_this_fy': crm_data['summary']['won_value'],
        'conversion_rate': crm_data['summary']['conversion_rate'],
        'outstanding_recovery': action_areas['outstanding_recovery']['amount'],
        'open_orders': action_areas['open_orders']['amount'],
        'monthly_revenue': sales_data.get('this_month', {}).get('amount', 0),
    }


def _get_shortcuts() -> list:
    """Static shortcut definitions with navigation URLs."""
    return [
        {'label': 'Open Quotes & PIs', 'url': '/quotes', 'icon': 'FileText'},
        {'label': 'Deliveries', 'url': '/orders', 'icon': 'Truck'},
        {'label': 'Trade Profitability', 'url': '/reports', 'icon': 'BarChart3'},
        {'label': 'Valuable Items', 'url': '/inventory', 'icon': 'Package'},
        {'label': 'Low Stock', 'url': '/inventory?filter=low-stock', 'icon': 'AlertTriangle'},
        {'label': 'Credit Notes', 'url': '/invoices?type=credit', 'icon': 'CreditCard'},
        {'label': 'Debit Notes', 'url': '/invoices?type=debit', 'icon': 'Receipt'},
        {'label': 'Important Dates', 'url': '/tasks?filter=due', 'icon': 'Calendar'},
        {'label': 'Stock Shortfall', 'url': '/inventory?filter=shortfall', 'icon': 'AlertCircle'},
    ]


def _get_charts_data(crm_data: dict, sales_data: dict) -> dict:
    """Prepare chart series data."""
    # CRM funnel for recharts
    funnel_chart = [
        {'name': s['stage'], 'value': s['count'], 'fill': s['colours'].get('bg_right', '#22c55e')}
        for s in crm_data['stages']
        if s['stage'] not in ('Won', 'Lost')
    ]

    # Monthly sales trend (mock until Sales module is live)
    from datetime import date
    from django.utils import timezone
    today = timezone.localdate()

    months = []
    for i in range(5, -1, -1):
        m = (today.month - i - 1) % 12 + 1
        y = today.year - ((today.month - i - 1) // 12 + (1 if today.month - i < 1 else 0))
        months.append({'month': date(y, m, 1).strftime('%b'), 'revenue': 0, 'target': 0})

    # Inject some mock variation
    mock_revenues = [4200, 3800, 5100, 2900, 4700, sales_data.get('last_month', {}).get('amount', 0)]
    for i, m in enumerate(months):
        m['revenue'] = mock_revenues[i]
        m['target'] = mock_revenues[i] * 1.1

    return {
        'crm_funnel': funnel_chart,
        'sales_trend': months,
        'monthly_conversion': [
            {'month': m['month'], 'rate': round((m['revenue'] / (m['target'] or 1)) * 100, 1)}
            for m in months
        ],
    }


class DashboardService:

    @classmethod
    def get_dashboard(cls, user) -> dict:
        company = user.company

        visible_widgets = _get_visible_widgets(user)

        # Fetch all data (guard each section independently)
        crm_data = {}
        try:
            crm_data = CRMService.get_funnel(company)
        except Exception as e:
            crm_data = {'error': str(e), 'stages': [], 'summary': {}}

        sales_data = {}
        try:
            sales_data = SalesService.get_sales_overview(company)
        except Exception as e:
            sales_data = {'error': str(e)}

        action_areas = {}
        try:
            action_areas = ActionAreasService.get_action_areas(company)
        except Exception as e:
            action_areas = {'error': str(e)}

        tasks = []
        task_summary = {}
        try:
            tasks = TaskService.get_tasks_for_user(user, company)
            task_summary = TaskService.get_summary(user, company)
        except Exception as e:
            tasks = []
            task_summary = {'error': str(e)}

        notifications_data = {}
        try:
            notifications_data = NotificationService.get_summary(user, company)
        except Exception as e:
            notifications_data = {'unread_count': 0, 'recent': [], 'error': str(e)}

        activity_feed = []
        try:
            activity_feed = _get_activity_feed(company)
        except Exception as e:
            activity_feed = []

        kpis = {}
        try:
            kpis = _get_kpis(company, sales_data, crm_data, action_areas)
        except Exception:
            kpis = {}

        charts = {}
        try:
            charts = _get_charts_data(crm_data, sales_data)
        except Exception:
            charts = {}

        return {
            'company': _get_company_info(user),
            'user': _get_user_info(user),
            'visible_widgets': visible_widgets,
            'crm_funnel': crm_data,
            'sales_overview': sales_data,
            'action_areas': action_areas,
            'shortcuts': _get_shortcuts(),
            'tasks': {
                'summary': task_summary,
                'items': [
                    {
                        'id': str(t.id),
                        'title': t.title,
                        'description': t.description,
                        'due_date': t.due_date.isoformat() if t.due_date else None,
                        'status': t.status,
                        'priority': t.priority,
                        'assigned_to': (
                            f"{t.assigned_to.first_name} {t.assigned_to.last_name}".strip()
                            if t.assigned_to else None
                        ),
                    }
                    for t in tasks
                ],
            },
            'activity_feed': activity_feed,
            'notifications': {
                'unread_count': notifications_data.get('unread_count', 0),
                'recent': [
                    {
                        'id': str(n.id),
                        'title': n.title,
                        'message': n.message,
                        'type': n.notification_type,
                        'is_read': n.is_read,
                        'related_url': n.related_url,
                        'created_at': n.created_at.isoformat(),
                    }
                    for n in notifications_data.get('recent', [])
                ],
            },
            'kpis': kpis,
            'charts': charts,
        }
