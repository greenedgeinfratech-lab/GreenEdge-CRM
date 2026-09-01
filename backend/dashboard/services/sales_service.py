"""
Sales Overview Service
======================
Returns sales summary figures for the dashboard widget.

Live implementation queries Order and Invoice models from the CRM app.
"""

from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Count
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
    MODULE_AVAILABLE = True

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
        from crm.models import Order, Invoice

        def order_sum(start, end):
            qs = Order.objects.filter(
                company=company,
                created_at__date__range=[start, end],
                is_active=True,
            ).aggregate(total=Sum('grand_total'), count=Count('id'))
            return float(qs['total'] or 0), qs['count'] or 0

        def invoice_sum(start, end):
            qs = Invoice.objects.filter(
                company=company,
                created_at__date__range=[start, end],
                is_active=True,
            ).aggregate(total=Sum('grand_total'), count=Count('id'))
            return float(qs['total'] or 0), qs['count'] or 0

        # Today
        today_amount, today_count = order_sum(today, today)
        today_inv_amount, today_inv_count = invoice_sum(today, today)

        # Yesterday
        yesterday_amount, yesterday_count = order_sum(yesterday, yesterday)
        yesterday_inv_amount, yesterday_inv_count = invoice_sum(yesterday, yesterday)

        # This month
        this_month_amount, this_month_count = order_sum(this_month_start, today)
        this_month_inv_amount, this_month_inv_count = invoice_sum(this_month_start, today)

        # Last month
        last_month_amount, last_month_count = order_sum(last_month_start, last_month_end)
        last_month_inv_amount, last_month_inv_count = invoice_sum(last_month_start, last_month_end)

        # Financial year
        fy_amount, fy_count = order_sum(fy_start, fy_end)
        fy_inv_amount, fy_inv_count = invoice_sum(fy_start, fy_end)

        # Pending orders (confirmed but not delivered)
        pending_qs = Order.objects.filter(
            company=company, is_active=True,
        ).exclude(status__in=['Delivered', 'Cancelled', 'delivered', 'cancelled'])
        pending_amount = float(pending_qs.aggregate(total=Sum('grand_total'))['total'] or 0)
        pending_count = pending_qs.count()

        return {
            'today': {
                'label': today.strftime('%d-%b'),
                'amount': today_amount + today_inv_amount,
                'order_count': today_count + today_inv_count,
            },
            'yesterday': {
                'label': yesterday.strftime('%d-%b'),
                'amount': yesterday_amount + yesterday_inv_amount,
                'order_count': yesterday_count + yesterday_inv_count,
            },
            'this_month': {
                'label': today.strftime('%b'),
                'amount': this_month_amount + this_month_inv_amount,
                'order_count': this_month_count + this_month_inv_count,
            },
            'last_month': {
                'label': last_month_end.strftime('%b'),
                'amount': last_month_amount + last_month_inv_amount,
                'order_count': last_month_count + last_month_inv_count,
            },
            'financial_year': {
                'label': f"{fy_start.year}-{str(fy_end.year)[2:]}",
                'amount': fy_amount + fy_inv_amount,
                'order_count': fy_count + fy_inv_count,
            },
            'future_orders': {
                'label': 'Pending Orders',
                'amount': pending_amount,
                'order_count': pending_count,
                'percentage': 0,
            },
            'is_mock': False,
        }
