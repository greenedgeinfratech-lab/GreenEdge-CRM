"""
Sales Overview Service
=======================
Returns sales summary figures for the dashboard widget.

Mock-first design: flip MODULE_AVAILABLE = True and implement
_get_live_data() when Orders/Invoices apps are built.

Live implementation will query:
    - Orders app for order amounts
    - Invoices app for invoiced amounts
    - Company financial year settings for date ranges
"""

from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone


def _financial_year_bounds(today: date):
    """
    Indian financial year: April 1 → March 31.
    Returns (start_date, end_date) for the current FY.
    """
    if today.month >= 4:
        fy_start = date(today.year, 4, 1)
        fy_end = date(today.year + 1, 3, 31)
        fy_label = f"{today.year}-{str(today.year + 1)[2:]}"
    else:
        fy_start = date(today.year - 1, 4, 1)
        fy_end = date(today.year, 3, 31)
        fy_label = f"{today.year - 1}-{str(today.year)[2:]}"
    return fy_start, fy_end, fy_label


class SalesService:
    MODULE_AVAILABLE = False  # Flip to True once Orders/Invoices apps exist

    @classmethod
    def get_sales_overview(cls, company) -> dict:
        today = timezone.localdate()
        fy_start, fy_end, fy_label = _financial_year_bounds(today)

        yesterday = today - timedelta(days=1)
        this_month_start = today.replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        if cls.MODULE_AVAILABLE:
            data = cls._get_live_data(
                company, today, yesterday,
                this_month_start, last_month_start, last_month_end,
                fy_start, fy_end
            )
        else:
            data = cls._get_mock_data(today, yesterday, last_month_end, fy_label)

        return data

    @staticmethod
    def _get_mock_data(today, yesterday, last_month_end, fy_label) -> dict:
        return {
            'today': {
                'label': today.strftime('%d-%b'),
                'amount': 0.0,
                'order_count': 0,
            },
            'yesterday': {
                'label': yesterday.strftime('%d-%b'),
                'amount': 12500.0,
                'order_count': 3,
            },
            'this_month': {
                'label': today.strftime('%b'),
                'amount': 0.0,
                'order_count': 0,
            },
            'last_month': {
                'label': last_month_end.strftime('%b'),
                'amount': 142750.0,
                'order_count': 14,
            },
            'financial_year': {
                'label': fy_label,
                'amount': 0.0,
                'order_count': 0,
            },
            'future_orders': {
                'label': 'Pending Orders',
                'amount': 70829.0,
                'order_count': 1,
                'percentage': 90,
            },
            'is_mock': True,
        }

    @staticmethod
    def _get_live_data(company, today, yesterday, this_month_start,
                       last_month_start, last_month_end, fy_start, fy_end) -> dict:
        """
        TODO: Implement once Orders and Invoices apps exist.

        from orders.models import SalesOrder
        from django.db.models import Sum, Count

        def period_sum(start, end):
            qs = SalesOrder.objects.filter(
                company=company, order_date__range=[start, end],
                status__in=['confirmed', 'delivered']
            ).aggregate(total=Sum('grand_total'), count=Count('id'))
            return float(qs['total'] or 0), qs['count'] or 0
        """
        raise NotImplementedError("Orders module not yet available.")
