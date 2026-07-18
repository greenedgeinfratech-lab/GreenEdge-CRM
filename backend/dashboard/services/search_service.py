"""
Search Service
==============
Global search across available modules.

Searches available models now, extends to CRM/Orders/etc.
when those apps are built — just add more search blocks.
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
                            'url': f'/settings/employees/{e.id}',
                        }
                        for e in employees
                    ]
                }
        except Exception:
            pass

        # --- CRM Leads (future) ---
        # try:
        #     from crm.models import Lead
        #     leads = Lead.objects.filter(company=company).filter(
        #         Q(name__icontains=query) | Q(email__icontains=query)
        #     )[:limit]
        #     results['leads'] = {...}
        # except Exception:
        #     pass

        # --- Customers (future) ---
        # --- Quotations (future) ---
        # --- Orders (future) ---
        # --- Invoices (future) ---
        # --- Products / Inventory (future) ---

        return results
