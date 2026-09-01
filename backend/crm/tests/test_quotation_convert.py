"""
Tests for Quotation → Invoice conversion endpoint.
POST /api/v1/crm/quotations/{id}/convert-to-invoice/
"""
from django.urls import reverse
from crm.models import Quotation, Invoice, InvoiceItem
from crm.tests.base import BaseCRMTestCase


class QuotationConvertTests(BaseCRMTestCase):
    """Test suite for Quotation to Invoice conversion."""

    def setUp(self):
        super().setUp()
        self.quotation = self.create_quotation(
            grand_total=5900, status="Accepted",
            customer_name="Convert Test Customer",
            quote_number="QTN-CONV-001",
        )

    def test_convert_to_invoice_success(self):
        """POST convert-to-invoice creates an invoice from quotation."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        res = self.client.post(url, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertIn('invoice_id', data)
        self.assertIn('invoice_no', data)
        self.assertIn('successfully', data['detail'].lower())

    def test_convert_copies_customer_name(self):
        """Converted invoice has same customer_name as quotation."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.customer_name, "Convert Test Customer")

    def test_convert_copies_financial_totals(self):
        """Converted invoice copies grand_total and tax breakdown."""
        # Set totals on the quotation before converting
        self.quotation.total_taxable = 5000
        self.quotation.total_cgst = 450
        self.quotation.total_sgst = 450
        self.quotation.save()
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(float(invoice.grand_total), 5900)
        self.assertEqual(float(invoice.total_taxable), 5000)
        self.assertEqual(float(invoice.total_cgst), 450)
        self.assertEqual(float(invoice.total_sgst), 450)

    def test_convert_copies_line_items(self):
        """Converted invoice has same line items as quotation."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        items = invoice.items.all()
        self.assertEqual(items.count(), 1)
        item = items.first()
        self.assertEqual(item.item_description, "Test Service")
        self.assertEqual(item.qty, 1)
        self.assertEqual(float(item.rate), 5000)
        self.assertEqual(float(item.amt), 5900)

    def test_convert_marks_quotation_as_converted(self):
        """Quotation status is set to 'Converted' after conversion."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        self.quotation.refresh_from_db()
        self.assertEqual(self.quotation.status, "Converted")

    def test_convert_prevents_double_conversion(self):
        """Converting an already-converted quotation returns 400."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        res = self.client.post(url, format='json')
        self.assertEqual(res.status_code, 400)

    def test_convert_sets_invoice_type_b2b(self):
        """Converted invoice has type='B2B Invoice'."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.type, "B2B Invoice")

    def test_convert_sets_invoice_status_unpaid(self):
        """Converted invoice has invoice_status='Unpaid'."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.invoice_status, "Unpaid")

    def test_convert_copies_billing_address(self):
        """Converted invoice has same billing address."""
        self.quotation.address = "123 Test Street, Aligarh"
        self.quotation.save()
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.billing_address, "123 Test Street, Aligarh")

    def test_convert_copies_notes_and_bank_details(self):
        """Converted invoice copies notes and bank_details."""
        self.quotation.notes = "Test notes"
        self.quotation.bank_details = "SBI 12345"
        self.quotation.save()
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.notes, "Test notes")
        self.assertEqual(invoice.bank_details, "SBI 12345")

    def test_convert_scoped_to_company(self):
        """Cannot convert quotation from another company."""
        from users.models import Company
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_company = Company.objects.create(name="Other Co")
        other_user = User.objects.create_user(email="x@y.com", password="pass", company=other_company)
        other_quotation = Quotation.objects.create(
            company=other_company, created_by=other_user, updated_by=other_user,
            customer_name="Other", grand_total=1000,
        )
        url = f'/api/v1/crm/quotations/{other_quotation.id}/convert-to-invoice/'
        res = self.client.post(url, format='json')
        self.assertIn(res.status_code, [403, 404])

    def test_convert_unauthenticated_denied(self):
        """Unauthenticated request returns 401."""
        from rest_framework.test import APIClient
        unauth = APIClient()
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        res = unauth.post(url, format='json')
        self.assertIn(res.status_code, [401, 403])

    def test_convert_invoice_date_is_today(self):
        """Converted invoice has today's date."""
        from django.utils import timezone
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.invoice_date, timezone.now().date())

    def test_convert_preserves_quotation_reference(self):
        """Converted invoice stores quote_number as reference."""
        url = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        self.client.post(url, format='json')
        invoice = Invoice.objects.latest('created_at')
        self.assertEqual(invoice.reference, "QTN-CONV-001")

    def test_convert_multiple_quotations(self):
        """Multiple quotations can be converted independently."""
        q2 = self.create_quotation(
            grand_total=3000, status="Pending", quote_number="QTN-002",
        )
        url1 = f'/api/v1/crm/quotations/{self.quotation.id}/convert-to-invoice/'
        url2 = f'/api/v1/crm/quotations/{q2.id}/convert-to-invoice/'
        self.client.post(url1, format='json')
        self.client.post(url2, format='json')
        self.assertEqual(Invoice.objects.count(), 2)
        self.assertEqual(Quotation.objects.filter(status="Converted").count(), 2)
