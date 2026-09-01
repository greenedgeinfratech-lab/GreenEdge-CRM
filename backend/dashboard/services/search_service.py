"""
Search Service
==============
Global search across all available modules.

Searches leads, customers, quotations, orders, invoices, products,
employees, and other modules.
"""

from django.db.models import Q


class SearchService:

    @classmethod
    def search(cls, query: str, company, user, limit: int = 5) -> dict:
        """
        Returns grouped search results.
        Each group has: type, label, url, items[]
        """
        results = {}

        if not query or len(query) < 2:
            return results

        query = query.strip()

        # --- Employees ---
        try:
            from users.models import EmployeeProfile
            employees = EmployeeProfile.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(employee_code__icontains=query)
            )[:limit]

            if employees:
                results['employees'] = {
                    'label': 'Employees',
                    'icon': 'Users',
                    'items': [
                        {
                            'id': str(e.id),
                            'title': f"{e.first_name} {e.last_name}",
                            'subtitle': e.email,
                            'url': f'/settings/employees',
                        }
                        for e in employees
                    ]
                }
        except Exception:
            pass

        # --- CRM Leads ---
        try:
            from crm.models import Lead
            leads = Lead.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(company_name__icontains=query) |
                Q(mobile__icontains=query) |
                Q(email__icontains=query) |
                Q(lead_number__icontains=query)
            )[:limit]

            if leads:
                results['leads'] = {
                    'label': 'Leads',
                    'icon': 'UserPlus',
                    'items': [
                        {
                            'id': str(l.id),
                            'title': l.full_name,
                            'subtitle': l.lead_number or l.mobile or l.email or '',
                            'url': f'/crm/{l.id}',
                        }
                        for l in leads
                    ]
                }
        except Exception:
            pass

        # --- Customers ---
        try:
            from customers.models import Customer
            customers = Customer.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(name__icontains=query) |
                Q(company_name__icontains=query) |
                Q(mobile__icontains=query) |
                Q(email__icontains=query) |
                Q(customer_number__icontains=query)
            )[:limit]

            if customers:
                results['customers'] = {
                    'label': 'Customers',
                    'icon': 'Building2',
                    'items': [
                        {
                            'id': str(c.id),
                            'title': c.name,
                            'subtitle': c.customer_number or c.company_name or '',
                            'url': f'/customers',
                        }
                        for c in customers
                    ]
                }
        except Exception:
            pass

        # --- Quotations ---
        try:
            from crm.models import Quotation
            quotations = Quotation.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(quotation_number__icontains=query) |
                Q(customer_name__icontains=query)
            )[:limit]

            if quotations:
                results['quotations'] = {
                    'label': 'Quotations',
                    'icon': 'FileText',
                    'items': [
                        {
                            'id': str(q.id),
                            'title': q.quotation_number or 'Draft',
                            'subtitle': q.customer_name or '',
                            'url': f'/quotes',
                        }
                        for q in quotations
                    ]
                }
        except Exception:
            pass

        # --- Orders ---
        try:
            from crm.models import Order
            orders = Order.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(order_number__icontains=query) |
                Q(customer_name__icontains=query)
            )[:limit]

            if orders:
                results['orders'] = {
                    'label': 'Orders',
                    'icon': 'ShoppingCart',
                    'items': [
                        {
                            'id': str(o.id),
                            'title': o.order_number or 'Draft',
                            'subtitle': o.customer_name or '',
                            'url': f'/orders',
                        }
                        for o in orders
                    ]
                }
        except Exception:
            pass

        # --- Invoices ---
        try:
            from crm.models import Invoice
            invoices = Invoice.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(invoice_no__icontains=query) |
                Q(customer_name__icontains=query)
            )[:limit]

            if invoices:
                results['invoices'] = {
                    'label': 'Invoices',
                    'icon': 'Receipt',
                    'items': [
                        {
                            'id': str(i.id),
                            'title': i.invoice_no or 'Draft',
                            'subtitle': i.customer_name or '',
                            'url': f'/invoices',
                        }
                        for i in invoices
                    ]
                }
        except Exception:
            pass

        # --- Products ---
        try:
            from crm.models import ProductCatalog
            products = ProductCatalog.objects.filter(
                company=company, is_active=True
            ).filter(
                Q(name__icontains=query) |
                Q(code__icontains=query) |
                Q(hsn_sac__icontains=query)
            )[:limit]

            if products:
                results['products'] = {
                    'label': 'Products',
                    'icon': 'Package',
                    'items': [
                        {
                            'id': str(p.id),
                            'title': p.name,
                            'subtitle': p.code or '',
                            'url': f'/inventory',
                        }
                        for p in products
                    ]
                }
        except Exception:
            pass

        return results
