# Manual Testing Checklist — GreenEdge CRM

## Pre-requisites
- [ ] Backend running: `python manage.py runserver` (port 8000)
- [ ] Frontend running: `npm run dev` (port 3000)
- [ ] Database migrated: `python manage.py migrate`
- [ ] Test user logged in with admin/staff privileges

---

## 1. ACCOUNTS MODULE (`/accounts`)

### 1.1 Groups & Ledgers Display
- [ ] Page loads without errors
- [ ] Default account groups visible (Current Assets, Sales, Purchase, etc.)
- [ ] Ledger balances calculated from invoices/purchases
- [ ] "Hide zeroes" checkbox filters out zero-balance ledgers
- [ ] "Find Ledger" search filters ledgers by name

### 1.2 Favourite Ledgers
- [ ] Star icon toggles favourite status
- [ ] Favourites persist after page reload (localStorage)
- [ ] Favourite Ledgers section shows favourited items
- [ ] Clicking a favourite navigates to the correct module

### 1.3 Quick Access Links
- [ ] All 9 quick access buttons navigate to correct pages
- [ ] Balance Sheet → /reports
- [ ] Purchase Orders → /purch-orders
- [ ] Reconciliation → /recovery

### 1.4 Journal Entry (Backend-Persisted)
- [ ] "New Entry" button opens the form
- [ ] Debit Ledger dropdown lists ledgers from backend API
- [ ] Credit Ledger dropdown lists ledgers from backend API
- [ ] Same ledger cannot be selected for both debit and credit
- [ ] "Post Entry" creates a transaction via API
- [ ] Entry appears in the journal entries table
- [ ] Entry persists after page reload (stored in database)
- [ ] "Delete" button removes the entry with confirmation
- [ ] "CSV" button exports entries to CSV file
- [ ] "Print" button opens print preview with formatted report

---

## 2. QUOTES MODULE (`/quotes`)

### 2.1 Quotes List
- [ ] Page loads with quotations from API
- [ ] Search by customer name works
- [ ] Type filter (All/Quotations/Proforma Invoices) works
- [ ] Status filter (All/Pending/Accepted/Declined) works
- [ ] Executive filter works
- [ ] "Print Settings" modal opens with options
- [ ] "CSV" export downloads all visible quotations
- [ ] "Print" button opens formatted print preview

### 2.2 Quote Actions (per row)
- [ ] "PDF" button (FileDown icon) opens print-to-browser PDF
- [ ] "Convert to Order" (ArrowRightLeft icon) navigates to order form with quote data
- [ ] "Convert to Invoice" (FileText icon) converts quote → invoice via API
  - [ ] Button grays out after conversion
  - [ ] Status badge changes to "Converted"
  - [ ] Invoice appears in /invoices page
  - [ ] Cannot convert same quote twice
- [ ] "Edit" button navigates to quote edit form
- [ ] "Delete" button removes with confirmation
- [ ] "Send Notification" shows success toast

---

## 3. INVOICES MODULE (`/invoices`)

### 3.1 Invoices List
- [ ] Page loads with invoices from API
- [ ] Search by invoice number/customer works
- [ ] Status filter (All/Unpaid/Partial/Paid/Overdue) works
- [ ] Period filter (All time/This month) works
- [ ] "Refresh" button reloads data
- [ ] "Create B2B Invoice" navigates to create form
- [ ] "Print" button prints the invoice list

### 3.2 Invoice Status
- [ ] Status dropdown shows current status
- [ ] Changing status updates via API
- [ ] Status options: Unpaid, Partial, Paid, Overdue

### 3.3 Payment Recording
- [ ] "Record Payment" button (banknote icon) visible for unpaid/partial invoices
- [ ] Button hidden for fully paid invoices
- [ ] Modal shows: invoice number, customer, grand total, already paid, outstanding
- [ ] Amount field pre-filled with outstanding balance
- [ ] Date field defaults to today
- [ ] Method dropdown: Cash, Bank Transfer, UPI, Cheque, NEFT, RTGS, Other
- [ ] Reference No field accepts text
- [ ] Notes field accepts text
- [ ] "Record Payment" submits and creates payment via API
- [ ] Payment history shown inside modal with delete option
- [ ] Deleting payment recalculates invoice totals
- [ ] Invoice status auto-updates (Paid/Partial/Unpaid)
- [ ] Invoice recovery_amt column updates in the list

### 3.4 Invoice PDF
- [ ] "Print" button opens PDF preview modal
- [ ] PDF shows correct company details (Greenedge Infratech)
- [ ] PDF shows GSTIN, billing/shipping addresses
- [ ] Line items, tax breakdown, grand total correct
- [ ] "Print" in modal triggers browser print dialog

---

## 4. CROSS-MODULE TESTS

### 4.1 Quote → Invoice → Payment Flow
- [ ] Create a quotation with items → Accept it
- [ ] Click "Convert to Invoice" on quotes page
- [ ] Verify invoice created in /invoices with correct data
- [ ] Record partial payment on the invoice
- [ ] Verify status changes to "Partial"
- [ ] Record remaining payment
- [ ] Verify status changes to "Paid"
- [ ] Verify recovery_amt matches grand_total

### 4.2 Quote → Order Flow (existing)
- [ ] Create a quotation → Click "Convert to Order"
- [ ] Order form loads with quote data pre-populated
- [ ] Submit order → Order saved

### 4.3 Journal Entry → Reports
- [ ] Create a journal entry in Accounts
- [ ] Navigate to /reports → Verify entry appears (if reports module uses transactions)

---

## 5. EDGE CASES

- [ ] Empty state: No invoices → Shows "Create First Invoice" CTA
- [ ] Empty state: No quotations → Shows "Create Quotation" message
- [ ] Empty state: No journal entries → Shows instructional text
- [ ] Unauthenticated user → Redirected to login
- [ ] Concurrent payments → Totals calculate correctly
- [ ] Very large amounts (>1 crore) → Display correctly
- [ ] Special characters in narration/notes → Save and display correctly
- [ ] Date edge cases → End of month/year boundaries

---

## 6. API ENDPOINTS (for developer testing)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/crm/transactions/` | GET/POST | List/Create journal entries |
| `/api/v1/crm/transactions/{id}/` | GET/PATCH/DELETE | Read/Update/Delete journal entry |
| `/api/v1/crm/invoice-payments/` | GET/POST | List/Create payments |
| `/api/v1/crm/invoice-payments/{id}/` | GET/PATCH/DELETE | Read/Update/Delete payment |
| `/api/v1/crm/quotations/{id}/convert-to-invoice/` | POST | Convert quotation to invoice |
| `/api/v1/crm/ledgers/` | GET/POST | List/Create ledgers |
| `/api/v1/crm/account-groups/` | GET/POST | List/Create account groups |
