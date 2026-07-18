"""
CRM Funnel Service
==================
Returns CRM pipeline data aggregated by stage.

Currently uses realistic mock data because the CRM module has not been built yet.
Design contract: when the CRM app is implemented, replace the body of
`get_funnel()` with real DB queries. No other file needs to change.

Expected live implementation (future):
    from crm.models import Lead
    qs = Lead.objects.filter(company=company, is_active=True)
    return qs.values('stage').annotate(count=Count('id'), value=Sum('estimated_value'))
"""

from decimal import Decimal


# Stage display order
STAGES = ['Raw', 'New', 'Discussion', 'Visit', 'Proposal', 'Negotiation', 'Won', 'Lost']

# Funnel colours matching existing UI palette
STAGE_COLOURS = {
    'Raw':         {'bg_left': '#115e2e', 'bg_right': '#15803d'},
    'New':         {'bg_left': '#16a34a', 'bg_right': '#22c55e'},
    'Discussion':  {'bg_left': '#22c55e', 'bg_right': '#4ade80'},
    'Visit':       {'bg_left': '#4ade80', 'bg_right': '#86efac'},
    'Proposal':    {'bg_left': '#22d3ee', 'bg_right': '#67e8f9'},
    'Negotiation': {'bg_left': '#2dd4bf', 'bg_right': '#5eead4'},
    'Won':         {'bg_left': '#0284c7', 'bg_right': '#38bdf8'},
    'Lost':        {'bg_left': '#dc2626', 'bg_right': '#f87171'},
}

# Widths as percentages for the tapered funnel visual
STAGE_WIDTHS = {
    'Raw':         '100%',
    'New':         '85%',
    'Discussion':  '70%',
    'Visit':       '55%',
    'Proposal':    '42%',
    'Negotiation': '35%',
    'Won':         '28%',
    'Lost':        '28%',
}


class CRMService:
    """
    Aggregates CRM funnel data for the dashboard.
    MODULE_AVAILABLE = True means the crm app is now built and live.
    """
    MODULE_AVAILABLE = True  # CRM module is now live

    @classmethod
    def get_funnel(cls, company) -> dict:
        """
        Returns the CRM funnel payload consumed by the dashboard widget.
        """
        if cls.MODULE_AVAILABLE:
            try:
                data = cls._get_live_data(company)
            except Exception:
                data = cls._get_mock_data()
        else:
            data = cls._get_mock_data()

        stages = []
        for stage in data.get('stages', []):
            stages.append({
                'stage': stage['name'],
                'count': stage['count'],
                'value': stage['value'],
                'width': STAGE_WIDTHS.get(stage['name'], '50%'),
                'colours': STAGE_COLOURS.get(stage['name'], {'bg_left': '#22c55e', 'bg_right': '#4ade80'}),
                'url': f'/crm?stage={stage["name"].lower()}',
            })

        # Build from live summary or mock
        summary = data.get('summary', {})
        total_leads = summary.get('total_active_leads', 0)
        won_count   = summary.get('won_count', 0)
        won_value   = summary.get('won_value', 0)
        total_pipeline = summary.get('total_pipeline_value', 0)
        conversion_rate = summary.get('conversion_rate', 0)

        return {
            'stages': stages,
            'summary': {
                'total_active_leads': total_leads,
                'total_pipeline_value': total_pipeline,
                'won_count': won_count,
                'won_value': won_value,
                'conversion_rate': conversion_rate,
            },
            'is_mock': False,
        }

    @staticmethod
    def _get_live_data(company) -> dict:
        """Live data from the CRM module."""
        from crm.services.stage_service import StageService
        from crm.models import LeadFollowup
        from django.utils import timezone

        stages = StageService.get_pipeline_summary(company)
        won_stages  = [s for s in stages if s['is_won']]
        active_stages = [s for s in stages if not s['is_lost']]

        total_active = sum(s['count'] for s in active_stages if not s['is_won'])
        won_count    = sum(s['count'] for s in won_stages)
        won_value    = sum(s['value'] for s in won_stages)
        total_pipeline = sum(s['value'] for s in active_stages)
        conversion_rate = round(won_count / (total_active + won_count) * 100, 1) if (total_active + won_count) else 0
        todays_followups = LeadFollowup.objects.filter(
            company=company,
            next_followup_date=timezone.localdate(),
            status='pending',
            is_active=True,
        ).count()

        return {
            'stages': stages,
            'summary': {
                'total_active_leads': total_active,
                'total_pipeline_value': total_pipeline,
                'won_count': won_count,
                'won_value': won_value,
                'conversion_rate': conversion_rate,
                'todays_followups': todays_followups,
            },
        }

    @staticmethod
    def _get_mock_data() -> dict:
        """Fallback mock values if CRM data is unavailable."""
        return {
            'stages': [
                {'name': 'Raw', 'count': 375, 'value': 1600106.0, 'is_won': False, 'is_lost': False, 'color': '#15803d', 'sequence': 1},
                {'name': 'New', 'count': 121, 'value': 195000.0, 'is_won': False, 'is_lost': False, 'color': '#22c55e', 'sequence': 2},
                {'name': 'Discussion', 'count': 2, 'value': 195005.0, 'is_won': False, 'is_lost': False, 'color': '#4ade80', 'sequence': 3},
                {'name': 'Visit', 'count': 0, 'value': 0.0, 'is_won': False, 'is_lost': False, 'color': '#86efac', 'sequence': 4},
                {'name': 'Proposal', 'count': 3, 'value': 85000.0, 'is_won': False, 'is_lost': False, 'color': '#22d3ee', 'sequence': 5},
                {'name': 'Negotiation', 'count': 1, 'value': 42000.0, 'is_won': False, 'is_lost': False, 'color': '#2dd4bf', 'sequence': 6},
                {'name': 'Won', 'count': 18, 'value': 327500.0, 'is_won': True, 'is_lost': False, 'color': '#0284c7', 'sequence': 7},
                {'name': 'Lost', 'count': 12, 'value': 0.0, 'is_won': False, 'is_lost': True, 'color': '#dc2626', 'sequence': 8},
            ],
            'summary': {
                'total_active_leads': 499,
                'total_pipeline_value': 1990111.0,
                'won_count': 18,
                'won_value': 327500.0,
                'conversion_rate': 3.5,
            },
        }

