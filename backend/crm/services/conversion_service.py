"""
Conversion Service
==================
Converts a CRM lead to a Customer (when the Customer module exists).

Current behaviour:
- Marks the lead as Converted (status + timestamp)
- Records Timeline + ActivityLog + AuditLog
- Prepares a conversion payload for future Customer module

When the Customer module is built:
  1. Import the Customer model here
  2. Implement _create_customer()
  3. Store the returned customer_id on the Lead
"""

from django.db import transaction
from django.utils import timezone
from common.models import ActivityLog, AuditLog
from crm.services.timeline_service import TimelineService


class ConversionService:

    @classmethod
    @transaction.atomic
    def convert(cls, lead, user) -> dict:
        """
        Convert a lead to a customer.

        Returns conversion result dict.
        """
        if lead.status == 'converted':
            return {'success': False, 'message': 'Lead is already converted.'}

        old_status = lead.status

        # ── Mark converted ──────────────────────────────────────────────────
        lead.status = 'converted'
        lead.converted_at = timezone.now()
        lead.updated_by = user
        lead.save(update_fields=['status', 'converted_at', 'updated_at', 'updated_by'])

        # ── Prepare customer payload (for future module) ─────────────────────
        customer_payload = {
            'name': lead.full_name,
            'company_name': lead.company_name,
            'mobile': lead.mobile,
            'email': lead.email,
            'city': lead.city,
            'state': lead.state,
            'address': lead.address,
        }

        # ── Try to create customer if module exists ──────────────────────────
        customer_id = None
        try:
            from customers.models import Customer
            from customers.services import CustomerService
            customer = CustomerService.create_from_lead(lead, user)
            customer_id = customer.id
        except ImportError:
            pass  # Customer module not yet built — no-op

        # ── Records ──────────────────────────────────────────────────────────
        TimelineService.lead_converted(lead, user, customer_id=customer_id)

        ActivityLog.objects.create(
            company=lead.company,
            user=user,
            activity_type='lead_converted',
            description=f"Lead {lead.lead_number} ({lead.full_name}) converted to customer",
            related_model='Lead',
            related_object_id=lead.id,
        )

        AuditLog.objects.create(
            company=lead.company,
            user=user,
            action='UPDATE',
            model_name='Lead',
            object_id=lead.id,
            changes={
                'status': {'old': old_status, 'new': 'converted'},
                'converted_at': {'old': None, 'new': str(lead.converted_at)},
            },
        )

        return {
            'success': True,
            'message': 'Lead converted successfully.',
            'customer_id': str(customer_id) if customer_id else None,
            'customer_payload': customer_payload,
        }
