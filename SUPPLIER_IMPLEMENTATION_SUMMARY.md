# GreenEdge CRM - Supplier Implementation Summary

## Overview
Suppliers in the GreenEdge CRM are implemented as **Customers with `customer_type='business'`**. There is no separate Supplier model - the system uses a unified Customer model for both customers and suppliers, differentiated by the `customer_type` field.

---

## Backend Implementation

### 1. Database Models

#### Location: `backend/customers/models.py`

**Primary Models:**

- **Customer Model**
  - Unified model for both customers and suppliers
  - `customer_type` field: `INDIVIDUAL` or `BUSINESS`
  - **Key Fields:**
    - Identity: `customer_number`, `name`, `company_name`, `customer_type`, `status`
    - Contact: `mobile`, `alternate_mobile`, `email`, `secondary_email`, `phone`, `website`
    - Tax/Legal: `gst_number`, `pan_number`
    - Address: `address`, `city`, `state`, `country`, `pincode`, `billing_address`, `shipping_address`
    - Classification: `industry`, `source`, `tags`
    - Financials: `credit_limit`, `outstanding`, `total_orders`, `total_invoices`
    - Assignment: `assigned_to` (ForeignKey to EmployeeProfile)
    - Origin: `converted_from_lead` (ForeignKey to Lead)
    - Misc: `notes`
  - **Status Choices:** `ACTIVE`, `INACTIVE`, `BLOCKED`
  - **Relationships:**
    - One-to-Many: `contacts` (CustomerContact)
    - One-to-Many: `interactions` (CustomerInteraction)

- **CustomerContact Model**
  - Additional contacts linked to a customer
  - Fields: `customer`, `name`, `designation`, `mobile`, `email`, `is_primary`
  - Used for departments/branches (e.g., accounts dept, site manager)

- **CustomerInteraction Model**
  - Auditable recovery activities for a customer
  - Types: `reminder`, `appointment`, `payment`, `email`, `whatsapp`
  - Fields: `customer`, `interaction_type`, `notes`, `scheduled_for`, `amount`, `delivery_status`, `delivery_error`

### 2. API Serializers

#### Location: `backend/customers/serializers.py`

- **CustomerListSerializer**: For list view with summary fields
  - Includes: `assigned_to_name`, `contact_count`, flattened customer info
- **CustomerDetailSerializer**: Full customer details including nested contacts
  - Includes all fields plus related names for assigned_to and converted_from_lead
- **CustomerCreateSerializer**: For creation with nested contacts
- **CustomerUpdateSerializer**: For updates with nested contacts
- **CustomerContactSerializer**: For nested contact serialization
- **CustomerInteractionSerializer**: For interactions/recovery activities

### 3. API Endpoints & Views

#### Location: `backend/customers/urls.py` and `backend/customers/views.py`

**Base URL:** `/api/v1/customers/`

**ViewSet:** `CustomerViewSet` with permissions: `IsAuthenticated`

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET, POST | `/customers/` | List customers, create new customer |
| GET, PATCH, DELETE | `/customers/{id}/` | Retrieve, update, delete customer |
| GET | `/customers/summary/` | Get summary counts (total, active, inactive, blocked, individual, business) |
| POST | `/customers/{id}/toggle_status/` | Toggle customer status (active ↔ inactive) |
| GET, POST | `/customers/{id}/interactions/` | List interactions, create new interaction |
| POST | `/customers/{id}/receive_payment/` | Record payment received |
| POST | `/customers/{id}/send_email/` | Send email to customer |
| POST | `/customers/{id}/send_whatsapp/` | Send WhatsApp message via Twilio |

**Query Parameters (Filtering):**
- `search`: Search by name, company_name, mobile, email, customer_number
- `status`: Filter by status (active, inactive, blocked)
- `customer_type`: Filter by type (individual, business)
- `assigned_to`: Filter by employee ID
- `city`: Filter by city (contains)
- `state`: Filter by state (contains)
- `page`: Pagination (10 per page by default)

**Key Features:**
- Auto-numbering: Generates customer numbers with prefix `CUST`
- Tenant-isolation: Filters by company
- Assignment: Can assign customers to employees
- Contact management: Supports multiple contacts per customer
- Interaction tracking: Reminders, appointments, emails, WhatsApp, payments
- Payment tracking: Receive payment and update outstanding balance
- Status management: Toggle between active/inactive
- Lead conversion: Can track which customer was converted from which lead

---

## Frontend Implementation

### 1. Suppliers Page

#### Location: `frontend/src/app/(erp)/suppliers/page.tsx`

