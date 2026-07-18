from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django.db.models import Q
from django.utils import timezone

from crm.models import Order
from crm.permissions import CanViewCRM
from crm.views.stage_views import CompanyScopedMixin
from crm.serializers import OrderSerializer

class OrderViewSet(CompanyScopedMixin, ModelViewSet):
    """
    ViewSet for managing Sale Orders.
    """
    queryset_model = Order
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, CanViewCRM]
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        # Scopes to company and active via CompanyScopedMixin
        qs = super().get_queryset()

        # Search parameter
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(customer_name__icontains=search) |
                Q(order_number__icontains=search) |
                Q(reference__icontains=search)
            )

        status_val = self.request.query_params.get('status')
        if status_val and status_val != 'All Status':
            qs = qs.filter(status__iexact=status_val)

        executive = self.request.query_params.get('executive')
        if executive and executive != 'All Executives':
            qs = qs.filter(
                Q(sales_credit__icontains=executive) |
                Q(executive__icontains=executive) |
                Q(created_by__first_name__icontains=executive) |
                Q(created_by__last_name__icontains=executive)
            )

        date_range = self.request.query_params.get('date_range')
        if date_range == 'this_month':
            now = timezone.now()
            qs = qs.filter(order_date__year=now.year, order_date__month=now.month)

        return qs
