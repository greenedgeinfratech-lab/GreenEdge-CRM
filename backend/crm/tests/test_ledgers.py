"""
Tests for Account Groups and Ledgers API.
Used by the Accounts page for journal entry dropdowns.
"""
from django.urls import reverse
from crm.models import AccountGroup, Ledger
from crm.tests.base import BaseCRMTestCase


class LedgerAPITests(BaseCRMTestCase):
    """Test suite for Ledger CRUD operations."""

    def setUp(self):
        super().setUp()
        self.ledgers_url = reverse('ledgers-list')
        self.groups_url = reverse('account-groups-list')

    # ── LEDGER LIST ─────────────────────────────────────────────

    def test_list_ledgers(self):
        """GET /ledgers/ returns all ledgers for the company."""
        res = self.client.get(self.ledgers_url)
        self.assertEqual(res.status_code, 200)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertGreaterEqual(len(results), 4)  # We created 4 in setUp

    def test_list_ledgers_scoped_to_company(self):
        """Ledgers from other companies are not visible."""
        from users.models import Company
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_company = Company.objects.create(name="Other Co")
        other_user = User.objects.create_user(email="x@y.com", password="pass", company=other_company)
        other_group = AccountGroup.objects.create(
            company=other_company, created_by=other_user, updated_by=other_user, name="Other Income",
        )
        Ledger.objects.create(
            company=other_company, created_by=other_user, updated_by=other_user,
            group=other_group, name="Other Ledger", balance_side="Dr",
        )
        res = self.client.get(self.ledgers_url)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        names = [l['name'] for l in results]
        self.assertNotIn("Other Ledger", names)

    def test_create_ledger(self):
        """POST /ledgers/ creates a new ledger."""
        payload = {
            "group": str(self.income_group.id),
            "name": "Commission Income",
            "opening_balance": "0",
            "balance_side": "Cr",
        }
        res = self.client.post(self.ledgers_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)

    def test_create_ledger_duplicate_name(self):
        """Creating a ledger with duplicate name in same company raises IntegrityError."""
        from django.db import IntegrityError
        payload = {
            "group": str(self.income_group.id),
            "name": "Sales Account",  # Already exists
            "opening_balance": "0",
            "balance_side": "Cr",
        }
        with self.assertRaises(IntegrityError):
            self.client.post(self.ledgers_url, payload, format='json')

    def test_delete_ledger(self):
        """DELETE /ledgers/{id}/ removes the ledger."""
        ledger = Ledger.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            group=self.income_group, name="Temp Ledger", balance_side="Cr",
        )
        res = self.client.delete(f'/api/v1/crm/ledgers/{ledger.id}/')
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Ledger.objects.filter(id=ledger.id).exists())

    def test_search_ledgers(self):
        """Search ledgers by name."""
        res = self.client.get(f'{self.ledgers_url}?search=Sales')
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        names = [l['name'] for l in results]
        self.assertIn("Sales Account", names)

    # ── ACCOUNT GROUPS ──────────────────────────────────────────

    def test_list_account_groups(self):
        """GET /account-groups/ returns all groups."""
        res = self.client.get(self.groups_url)
        self.assertEqual(res.status_code, 200)
        data = res.data.get('data', res.data)
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertGreaterEqual(len(results), 3)

    def test_create_account_group(self):
        """POST /account-groups/ creates a new group."""
        payload = {"name": "Liabilities", "sequence": 4}
        res = self.client.post(self.groups_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)

    def test_create_subgroup(self):
        """Creating a subgroup with parent works."""
        parent = AccountGroup.objects.create(
            company=self.company, created_by=self.user, updated_by=self.user,
            name="Current Assets", sequence=5,
        )
        payload = {"name": "Cash & Bank", "parent": str(parent.id), "sequence": 1}
        res = self.client.post(self.groups_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)

    # ── LEDGER EDGE CASES ───────────────────────────────────────

    def test_create_ledger_with_opening_balance(self):
        """Ledger with opening balance stores correctly."""
        payload = {
            "group": str(self.asset_group.id),
            "name": "Fixed Deposit",
            "opening_balance": "100000.00",
            "balance_side": "Dr",
        }
        res = self.client.post(self.ledgers_url, payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.data.get('data', res.data)
        self.assertEqual(float(data['opening_balance']), 100000.00)

    def test_toggle_favourite(self):
        """PATCH /ledgers/{id}/ toggles is_favourite."""
        payload = {"is_favourite": True}
        res = self.client.patch(
            f'/api/v1/crm/ledgers/{self.sales_ledger.id}/',
            payload, format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.sales_ledger.refresh_from_db()
        self.assertTrue(self.sales_ledger.is_favourite)
