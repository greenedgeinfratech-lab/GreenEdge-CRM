"""
Tests for Invoice Payments API.
Endpoints: GET/POST /api/v1/crm/invoice-payments/, DELETE /api/v1/crm/invoice-payments/{id}/
Tests auto-update of invoice recovery_amt and invoice_status.
"""
from django.urls import reverse
from crm.models import InvoicePayment
from crm.tests.base import BaseCRMTestCase


class InvoicePaymentAPITests(BaseCRMTestCase):
    """Test suite for Invoice Payment CRUD and auto-recovery updates."""

    def setUp(self):
        super().setUp()
        self.list_url = reverse('invoice-payments-list')
        self.invoice = self.create_invoice(grand_total=10000, invoice_status="Unpaid")

    # ── CREATE ──────────────────────────────────────────────────

    def test_create_payment_success(self):
        """POST /invoice-payments/ creates a payment and updates invoice."""
        payload = {
            "invoice": str(self.invoice.id),
            "amount": "5000.00",
            "payment_date": "2026-09-01",
            "method": "Cash",
            "notes": "Partial payment",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertEqual(float(data['amount']), 5000.00)
        self.assertEqual(data['method'], "Cash")

        # Invoice should auto-update
        self.invoice.refresh_from_db()
        self.assertEqual(float(self.invoice.recovery_amt), 5000.00)
        self.assertEqual(self.invoice.invoice_status, "Partial")

    def test_create_payment_full_amount(self):
        """Full payment marks invoice as Paid."""
        payload = {
            "invoice": str(self.invoice.id),
            "amount": "10000.00",
            "payment_date": "2026-09-01",
            "method": "Bank Transfer",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.invoice_status, "Paid")
        self.assertEqual(float(self.invoice.recovery_amt), 10000.00)

    def test_create_payment_overpay(self):
        """Overpayment marks invoice as Paid (amount > grand_total)."""
        payload = {
            "invoice": str(self.invoice.id),
            "amount": "12000.00",
            "payment_date": "2026-09-01",
            "method": "UPI",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.invoice_status, "Paid")

    def test_create_multiple_partial_payments(self):
        """Two partial payments accumulate correctly."""
        self.client.post(self.list_url, {
            "invoice": str(self.invoice.id),
            "amount": "3000.00",
            "payment_date": "2026-09-01",
            "method": "Cash",
        }, format='json')
        self.client.post(self.list_url, {
            "invoice": str(self.invoice.id),
            "amount": "4000.00",
            "payment_date": "2026-09-05",
            "method": "UPI",
        }, format='json')
        self.invoice.refresh_from_db()
        self.assertEqual(float(self.invoice.recovery_amt), 7000.00)
        self.assertEqual(self.invoice.invoice_status, "Partial")

    def test_create_payment_all_methods(self):
        """Each payment method is accepted."""
        for method in ["Cash", "Bank Transfer", "UPI", "Cheque", "NEFT", "RTGS", "Other"]:
            InvoicePayment.objects.create(
                company=self.company, created_by=self.user, updated_by=self.user,
                invoice=self.invoice, amount=100, payment_date="2026-09-01", method=method,
            )
        res = self.client.get(self.list_url, {"invoice": str(self.invoice.id)})
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 7)

    def test_create_payment_missing_required_field(self):
        """POST without required fields returns 400."""
        payload = {"invoice": str(self.invoice.id)}
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 400)

    # ── READ ────────────────────────────────────────────────────

    def test_list_payments_empty(self):
        """No payments returns empty list."""
        res = self.client.get(self.list_url, {"invoice": str(self.invoice.id)})
        self.assertEqual(res.status_code, 200)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 0)

    def test_list_payments_filtered_by_invoice(self):
        """Filter payments by invoice ID."""
        inv2 = self.create_invoice(grand_total=5000)
        self.client.post(self.list_url, {
            "invoice": str(self.invoice.id), "amount": "1000", "payment_date": "2026-09-01",
        }, format='json')
        self.client.post(self.list_url, {
            "invoice": str(inv2.id), "amount": "2000", "payment_date": "2026-09-01",
        }, format='json')
        res = self.client.get(self.list_url, {"invoice": str(self.invoice.id)})
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)

    def test_list_payments_includes_invoice_no(self):
        """Payment response includes invoice_no from the related invoice."""
        self.client.post(self.list_url, {
            "invoice": str(self.invoice.id), "amount": "1000", "payment_date": "2026-09-01",
        }, format='json')
        res = self.client.get(self.list_url, {"invoice": str(self.invoice.id)})
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(results[0]['invoice_no'], "INV-TEST-001")

    def test_list_payments_scoped_to_company(self):
        """Payments from other companies are not visible."""
        from users.models import Company
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_company = Company.objects.create(name="Other Co")
        other_user = User.objects.create_user(email="x@y.com", password="pass", company=other_company)
        inv2 = self.create_invoice(grand_total=5000)
        InvoicePayment.objects.create(
            company=other_company, created_by=other_user, updated_by=other_user,
            invoice=inv2, amount=999, payment_date="2026-09-01",
        )
        res = self.client.get(self.list_url)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        amounts = [float(p['amount']) for p in results]
        self.assertNotIn(999.0, amounts)

    # ── UPDATE ──────────────────────────────────────────────────

    def test_update_payment_updates_invoice_recovery(self):
        """Updating a payment amount recalculates invoice recovery_amt."""
        create_res = self.client.post(self.list_url, {
            "invoice": str(self.invoice.id),
            "amount": "3000.00",
            "payment_date": "2026-09-01",
            "method": "Cash",
        }, format='json')
        data = create_res.data.get('data', create_res.data)
        payment_id = data['id']
        self.client.patch(
            f'/api/v1/crm/invoice-payments/{payment_id}/',
            {"amount": "8000.00"},
            format='json',
        )
        self.invoice.refresh_from_db()
        self.assertEqual(float(self.invoice.recovery_amt), 8000.00)
        self.assertEqual(self.invoice.invoice_status, "Partial")

    # ── DELETE ──────────────────────────────────────────────────

    def test_delete_payment_updates_invoice_recovery(self):
        """Deleting a payment recalculates invoice recovery_amt."""
        create_res = self.client.post(self.list_url, {
            "invoice": str(self.invoice.id),
            "amount": "5000.00",
            "payment_date": "2026-09-01",
            "method": "Cash",
        }, format='json')
        data = create_res.data.get('data', create_res.data)
        payment_id = data['id']
        self.invoice.refresh_from_db()
        self.assertEqual(float(self.invoice.recovery_amt), 5000.00)

        res = self.client.delete(f'/api/v1/crm/invoice-payments/{payment_id}/')
        self.assertEqual(res.status_code, 204)
        self.invoice.refresh_from_db()
        self.assertEqual(float(self.invoice.recovery_amt), 0)
        self.assertEqual(self.invoice.invoice_status, "Unpaid")

    def test_delete_last_payment_restores_unpaid(self):
        """After deleting the only payment, invoice status reverts to Unpaid."""
        create_res = self.client.post(self.list_url, {
            "invoice": str(self.invoice.id),
            "amount": "10000.00",
            "payment_date": "2026-09-01",
            "method": "Bank Transfer",
        }, format='json')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.invoice_status, "Paid")

        data = create_res.data.get('data', create_res.data)
        self.client.delete(f'/api/v1/crm/invoice-payments/{data["id"]}/')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.invoice_status, "Unpaid")

    # ── EDGE CASES ──────────────────────────────────────────────

    def test_payment_with_invalid_invoice(self):
        """Payment with non-existent invoice ID returns 400."""
        payload = {
            "invoice": "00000000-0000-0000-0000-000000000000",
            "amount": "1000",
            "payment_date": "2026-09-01",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 400)

    def test_payment_with_reference_no(self):
        """Payment with reference_no stores correctly."""
        payload = {
            "invoice": str(self.invoice.id),
            "amount": "5000.00",
            "payment_date": "2026-09-01",
            "method": "Cheque",
            "reference_no": "CHQ-12345",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertEqual(data['reference_no'], "CHQ-12345")
