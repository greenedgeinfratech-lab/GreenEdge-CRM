"""
CRM Models Package
==================
Organized into four logical groups:

  stage.py    — Pipeline configuration (LeadStage, LeadSource, LeadTag, LostReason)
  lead.py     — Core lead entity (Lead, LeadProduct)
  activity.py — All activity models (LeadFollowup, Appointment, LeadNote,
                LeadAttachment, LeadAssignmentHistory, LeadTimeline)
  reminder.py — Dedicated Reminder engine

All models extend TenantBaseModel for automatic multi-tenant isolation.
"""

from .stage import LeadStage, LeadSource, LeadTag, LostReason
from .lead import Lead, LeadProduct
from .activity import (
    LeadFollowup,
    Appointment,
    LeadNote,
    LeadAttachment,
    LeadAssignmentHistory,
    LeadTimeline,
)
from .reminder import Reminder
from .quotation import Quotation, QuotationItem
from .order import Order, OrderItem

__all__ = [
    'LeadStage',
    'LeadSource',
    'LeadTag',
    'LostReason',
    'Lead',
    'LeadProduct',
    'LeadFollowup',
    'Appointment',
    'LeadNote',
    'LeadAttachment',
    'LeadAssignmentHistory',
    'LeadTimeline',
    'Reminder',
    'Quotation',
    'QuotationItem',
    'Order',
    'OrderItem',
]


