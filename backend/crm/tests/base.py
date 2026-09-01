"""
Shared test fixtures for CRM app tests.
Creates Company, User, AccountGroup, Ledgers, and authenticates via JWT.
"""
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User, Company
from crm.models import AccountGroup, Ledger, Invoice, InvoiceItem, Quotation, QuotationItem


class BaseCRMTestCase(TestCase):
    """Base test case with authenticated API client and common fixtures."""

    def setUp(self):
        # Company
        self.company = Company.objects.create(
            name="Test QA Company",
            tax_id="09AAGCG2802H1ZS",
            currency="INR",
        )

        # User (staff/superuser to bypass RBAC permissions in tests)
        self.user = User.objects.create_superuser(
            email="tester@greenedge.local",
            password="testpass123",
            company=self.company,
            first_name="Test",
            last_name="QA",
        )

        # API Client with JWT auth
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        # Account Groups
        self.income_group = AccountGroup.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            name="Income", sequence=1,
        )
        self.expense_group = AccountGroup.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            name="Expense", sequence=2,
        )
        self.asset_group = AccountGroup.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            name="Assets", sequence=3,
        )

        # Ledgers
        self.sales_ledger = Ledger.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            group=self.income_group, name="Sales Account", code="S001",
            opening_balance=0, balance_side="Cr",
        )
        self.cash_ledger = Ledger.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            group=self.asset_group, name="Cash in Hand", code="C001",
            opening_balance=10000, balance_side="Dr",
        )
        self.bank_ledger = Ledger.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            group=self.asset_group, name="Bank Account", code="B001",
            opening_balance=50000, balance_side="Dr",
        )
        self.purchase_ledger = Ledger.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            group=self.expense_group, name="Purchase Account", code="P001",
            opening_balance=0, balance_side="Dr",
        )

    def create_invoice(self, **kwargs):
        """Helper to create a test invoice with items."""
        defaults = {
            "company": self.company,
            "created_by": self.user,
            "updated_by": self.user,
            "type": "B2B Invoice",
            "customer_name": "Test Customer",
            "invoice_no": "INV-TEST-001",
            "invoice_date": "2026-09-01",
            "grand_total": 10000,
            "invoice_status": "Unpaid",
        }
        defaults.update(kwargs)
        invoice = Invoice.objects.create(**defaults)
        InvoiceItem.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            invoice=invoice, item_description="Test Item", qty=1, rate=10000,
            taxable=10000, cgst_percent=9, sgst_percent=9,
            cgst_amt=900, sgst_amt=900, amt=11800,
        )
        return invoice

    def create_quotation(self, **kwargs):
        """Helper to create a test quotation with items."""
        defaults = {
            "company": self.company,
            "created_by": self.user,
            "updated_by": self.user,
            "customer_name": "Test Customer",
            "quote_number": "QTN-TEST-001",
            "quote_date": "2026-09-01",
            "grand_total": 5000,
            "status": "Pending",
            "type": "Quotation",
        }
        defaults.update(kwargs)
        quotation = Quotation.objects.create(**defaults)
        QuotationItem.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            quotation=quotation, item_description="Test Service", qty=1, rate=5000,
            taxable=5000, cgst_percent=9, sgst_percent=9,
            cgst_amt=450, sgst_amt=450, amt=5900,
        )
        return quotation
