"""
Recovery Service
================
Returns outstanding account recovery data for the dashboard.

Mock-first: flip MODULE_AVAILABLE = True and implement _get_live_data()
when the Recovery app is available.
"""


class RecoveryService:
    MODULE_AVAILABLE = False

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
        """
        TODO: Implement once Recovery app is available.

        from recovery.models import RecoveryRecord
        from django.db.models import Sum, Count

        qs = RecoveryRecord.objects.filter(company=company, status='outstanding')
        ...
        """
        raise NotImplementedError("Recovery module not yet available.")


class ActionAreasService:
    """
    Aggregates all action-required counts across modules.
    Each module flag controls whether live or mock data is used.
    """
    ORDERS_AVAILABLE = False
    QUOTES_AVAILABLE = False
    INVENTORY_AVAILABLE = False
    PURCHASES_AVAILABLE = False
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
            pass  # TODO: query orders
        return {'amount': 70829.0, 'count': 1, 'url': '/orders', 'is_mock': True}

    @classmethod
    def _pending_quotations(cls, company) -> dict:
        if cls.QUOTES_AVAILABLE:
            pass  # TODO: query quotes
        return {'count': 3, 'url': '/quotes', 'is_mock': True}

    @classmethod
    def _under_stock(cls, company) -> dict:
        if cls.INVENTORY_AVAILABLE:
            pass  # TODO: query inventory
        return {'count': 2, 'url': '/inventory?filter=low-stock', 'is_mock': True}

    @classmethod
    def _open_purchase_orders(cls, company) -> dict:
        if cls.PURCHASES_AVAILABLE:
            pass  # TODO: query purchase orders
        return {'count': 1, 'url': '/purch-orders', 'is_mock': True}

    @classmethod
    def _open_support_tickets(cls, company) -> dict:
        if cls.SUPPORT_AVAILABLE:
            pass  # TODO: query support
        return {'count': 0, 'url': '/support', 'is_mock': True}
