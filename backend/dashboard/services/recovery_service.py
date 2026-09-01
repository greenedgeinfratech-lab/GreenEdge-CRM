"""
Recovery Service
===============
Returns outstanding account recovery data for the dashboard.

Live implementation queries Invoice and Order models from the CRM app.
"""


class RecoveryService:
    MODULE_AVAILABLE = True

    @classmethod
    def get_recovery_summary(cls, company) -> dict:
        if cls.MODULE_AVAILABLE:
            return cls._get_live_data(company)
        return cls._get_mock_data()

    @staticmethod
    def _get_mock_data() -> dict:
        return {
            'outstanding_amount': 814578.0,
            'outstanding_count': 5,
            'overdue_amount': 245000.0,
            'overdue_count': 2,
            'collected_this_month': 85000.0,
            'is_mock': True,
        }

    @staticmethod
    def _get_live_data(company) -> dict:
        from crm.models import Invoice, Order
        from django.db.models import Sum, Count
        from django.utils import timezone

        today = timezone.localdate()
        month_start = today.replace(day=1)

        # Outstanding invoices (unpaid)
        unpaid_invoices = Invoice.objects.filter(
            company=company, is_active=True,
            invoice_status__in=['Unpaid', 'Partially Paid', 'Overdue'],
        )
        outstanding_agg = unpaid_invoices.aggregate(
            total=Sum('grand_total'),
            count=Count('id'),
        )

        # Overdue invoices
        overdue_invoices = unpaid_invoices.filter(invoice_status='Overdue')
        overdue_agg = overdue_invoices.aggregate(
            total=Sum('grand_total'),
            count=Count('id'),
        )

        # Collected this month (paid invoices created this month)
        collected = Invoice.objects.filter(
            company=company, is_active=True,
            invoice_status='Paid',
            created_at__date__gte=month_start,
        ).aggregate(total=Sum('grand_total'))

        return {
            'outstanding_amount': float(outstanding_agg['total'] or 0),
            'outstanding_count': outstanding_agg['count'] or 0,
            'overdue_amount': float(overdue_agg['total'] or 0),
            'overdue_count': overdue_agg['count'] or 0,
            'collected_this_month': float(collected['total'] or 0),
            'is_mock': False,
        }


class ActionAreasService:
    """
    Aggregates all action-required counts across modules.
    Each module flag controls whether live or mock data is used.
    """
    ORDERS_AVAILABLE = True
    QUOTES_AVAILABLE = True
    INVENTORY_AVAILABLE = True
    PURCHASES_AVAILABLE = True
    SUPPORT_AVAILABLE = False

    @classmethod
    def get_action_areas(cls, company) -> dict:
        recovery = RecoveryService.get_recovery_summary(company)
        return {
            'open_orders': cls._open_orders(company),
            'pending_quotations': cls._pending_quotations(company),
            'outstanding_recovery': {
                'amount': recovery['outstanding_amount'],
                'count': recovery['outstanding_count'],
                'url': '/recovery',
            },
            'under_stock_products': cls._under_stock(company),
            'open_purchase_orders': cls._open_purchase_orders(company),
            'open_support_tickets': cls._open_support_tickets(company),
        }

    @classmethod
    def _open_orders(cls, company) -> dict:
        if cls.ORDERS_AVAILABLE:
            from crm.models import Order
            from django.db.models import Sum
            qs = Order.objects.filter(
                company=company, is_active=True,
            ).exclude(status__in=['Delivered', 'Cancelled', 'delivered', 'cancelled'])
            agg = qs.aggregate(total=Sum('grand_total'))
            return {
                'amount': float(agg['total'] or 0),
                'count': qs.count(),
                'url': '/orders',
                'is_mock': False,
            }
        return {'amount': 70829.0, 'count': 1, 'url': '/orders', 'is_mock': True}

    @classmethod
    def _pending_quotations(cls, company) -> dict:
        if cls.QUOTES_AVAILABLE:
            from crm.models import Quotation
            qs = Quotation.objects.filter(
                company=company, is_active=True,
            ).exclude(status__in=['Accepted', 'Rejected', 'Cancelled', 'accepted', 'rejected', 'cancelled'])
            return {
                'count': qs.count(),
                'url': '/quotes',
                'is_mock': False,
            }
        return {'count': 3, 'url': '/quotes', 'is_mock': True}

    @classmethod
    def _under_stock(cls, company) -> dict:
        if cls.INVENTORY_AVAILABLE:
            from crm.models import ProductCatalog
            qs = ProductCatalog.objects.filter(
                company=company, is_active=True,
                item_type='Stock',
                stock_qty__lte=10,
            )
            return {
                'count': qs.count(),
                'url': '/inventory?filter=low-stock',
                'is_mock': False,
            }
        return {'count': 2, 'url': '/inventory?filter=low-stock', 'is_mock': True}

    @classmethod
    def _open_purchase_orders(cls, company) -> dict:
        if cls.PURCHASES_AVAILABLE:
            from crm.models import PurchaseOrder
            qs = PurchaseOrder.objects.filter(
                company=company, is_active=True,
            ).exclude(status__in=['received', 'cancelled'])
            return {
                'count': qs.count(),
                'url': '/purch-orders',
                'is_mock': False,
            }
        return {'count': 1, 'url': '/purch-orders', 'is_mock': True}

    @classmethod
    def _open_support_tickets(cls, company) -> dict:
        if cls.SUPPORT_AVAILABLE:
            pass  # TODO: query support tickets when module exists
        return {'count': 0, 'url': '/support', 'is_mock': True}
