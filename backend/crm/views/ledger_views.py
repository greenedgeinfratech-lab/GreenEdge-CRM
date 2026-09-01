from django.db.models import Count, Sum, Value, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from crm.models import AccountGroup, Ledger
from crm.permissions import CanViewCRM
from crm.serializers.ledger_serializers import AccountGroupSerializer, LedgerSerializer
from crm.views.stage_views import CompanyScopedMixin

DEFAULT_GROUPS = [
    'Current Assets', 'Fixed Assets', 'Equity', 'Long Term Liabilities',
    'Short Term Liabilities', 'Direct Income', 'Indirect Income', 'Sales',
    'Direct Expense', 'Indirect Expense', 'Purchase',
]

def ensure_default_groups(company, user):
    for sequence, name in enumerate(DEFAULT_GROUPS, start=1):
        AccountGroup.objects.get_or_create(company=company, name=name, defaults={
            'sequence': sequence, 'created_by': user, 'updated_by': user,
        })


class AccountGroupViewSet(CompanyScopedMixin, ModelViewSet):
    queryset_model = AccountGroup
    serializer_class = AccountGroupSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get_queryset(self):
        ensure_default_groups(self.request.user.company, self.request.user)
        from django.db.models import Q
        return AccountGroup.objects.filter(company=self.request.user.company, is_active=True).annotate(
            ledger_count=Count('ledgers', filter=Q(ledgers__is_active=True)),
            opening_total=Coalesce(Sum('ledgers__opening_balance', filter=Q(ledgers__is_active=True)), Value(0, output_field=DecimalField())),
        ).order_by('sequence', 'name')


class LedgerViewSet(CompanyScopedMixin, ModelViewSet):
    queryset_model = Ledger
    serializer_class = LedgerSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]

    def get_queryset(self):
        queryset = Ledger.objects.filter(company=self.request.user.company, is_active=True).select_related('group')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(name__icontains=search)
        favourite = self.request.query_params.get('favourite')
        if favourite == 'true':
            queryset = queryset.filter(is_favourite=True)
        return queryset
