"""
Stage Service
=============
Business logic for managing CRM pipeline stages, sources, tags, and lost reasons.
Also handles seeding default stages for new companies.
"""

from django.db import transaction
from crm.models import LeadStage, LeadSource, LeadTag, LostReason


# Default stage configuration for new companies
DEFAULT_STAGES = [
    {'name': 'Raw',         'sequence': 1, 'color': '#15803d', 'is_default': True},
    {'name': 'New',         'sequence': 2, 'color': '#22c55e'},
    {'name': 'Discussion',  'sequence': 3, 'color': '#4ade80'},
    {'name': 'Visit',       'sequence': 4, 'color': '#86efac'},
    {'name': 'Proposal',    'sequence': 5, 'color': '#22d3ee'},
    {'name': 'Negotiation', 'sequence': 6, 'color': '#2dd4bf'},
    {'name': 'Won',         'sequence': 7, 'color': '#0284c7', 'is_won': True},
    {'name': 'Lost',        'sequence': 8, 'color': '#dc2626', 'is_lost': True},
]

DEFAULT_SOURCES = [
    'IndiaMART', 'Website', 'Meta Ads', 'Google Ads',
    'TradeIndia', 'Referral', 'Walk-In', 'Cold Call',
    'WhatsApp', 'Email Campaign', 'Exhibition', 'Other',
]

DEFAULT_TAGS = [
    {'name': 'Hot',        'color': '#ef4444'},
    {'name': 'Warm',       'color': '#f97316'},
    {'name': 'Cold',       'color': '#3b82f6'},
    {'name': 'VIP',        'color': '#8b5cf6'},
    {'name': 'Government', 'color': '#0891b2'},
    {'name': 'Dealer',     'color': '#059669'},
]

DEFAULT_LOST_REASONS = [
    'Price Too High', 'Went to Competitor', 'Budget Constraints',
    'No Response', 'Project Cancelled', 'Not Interested', 'Requirement Changed',
]


class StageService:

    @classmethod
    @transaction.atomic
    def seed_defaults(cls, company, user=None) -> dict:
        """
        Populate default stages, sources, tags, and lost reasons for a new company.
        Safe to call multiple times — uses get_or_create.
        """
        stages_created = 0
        for s in DEFAULT_STAGES:
            obj, created = LeadStage.objects.get_or_create(
                company=company, name=s['name'],
                defaults={
                    'sequence': s.get('sequence', 0),
                    'color': s.get('color', '#22c55e'),
                    'is_won': s.get('is_won', False),
                    'is_lost': s.get('is_lost', False),
                    'is_default': s.get('is_default', False),
                    'created_by': user,
                    'updated_by': user,
                }
            )
            if created:
                stages_created += 1

        sources_created = 0
        for name in DEFAULT_SOURCES:
            _, created = LeadSource.objects.get_or_create(
                company=company, name=name,
                defaults={'created_by': user, 'updated_by': user}
            )
            if created:
                sources_created += 1

        tags_created = 0
        for t in DEFAULT_TAGS:
            _, created = LeadTag.objects.get_or_create(
                company=company, name=t['name'],
                defaults={'color': t['color'], 'created_by': user, 'updated_by': user}
            )
            if created:
                tags_created += 1

        reasons_created = 0
        for name in DEFAULT_LOST_REASONS:
            _, created = LostReason.objects.get_or_create(
                company=company, name=name,
                defaults={'created_by': user, 'updated_by': user}
            )
            if created:
                reasons_created += 1

        return {
            'stages': stages_created,
            'sources': sources_created,
            'tags': tags_created,
            'lost_reasons': reasons_created,
        }

    @staticmethod
    def reorder_stages(company, stage_order: list[dict]):
        """
        Reorder stages by updating sequence fields.
        `stage_order` = [{'id': uuid, 'sequence': int}, ...]
        """
        for item in stage_order:
            LeadStage.objects.filter(id=item['id'], company=company).update(sequence=item['sequence'])

    @staticmethod
    def get_pipeline_summary(company) -> list:
        """Returns all stages with lead counts for the dashboard funnel."""
        from django.db.models import Count, Sum, DecimalField
        from django.db.models.functions import Coalesce
        from crm.models import Lead
        import decimal

        stages = LeadStage.objects.filter(company=company, is_active=True).annotate(
            lead_count=Count('leads', filter=__import__('django.db.models', fromlist=['Q']).Q(leads__is_active=True)),
            pipeline_value=Coalesce(
                Sum('leads__estimated_value',
                    filter=__import__('django.db.models', fromlist=['Q']).Q(leads__is_active=True)),
                decimal.Decimal('0.00'),
                output_field=DecimalField()
            )
        ).order_by('sequence')

        return [
            {
                'id': str(s.id),
                'name': s.name,
                'color': s.color,
                'sequence': s.sequence,
                'is_won': s.is_won,
                'is_lost': s.is_lost,
                'count': s.lead_count,
                'value': float(s.pipeline_value),
            }
            for s in stages
        ]
