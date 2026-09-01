"""
Customer Service
================
Business logic for customer operations.
Includes the create_from_lead method expected by ConversionService.
"""

from django.db import transaction
from common.services import NumberingService


class CustomerService:

    @classmethod
    @transaction.atomic
    def create_from_lead(cls, lead, user):
        """
        Create a Customer record from a converted Lead.
        Called by crm.services.conversion_service.ConversionService.convert().
        """
        from customers.models import Customer

        customer = Customer.objects.create(
            company=lead.company,
            created_by=user,
            updated_by=user,
            name=lead.full_name,
            company_name=lead.company_name,
            mobile=lead.mobile,
            alternate_mobile=lead.alternate_mobile,
            email=lead.email,
            secondary_email=lead.secondary_email,
            phone=lead.alternate_contact,
            website=lead.website,
            gst_number=lead.gst_number,
            pan_number=lead.pan_number,
            address=lead.address,
            city=lead.city,
            state=lead.state,
            country=lead.country,
            pincode=lead.pincode,
            assigned_to=lead.assigned_to,
            converted_from_lead=lead,
            source=str(lead.source) if lead.source else None,
            notes=f"Converted from lead {lead.lead_number}" if lead.lead_number else None,
        )

        # Generate customer number
        customer.customer_number = NumberingService.generate_number(
            company=lead.company,
            entity_name='Customer',
            prefix='CUST',
        )
        customer.save(update_fields=['customer_number'])

        return customer