**Features:**
- List of suppliers (customers with `customer_type='business'`)
- Search by name, company, mobile, email
- Filters: Executive (assigned_to), City, State
- Pagination: 10 per page
- Actions per supplier:
  - Edit (navigate to detail page - NOT YET IMPLEMENTED)
  - Delete
  - Status toggle (active/inactive)
  - Contact actions: WhatsApp, Email
  - Last talk logged (interaction)
  - Next action scheduled (interaction with date)
- Bulk operations:
  - Import suppliers from CSV
  - Export suppliers to CSV
- Modals:
  - Create supplier modal (reuses CreateCustomerModal)
  - Interaction modal (for logging last talk or scheduling next action)

**CSV Import Format:**
Accepts columns: `name`, `contact_name`, `company`, `company_name`, `business_name`, `mobile`, `phone`, `email`, `city`, `state`

**CSV Export:**
Exports columns: `Name`, `Company`, `Mobile`, `Email`, `City`, `State`, `Status`, `Outstanding`

### 2. API Service

#### Location: `frontend/src/services/crmService.ts`

**customersApi Object:**
```typescript
- list(filters): Get paginated customers
- get(id): Get customer details
- create(data): Create new customer
- update(id, data): Update customer
- delete(id): Delete customer
- toggleStatus(id): Toggle active/inactive
- summary(): Get summary counts
- interactions(id): Get customer interactions
- addInteraction(id, data): Add new interaction
- receivePayment(id, amount, notes): Record payment
```

### 3. Data Models & Interfaces

#### Location: `frontend/src/interfaces/crm.ts`

**Customer Interface:**
```typescript
interface Customer {
  id: string;
  customer_number?: string;
  name: string;
  company_name?: string;
  customer_type?: string;  // 'individual' or 'business'
  status?: string;          // 'active', 'inactive', 'blocked'
  mobile?: string;
  alternate_mobile?: string;
  email?: string;
  secondary_email?: string;
  phone?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  billing_address?: string;
  shipping_address?: string;
  industry?: string;
  source?: string;
  tags?: string[];
  credit_limit?: number;
  outstanding?: number;
  total_orders?: number;
  total_invoices?: number;
  assigned_to?: string;
  assigned_to_name?: string;
  converted_from_lead?: string;
  converted_from_lead_name?: string;
  notes?: string;
  contacts?: CustomerContact[];
  contact_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}
```

**CustomerContact Interface:**
```typescript
interface CustomerContact {
  id?: string;
  name: string;
  designation?: string;
  mobile?: string;
  email?: string;
  is_primary?: boolean;
}
```

### 4. Components

#### Navigation
- Suppliers page is accessible from main ERP navigation
- Connected to Connections tab (shows all customers/suppliers)
- Links to Appointments view

#### Modals
- **CreateCustomerModal** (`frontend/src/components/CreateCustomerModal.tsx`): Reused for creating suppliers with `customer_type='business'`
- **Interaction Modal**: Built into suppliers page for logging activities

---

## Related Functionality

### Purchase Orders
- **Location:** `backend/crm/models/purchase_order.py`
- Store `supplier_name` as CharField (not linked to Customer model - potential enhancement)
- Could be enhanced to link PurchaseOrder to Customer for better tracking

### Debit Notes
- **Location:** `backend/crm/models/debit_note.py`
- Store `supplier_ledger` as CharField
- Similar potential enhancement to link to Customer/Supplier model

---

## What's Currently Implemented

✅ **Fully Implemented:**
- Supplier creation (via CustomerCreateModal)
- Supplier listing with search and filters
- Supplier details retrieval
- Supplier editing/updating
- Supplier deletion
- Supplier status management (active/inactive)
- Multiple contacts per supplier (CustomerContact)
- Supplier interactions (reminders, appointments, emails, WhatsApp)
- Payment tracking (outstanding balance, total invoices, total orders)
- Supplier assignment to employees
- CSV import/export
- Supplier summary statistics
- Tax information (GST, PAN)
- Address management (billing, shipping)
- Supplier tagging and classification

✅ **Partially Implemented:**
- Supplier detail page (backend exists, frontend may not have dedicated display)
- Purchase Order tracking (stores supplier name but not linked to Customer)

---

## What's Missing or Incomplete

⚠️ **Missing/Incomplete Features:**

1. **Dedicated Supplier Detail Page**
   - Suppliers page doesn't show a detail/edit view for individual suppliers
   - Customers have `/customers/[id]` structure, suppliers might need similar

2. **Purchase Order Integration**
   - PurchaseOrder stores `supplier_name` as string, not linked to Customer model
   - Could enhance to: `supplier = ForeignKey(Customer, customer_type='business', ...)`
   - This would enable better reporting and tracking

3. **Supplier Dashboard/Analytics**
   - No dedicated supplier analytics page
   - No supplier performance metrics
   - No supplier-specific reporting

