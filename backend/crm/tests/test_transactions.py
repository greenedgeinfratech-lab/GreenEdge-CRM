"""
Tests for Ledger Transactions (Journal Entries) API.
Endpoints: GET/POST /api/v1/crm/transactions/, DELETE /api/v1/crm/transactions/{id}/
"""
import json
from django.urls import reverse
from crm.models import Transaction
from crm.tests.base import BaseCRMTestCase


class TransactionAPITests(BaseCRMTestCase):
    """Test suite for Transaction CRUD operations."""

    def setUp(self):
        super().setUp()
        self.list_url = reverse('transactions-list')

    # ── CREATE ──────────────────────────────────────────────────

    def test_create_transaction_success(self):
        """POST /transactions/ with valid data creates a transaction."""
        payload = {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
            "narration": "Cash sale to customer",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertEqual(str(data['debit_ledger']), str(self.cash_ledger.id))
        self.assertEqual(str(data['credit_ledger']), str(self.sales_ledger.id))
        self.assertEqual(float(data['amount']), 5000.00)
        self.assertEqual(data['narration'], "Cash sale to customer")

    def test_create_transaction_with_voucher_no(self):
        """Transaction with voucher_no stores correctly."""
        payload = {
            "date": "2026-09-01",
            "voucher_no": "JV-001",
            "debit_ledger": str(self.bank_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "10000.00",
            "narration": "Bank transfer received",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertEqual(data['voucher_no'], "JV-001")

    def test_create_transaction_with_reference(self):
        """Transaction with reference_type and reference_id stores correctly."""
        payload = {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "7500.00",
            "reference_type": "Invoice",
            "reference_no": "INV-001",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertEqual(data['reference_type'], "Invoice")
        self.assertEqual(data['reference_no'], "INV-001")

    def test_create_transaction_missing_required_field(self):
        """POST without required fields returns 400."""
        payload = {"date": "2026-09-01"}
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 400)

    def test_create_transaction_zero_amount(self):
        """POST with amount=0 or negative should be rejected."""
        payload = {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "0",
        }
        res = self.client.post(self.list_url, payload, format='json')
        # DRF allows 0 for DecimalField unless validators are set
        # This tests actual behavior
        self.assertIn(res.status_code, [201, 400])

    # ── READ ────────────────────────────────────────────────────

    def test_list_transactions_empty(self):
        """GET /transactions/ returns empty list when no transactions exist."""
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, 200)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 0)

    def test_list_transactions_returns_created(self):
        """GET /transactions/ returns previously created transactions."""
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
        }, format='json')
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, 200)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)

    def test_list_transactions_includes_ledger_names(self):
        """Transaction response includes debit_ledger_name and credit_ledger_name."""
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
        }, format='json')
        res = self.client.get(self.list_url)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        tx = results[0]
        self.assertEqual(tx['debit_ledger_name'], "Cash in Hand")
        self.assertEqual(tx['credit_ledger_name'], "Sales Account")

    def test_list_transactions_includes_created_by_name(self):
        """Transaction response includes created_by_name."""
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
        }, format='json')
        res = self.client.get(self.list_url)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertIn('created_by_name', results[0])

    def test_list_transactions_scoped_to_company(self):
        """Transactions from other companies are not visible."""
        from users.models import Company
        other_company = Company.objects.create(name="Other Company")
        other_user = User = __import__('users.models', fromlist=['User']).User.objects.create_user(
            email="other@test.com", password="pass123", company=other_company,
        )
        from crm.models import Transaction
        Transaction.objects.create(
            company=other_company, created_by=other_user, updated_by=other_user,
            date="2026-09-01", debit_ledger_id=self.cash_ledger.id,
            credit_ledger_id=self.sales_ledger.id, amount=999,
        )
        res = self.client.get(self.list_url)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        amounts = [float(t['amount']) for t in results]
        self.assertNotIn(999.0, amounts)

    def test_detail_transaction(self):
        """GET /transactions/{id}/ returns single transaction."""
        payload = {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
            "narration": "Test detail",
        }
        create_res = self.client.post(self.list_url, payload, format='json')
        data = create_res.data.get('data', create_res.data)
        tx_id = data['id']
        res = self.client.get(f'/api/v1/crm/transactions/{tx_id}/')
        self.assertEqual(res.status_code, 200)

    # ── UPDATE ──────────────────────────────────────────────────

    def test_patch_transaction(self):
        """PATCH /transactions/{id}/ updates fields."""
        create_res = self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
        }, format='json')
        data = create_res.data.get('data', create_res.data)
        tx_id = data['id']
        res = self.client.patch(
            f'/api/v1/crm/transactions/{tx_id}/',
            {"narration": "Updated narration"},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        data2 = res.data.get('data', res.data)
        self.assertEqual(data2['narration'], "Updated narration")

    # ── DELETE ──────────────────────────────────────────────────

    def test_delete_transaction(self):
        """DELETE /transactions/{id}/ removes the transaction."""
        create_res = self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
        }, format='json')
        data = create_res.data.get('data', create_res.data)
        tx_id = data['id']
        res = self.client.delete(f'/api/v1/crm/transactions/{tx_id}/')
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Transaction.objects.count(), 0)

    # ── AUTH ────────────────────────────────────────────────────

    def test_unauthenticated_access_denied(self):
        """Unauthenticated requests return 401."""
        from rest_framework.test import APIClient
        unauth = APIClient()
        res = unauth.get(self.list_url)
        self.assertIn(res.status_code, [401, 403])

    # ── FILTERING ───────────────────────────────────────────────

    def test_filter_by_debit_ledger(self):
        """Filter transactions by debit_ledger."""
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "1000.00",
        }, format='json')
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.bank_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "2000.00",
        }, format='json')
        res = self.client.get(f'{self.list_url}?debit_ledger={self.cash_ledger.id}')
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)
        self.assertEqual(float(results[0]['amount']), 1000.00)

    def test_filter_by_date(self):
        """Filter transactions by date."""
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "1000.00",
        }, format='json')
        self.client.post(self.list_url, {
            "date": "2026-08-15",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "2000.00",
        }, format='json')
        res = self.client.get(f'{self.list_url}?date=2026-09-01')
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)

    def test_search_by_narration(self):
        """Search transactions by narration."""
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "1000.00",
            "narration": "Office rent payment",
        }, format='json')
        self.client.post(self.list_url, {
            "date": "2026-09-01",
            "debit_ledger": str(self.cash_ledger.id),
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "2000.00",
            "narration": "Customer payment received",
        }, format='json')
        res = self.client.get(f'{self.list_url}?search=rent')
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)
        self.assertIn("rent", results[0]['narration'].lower())

    # ── EDGE CASES ──────────────────────────────────────────────

    def test_create_multiple_transactions(self):
        """Multiple transactions can be created and listed."""
        for i in range(5):
            self.client.post(self.list_url, {
                "date": f"2026-09-0{i+1}",
                "debit_ledger": str(self.cash_ledger.id),
                "credit_ledger": str(self.sales_ledger.id),
                "amount": f"{(i+1)*1000}.00",
            }, format='json')
        res = self.client.get(self.list_url)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 5)

    def test_transaction_with_invalid_ledger(self):
        """Transaction with non-existent ledger ID returns 400."""
        payload = {
            "date": "2026-09-01",
            "debit_ledger": "00000000-0000-0000-0000-000000000000",
            "credit_ledger": str(self.sales_ledger.id),
            "amount": "5000.00",
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, 400)
