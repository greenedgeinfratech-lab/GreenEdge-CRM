"""
Duplicate Detection Service
============================
Before creating a lead, checks for potential duplicates within the same tenant.

Checks (in priority order):
  1. Mobile (exact match)
  2. Alternate mobile
  3. Email (case-insensitive)
  4. Company name (fuzzy match)

Returns a structured result — callers decide whether to reject or override.
"""

from django.db.models import Q


class DuplicateService:

    @staticmethod
    def check(company, data: dict) -> dict:
        """
        Returns:
        {
            'has_duplicate': bool,
            'message': str,
            'lead_id': UUID | None,
            'match_type': 'mobile' | 'email' | 'company_name' | None,
        }
        """
        from crm.models import Lead

        mobile = data.get('mobile', '').strip()
        email = (data.get('email') or '').strip().lower()
        company_name = (data.get('company_name') or '').strip()

        # 1. Mobile exact match
        if mobile:
            existing = Lead.objects.filter(
                company=company,
                is_active=True,
                is_duplicate=False,
            ).filter(
                Q(mobile=mobile) | Q(alternate_mobile=mobile)
            ).first()

            if existing:
                return {
                    'has_duplicate': True,
                    'message': f"A lead with mobile {mobile} already exists: {existing.lead_number} ({existing.full_name})",
                    'lead_id': existing.id,
                    'match_type': 'mobile',
                }

        # 2. Email match
        if email:
            existing = Lead.objects.filter(
                company=company,
                is_active=True,
                is_duplicate=False,
                email__iexact=email,
            ).first()

            if existing:
                return {
                    'has_duplicate': True,
                    'message': f"A lead with email {email} already exists: {existing.lead_number} ({existing.full_name})",
                    'lead_id': existing.id,
                    'match_type': 'email',
                }

        # 3. Company name fuzzy match (only if no mobile/email match)
        if company_name:
            existing = Lead.objects.filter(
                company=company,
                is_active=True,
                is_duplicate=False,
                company_name__iexact=company_name,
            ).first()

            if existing:
                return {
                    'has_duplicate': True,
                    'message': f"A lead with company name '{company_name}' already exists: {existing.lead_number}",
                    'lead_id': existing.id,
                    'match_type': 'company_name',
                }

        return {
            'has_duplicate': False,
            'message': None,
            'lead_id': None,
            'match_type': None,
        }