4. **Supplier Categories/Classifications**
   - Uses generic `industry` and `source` fields
   - Could benefit from supplier-specific classification

5. **Supplier Portal/Self-Service**
   - No supplier-facing portal or self-service capabilities

6. **Supplier Hierarchy**
   - No support for parent/subsidiary supplier relationships

7. **Supplier Document Management**
   - Could add supplier documents (agreements, certifications, etc.)

8. **Quality/Performance Metrics**
   - No supplier rating system
   - No quality metrics tracking
   - No delivery performance tracking

9. **Supplier Contacts Navigation**
   - Detail modal or dedicated page for managing supplier contacts

10. **Advanced Reporting**
    - Supplier payment history
    - Supplier performance reports
    - Supplier-wise order trends

---

## File Structure Summary

**Backend:**
```
backend/
├── customers/
│   ├── models.py           # Customer, CustomerContact, CustomerInteraction
│   ├── serializers.py      # Customer serializers
│   ├── views.py            # CustomerViewSet with CRUD + actions
│   ├── urls.py             # /api/v1/customers/ endpoints
│   ├── admin.py
│   ├── apps.py
│   └── migrations/
├── crm/
│   ├── models/
│   │   ├── purchase_order.py  # PurchaseOrder with supplier_name string
│   │   ├── debit_note.py      # DebitNote with supplier_ledger string
│   │   └── ...
│   ├── views/
│   │   ├── purchase_order_views.py
│   │   └── ...
│   └── ...
```

**Frontend:**
```
frontend/
├── src/
│   ├── app/
│   │   └── (erp)/
│   │       ├── suppliers/
│   │       │   └── page.tsx           # Suppliers list page
│   │       ├── customers/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   └── [id]/
│   │       └── connections/
│   │           └── page.tsx            # All connections (customers + suppliers)
│   ├── components/
│   │   └── CreateCustomerModal.tsx    # Reused for suppliers
│   ├── interfaces/
│   │   └── crm.ts                     # Customer interface
│   ├── services/
│   │   └── crmService.ts              # customersApi
│   └── lib/
│       └── crmQueryKeys.ts
```

---

## Database Schema

```
Customer Table:
- id (UUID, PK)
- company (FK to Tenant)
- customer_number (CharField, auto-generated)
- name (CharField)
- company_name (CharField)
- customer_type (CharField: 'individual' | 'business')
- status (CharField: 'active' | 'inactive' | 'blocked')
- mobile, alternate_mobile, email, secondary_email, phone, website
- gst_number, pan_number
- address, city, state, country, pincode, billing_address, shipping_address
- industry, source, tags (JSONField)
- credit_limit, outstanding, total_orders, total_invoices (Decimal)
- assigned_to (FK to EmployeeProfile)
- converted_from_lead (FK to Lead)
- notes
- created_at, updated_at, created_by, updated_by (TenantBaseModel)
- is_active (soft delete)
- Indexes: (company, status), (company, customer_number), (mobile), (email)

CustomerContact Table:
- id (UUID, PK)
- customer (FK to Customer)
- name, designation
- mobile, email
- is_primary (Boolean)
- created_at, updated_at, created_by, updated_by

CustomerInteraction Table:
- id (UUID, PK)
- customer (FK to Customer)
- interaction_type (CharField: 'reminder' | 'appointment' | 'payment' | 'email' | 'whatsapp')
- notes, scheduled_for, amount
- delivery_status, delivery_error
- created_at, updated_at, created_by, updated_by
```

---

## Key Design Decisions

1. **Single Model Approach**: Suppliers and customers use the same Customer model with `customer_type` field
   - *Pros*: DRY, unified reporting, flexible
   - *Cons*: Forces all customer features onto suppliers

2. **String References in PurchaseOrder/DebitNote**: Supplier info stored as strings rather than FKs
   - *Pros*: Flexible, allows historical data
   - *Cons*: No data integrity, harder to track metrics

3. **Tenant-based Model**: All customers/suppliers are company-specific
   - Ensures multi-tenant isolation

4. **Soft Deletes via `is_active`**: Customers marked inactive rather than deleted
   - Preserves audit trail

---

## Recommendations for Enhancement

1. Create dedicated `/suppliers/` endpoint that filters `customer_type='business'` by default
2. Link PurchaseOrder to Customer model for better tracking
3. Add supplier-specific fields (payment terms, lead time, quality rating)
4. Create supplier detail page with order/interaction history
5. Add supplier analytics dashboard
6. Implement supplier categories/tiers
7. Add supplier document management
8. Create supplier approval workflow
9. Add supplier performance metrics/KPIs
10. Implement supplier-specific access control/portal

