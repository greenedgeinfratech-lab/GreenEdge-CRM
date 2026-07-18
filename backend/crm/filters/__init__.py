"""
CRM Filters
===========
django-filter FilterSets for server-side filtering of leads.
All filters are automatically scoped to the authenticated company.
"""

import django_filters
from django_filters import rest_framework as filters

from crm.models import Lead, LeadStage, LeadSource


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass


class LeadFilter(filters.FilterSet):
    """
    Complete filter set for the Lead list endpoint.

    URL params:
        stage           — UUID of LeadStage
        status          — open | in_progress | on_hold | won | lost | converted (comma-separated allowed)
        priority        — low | medium | high | urgent (comma-separated allowed)
        source          — UUID of LeadSource
        assigned_to     — UUID of EmployeeProfile
        is_starred      — true | false
        city            — icontains match
        state           — exact match
        search          — full-text search across name, mobile, email, company_name
        min_value       — minimum estimated_value
        max_value       — maximum estimated_value
        min_score       — minimum lead_score
        next_followup   — exact date (YYYY-MM-DD)
        next_followup_before / next_followup_after — date range
        created_after / created_before — date range
        tag             — UUID of LeadTag (M2M filter)
    """

    stage       = filters.UUIDFilter(field_name='stage__id')
    status      = CharInFilter(field_name='status', lookup_expr='in')
    priority    = CharInFilter(field_name='priority', lookup_expr='in')
    source      = filters.UUIDFilter(field_name='source__id')
    assigned_to = filters.UUIDFilter(field_name='assigned_to__id')
    tag         = filters.UUIDFilter(field_name='tags__id')
    is_starred  = filters.BooleanFilter(field_name='is_starred')

    city        = filters.CharFilter(field_name='city', lookup_expr='icontains')
    state       = filters.CharFilter(field_name='state', lookup_expr='exact')

    min_value   = filters.NumberFilter(field_name='estimated_value', lookup_expr='gte')
    max_value   = filters.NumberFilter(field_name='estimated_value', lookup_expr='lte')
    min_score   = filters.NumberFilter(field_name='lead_score', lookup_expr='gte')

    next_followup        = filters.DateFilter(field_name='next_followup_date', lookup_expr='exact')
    next_followup_before = filters.DateFilter(field_name='next_followup_date', lookup_expr='lte')
    next_followup_after  = filters.DateFilter(field_name='next_followup_date', lookup_expr='gte')

    created_after  = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    country = filters.CharFilter(field_name='country', lookup_expr='exact')
    product_interested = filters.CharFilter(field_name='product_interested', lookup_expr='icontains')
    last_contact_before = filters.DateFilter(field_name='last_contact_date', lookup_expr='lte')
    next_followup_isnull = filters.BooleanFilter(field_name='next_followup_date', lookup_expr='isnull')

    search = filters.CharFilter(method='filter_search', label='Search')

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(company_name__icontains=value) |
            Q(mobile__icontains=value) |
            Q(email__icontains=value) |
            Q(lead_number__icontains=value)
        )

    class Meta:
        model = Lead
        fields = [
            'stage', 'status', 'priority', 'source', 'assigned_to',
            'tag', 'is_starred', 'city', 'state', 'country', 'product_interested',
            'min_value', 'max_value', 'min_score',
            'next_followup', 'next_followup_before', 'next_followup_after', 'next_followup_isnull',
            'created_after', 'created_before', 'last_contact_before'
        ]
