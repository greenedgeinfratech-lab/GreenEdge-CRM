"""
CRM URL Configuration
======================
All endpoints are under /api/v1/crm/

Lead endpoints:
  GET/POST       /leads/
  GET/PATCH/DEL  /leads/{id}/
  POST           /leads/{id}/stage/
  POST           /leads/{id}/assign/
  POST           /leads/{id}/star/
  POST           /leads/{id}/convert/
  POST           /leads/check-duplicate/
  POST           /leads/bulk/
  GET            /leads/export/
  POST           /leads/import/

Nested endpoints (under /leads/{lead_pk}/):
  GET/POST       followups/
  POST           followups/{id}/complete/
  GET/POST       appointments/
  GET/POST       notes/
  GET/POST/DEL   attachments/
  GET            timeline/
  GET            assignment-history/

Configuration endpoints:
  GET/POST/PATCH /stages/
  POST           /stages/reorder/
  POST           /stages/seed-defaults/
  GET/POST/PATCH /sources/
  GET/POST/PATCH /tags/
  GET/POST/PATCH /lost-reasons/

Analytics:
  GET            /analytics/
  GET            /dashboard/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from crm.views import (
    LeadViewSet,
    LeadStageViewSet, LeadSourceViewSet, LeadTagViewSet, LostReasonViewSet,
    LeadFollowupViewSet, AppointmentViewSet,
    LeadNoteViewSet, LeadAttachmentViewSet,
    LeadTimelineView, LeadAssignmentHistoryView,
    CRMAnalyticsView, CRMDashboardSummaryView, RawLeadsDashboardView,
    ReminderViewSet, QuotationViewSet, OrderViewSet, InvoiceViewSet, DebitNoteViewSet, ProductCatalogViewSet,
    PurchaseOrderViewSet,
    AccountGroupViewSet, LedgerViewSet,
    TransactionViewSet, InvoicePaymentViewSet,
)

# ── Root Router ───────────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r'leads',        LeadViewSet,         basename='leads')
router.register(r'stages',       LeadStageViewSet,    basename='lead-stages')
router.register(r'sources',      LeadSourceViewSet,   basename='lead-sources')
router.register(r'tags',         LeadTagViewSet,      basename='lead-tags')
router.register(r'lost-reasons', LostReasonViewSet,   basename='lost-reasons')
router.register(r'quotations',   QuotationViewSet,    basename='quotations')
router.register(r'orders',       OrderViewSet,        basename='orders')
router.register(r'invoices',     InvoiceViewSet,      basename='invoices')
router.register(r'debit-notes',  DebitNoteViewSet,    basename='debit-notes')
router.register(r'products',     ProductCatalogViewSet, basename='products')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-orders')
router.register(r'account-groups', AccountGroupViewSet, basename='account-groups')
router.register(r'ledgers', LedgerViewSet, basename='ledgers')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'invoice-payments', InvoicePaymentViewSet, basename='invoice-payments')


# ── Nested Router under /leads/{lead_pk}/ ─────────────────────────────────────
leads_router = NestedDefaultRouter(router, r'leads', lookup='lead')
leads_router.register(r'followups',    LeadFollowupViewSet,  basename='lead-followups')
leads_router.register(r'appointments', AppointmentViewSet,   basename='lead-appointments')
leads_router.register(r'notes',        LeadNoteViewSet,      basename='lead-notes')
leads_router.register(r'attachments',  LeadAttachmentViewSet, basename='lead-attachments')
leads_router.register(r'reminders',    ReminderViewSet,       basename='lead-reminders')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(leads_router.urls)),

    # Non-viewset routes
    path('leads/<uuid:lead_pk>/timeline/',           LeadTimelineView.as_view(),          name='lead-timeline'),
    path('leads/<uuid:lead_pk>/assignment-history/', LeadAssignmentHistoryView.as_view(),  name='lead-assignment-history'),

    # Analytics
    path('analytics/',  CRMAnalyticsView.as_view(),        name='crm-analytics'),
    path('dashboard/',  CRMDashboardSummaryView.as_view(),  name='crm-dashboard-summary'),
    path('raw-dashboard/', RawLeadsDashboardView.as_view(), name='crm-raw-dashboard'),
]
