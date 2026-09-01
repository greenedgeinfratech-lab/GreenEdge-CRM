# 🌿 GreenEdge CRM — Comprehensive Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [What We're Building](#what-were-building)
3. [End Goal & Vision](#end-goal--vision)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Core Modules & Features](#core-modules--features)
7. [Data Models & Relationships](#data-models--relationships)
8. [API Structure & Endpoints](#api-structure--endpoints)
9. [Data Flow & Workflows](#data-flow--workflows)
10. [Authentication & Authorization](#authentication--authorization)
11. [Development Setup](#development-setup)

---

## Project Overview

**GreenEdge CRM** is a full-stack, **Biziverse-inspired enterprise ERP & CRM platform** specifically designed for Indian SMEs (Small & Medium Enterprises). It is a complete business management solution that handles the entire business lifecycle—from initial lead capture through quotations, orders, invoicing, inventory management, purchasing, and team operations—all integrated into a single, cohesive platform.

### What is Biziverse?
**Biziverse** is an Indian SaaS-based enterprise software platform that provides comprehensive ERP and CRM tools to SMEs. It handles sales, inventory, accounting, HR, and customer relationship management. GreenEdge CRM is our replica/inspired implementation of Biziverse's core functionality.

---

## What We're Building

GreenEdge CRM is a **production-grade, multi-tenant SaaS platform** with the following capabilities:

### Core Business Functions
1. **Lead Management** — Capture, qualify, and track potential customers through customizable sales pipelines
2. **Quotation & Bidding** — Create and send professional quotations with product catalogs
3. **Order Management** — Convert quotations to orders, track fulfillment status
4. **Invoicing** — Generate GST-compliant invoices with automatic calculations
5. **Debit & Credit Notes** — Manage returns, adjustments, and financial corrections
6. **Inventory Management** — Track product catalogs, stock levels, and availability
7. **Purchase Orders** — Manage vendor purchases and procurement workflows
8. **CRM Dashboard** — Real-time analytics, sales pipelines, revenue forecasts
9. **Team Management** — User roles, permissions, activity tracking, assignment workflows
10. **Reminders & Notifications** — Automated follow-ups, task management, activity logs

### Key Characteristics
- **Multi-tenant Architecture** — Complete data isolation between organizations
- **Role-Based Access Control (RBAC)** — Granular permissions and workflows
- **RESTful API** — Fully documented APIs for integrations and mobile apps
- **Real-time Notifications** — WebSocket-based activity streams and updates
- **Indian Compliance** — GST calculations, PAN/GSTIN validation, Indian address formats
- **Scalable Infrastructure** — Docker containerization, PostgreSQL, Celery task queue

---

## End Goal & Vision

### Primary Objectives
1. **Replace manual business processes** — Eliminate spreadsheets, emails, and fragmented tools
2. **Enable data-driven decision making** — Real-time dashboards and analytics
3. **Improve team collaboration** — Centralized platform for sales, operations, and finance teams
4. **Reduce operational costs** — Automate workflows, reduce manual data entry errors
5. **Provide mobile-first experience** — Work from anywhere, anytime with responsive UI
6. **Ensure compliance & reporting** — Standard financial and tax compliance for Indian businesses

### Success Metrics
- Reduce lead-to-invoice time by 60%
- Decrease manual data entry errors by 90%
- Improve team productivity through automation
- Provide 99.9% uptime SLA
- Support 1000+ concurrent users per instance

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         END USER LAYER                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │     Next.js Frontend (React 19, TypeScript, Tailwind)        │   │
│  │  • Dashboard • Leads • Quotations • Orders • Invoices        │   │
│  │  • Inventory • Purchase Orders • Team Management            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP/WebSocket)
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │   Django REST Framework (DRF) + djangorestframework-simplejwt   │   │
│  │   • JWT Authentication • CORS • Rate Limiting                │   │
│  │   • API Documentation (Swagger/ReDoc via drf-spectacular)    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (SQL)
┌─────────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            Django Applications (Multi-App Structure)         │   │
│  │                                                              │   │
│  │  • users/        → Authentication, user profiles, roles      │   │
│  │  • crm/          → Leads, opportunities, pipelines           │   │
│  │  • customers/    → Customer profiles and relationships       │   │
│  │  • dashboard/    → Analytics, KPIs, reports                 │   │
│  │  • common/       → Shared models, exceptions, utilities      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (SQL Queries)
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                             │   │
│  │  ├─ Users, Roles, Permissions                               │   │
│  │  ├─ Leads, Quotations, Orders, Invoices                     │   │
│  │  ├─ Products, Inventory, Purchase Orders                    │   │
│  │  ├─ Activities, Reminders, Notes                            │   │
│  │  └─ Analytics, Audit Logs                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    ASYNCHRONOUS TASK LAYER                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Celery Task Queue + Redis Broker                            │  │
│  │  • Email notifications  • PDF generation                      │  │
│  │  • Scheduled reminders  • Data synchronization               │  │
│  │  • Batch operations     • Webhooks                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME COMMUNICATION LAYER                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Django Channels + Daphne (WebSocket)                        │  │
│  │  • Live notifications  • Activity streams                     │  │
│  │  • Collaborative updates  • Presence tracking                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Deployment Architecture
```
┌─────────────────┐
│   Docker Host   │
│                 │
│ ┌─────────────┐ │
│ │  Container  │ │
│ │  Frontend   │ │
│ │  (Node.js)  │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │  Container  │ │
│ │  Backend    │ │
│ │  (Gunicorn) │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │  Container  │ │
│ │  Celery     │ │
│ │  Worker     │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │  Container  │ │
│ │  Redis      │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │  Container  │ │
│ │ PostgreSQL  │ │
│ └─────────────┘ │
└─────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.2.10 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + PostCSS 4
- **UI Components**: shadcn/ui, Base UI
- **State Management**: TanStack React Query (Data fetching & caching)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Webpack (built-in with Next.js)

### Backend
- **Framework**: Django 5.0+ (Python 3.10+)
- **REST API**: Django REST Framework (DRF) 3.15+
- **Authentication**: djangorestframework-simplejwt (JWT tokens)
- **Database ORM**: Django ORM
- **Database**: PostgreSQL 14+
- **Task Queue**: Celery 5.4+ with Redis 5.0+
- **WebSocket**: Django Channels + Daphne
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)
- **Middleware**: CORS headers, Whitenoise (static files), Request logging
- **Additional Libraries**:
  - `django-filter` — Advanced filtering on API endpoints
  - `drf-nested-routers` — Nested API routes
  - `python-dotenv` — Environment variable management
  - `Pillow` — Image processing
  - `gunicorn` — WSGI application server

### Infrastructure
- **Containerization**: Docker + docker-compose
- **Web Server**: Nginx (reverse proxy, load balancing)
- **Application Server**: Gunicorn (WSGI) + Daphne (ASGI for WebSocket)
- **Message Broker**: Redis
- **Task Queue**: Celery
- **CI/CD**: (To be configured)

---

## Core Modules & Features

### 1. **Users Module** (`users/`)
**Purpose**: Authentication, authorization, user management, team hierarchy

**Features**:
- User registration and login with JWT tokens
- Role-Based Access Control (Admin, Manager, Sales Executive, etc.)
- User profiles with organization details
- Permission management
- Session management and token blacklisting

**Key Files**:
- `models.py` — User, Role, Permission models
- `serializers.py` — JSON serialization for user data
- `views.py` — Authentication endpoints, user CRUD operations
- `authentication.py` — JWT token validation logic
- `urls.py` — API route definitions

**API Endpoints**:
```
POST   /api/v1/auth/login/          → Generate JWT tokens
POST   /api/v1/auth/refresh/        → Refresh access token
POST   /api/v1/auth/logout/         → Blacklist token
GET    /api/v1/users/               → List all users (paginated)
GET    /api/v1/users/{id}/          → Get user details
POST   /api/v1/users/               → Create new user
PUT    /api/v1/users/{id}/          → Update user
DELETE /api/v1/users/{id}/          → Delete user
```

---

### 2. **CRM Module** (`crm/`)
**Purpose**: Core sales pipeline management, lead tracking, opportunity management

**Core Models**:

#### Lead Model
- Represents potential or existing customers
- Fields: name, email, phone, company, status, priority, stage, estimated value
- Tracks contact history, interactions, and follow-ups
- Can be converted to customers/orders
- Supports tagging, source tracking, and loss reason analysis

#### LeadStage (Pipeline Stages)
- Customizable sales pipeline stages (e.g., Prospect → Qualified → Negotiation → Won)
- Defines workflow progression
- Each stage has default actions and next stages

#### LeadSource
- Tracks where leads originate (referral, website, cold call, email, etc.)
- Used for marketing attribution

#### Activity & Timeline
- Records all interactions with a lead
- Types: call, email, meeting, note, task
- Linked to users and timestamps
- Forms the audit trail for the lead

#### Appointment
- Scheduled meetings/calls with leads
- Includes: date, time, purpose, outcome, associated user
- Can generate reminders

#### Quotation & QuotationItem
- Professional price proposals sent to leads
- Items: products with qty, price, taxes
- Automatic GST calculation
- Can be converted to orders
- Version control for revisions

#### Order & OrderItem
- Converted quotations and customer purchases
- Tracks delivery status, payment status
- Items with pricing, taxes, discounts
- Links to invoices

#### Invoice & InvoiceItem
- GST-compliant financial documents
- Automatic calculation of taxes
- Payment tracking
- Linked to orders

#### DebitNote & DebitNoteItem
- Adjustments for returns, damage, errors
- Decreases the customer balance

#### Reminder
- Scheduled follow-ups and alerts
- Linked to leads, users, activities
- Automation support

**API Endpoints**:
```
# Lead Management
GET    /api/v1/crm/leads/                  → List leads (with filters)
POST   /api/v1/crm/leads/                  → Create new lead
GET    /api/v1/crm/leads/{id}/             → Get lead details
PUT    /api/v1/crm/leads/{id}/             → Update lead
DELETE /api/v1/crm/leads/{id}/             → Delete lead
POST   /api/v1/crm/leads/{id}/convert/     → Convert to customer

# Lead Activities & Timeline
GET    /api/v1/crm/leads/{id}/activities/  → Get activity history
POST   /api/v1/crm/leads/{id}/activities/  → Add new activity
GET    /api/v1/crm/leads/{id}/timeline/    → Get lead timeline

# Quotations
GET    /api/v1/crm/quotations/             → List quotations
POST   /api/v1/crm/quotations/             → Create quotation
GET    /api/v1/crm/quotations/{id}/        → Get quotation details
PUT    /api/v1/crm/quotations/{id}/        → Update quotation
POST   /api/v1/crm/quotations/{id}/convert/ → Convert to order
GET    /api/v1/crm/quotations/{id}/pdf/    → Generate PDF

# Orders
GET    /api/v1/crm/orders/                 → List orders
POST   /api/v1/crm/orders/                 → Create order
GET    /api/v1/crm/orders/{id}/            → Get order details
PUT    /api/v1/crm/orders/{id}/            → Update order
POST   /api/v1/crm/orders/{id}/invoice/    → Create invoice from order

# Invoices
GET    /api/v1/crm/invoices/               → List invoices
GET    /api/v1/crm/invoices/{id}/          → Get invoice details
POST   /api/v1/crm/invoices/{id}/pdf/      → Generate PDF

# Debit Notes
GET    /api/v1/crm/debit-notes/            → List debit notes
POST   /api/v1/crm/debit-notes/            → Create debit note

# Reminders
GET    /api/v1/crm/reminders/              → List reminders
POST   /api/v1/crm/reminders/              → Create reminder
PUT    /api/v1/crm/reminders/{id}/notify/  → Send reminder notification

# Pipeline Stages
GET    /api/v1/crm/stages/                 → Get all pipeline stages
POST   /api/v1/crm/stages/                 → Create custom stage
```

---

### 3. **Customers Module** (`customers/`)
**Purpose**: Customer profiles, contact management, relationship tracking

**Features**:
- Customer master database (converted from leads or manual entry)
- Contact persons per customer
- Customer classification (VIP, Regular, Prospect)
- Credit limits and payment terms
- Customer history and transactions

**API Endpoints**:
```
GET    /api/v1/customers/                  → List customers
POST   /api/v1/customers/                  → Create customer
GET    /api/v1/customers/{id}/             → Get customer details
PUT    /api/v1/customers/{id}/             → Update customer
GET    /api/v1/customers/{id}/orders/      → Get customer's orders
GET    /api/v1/customers/{id}/invoices/    → Get customer's invoices
```

---

### 4. **Dashboard Module** (`dashboard/`)
**Purpose**: Analytics, KPIs, business intelligence, reporting

**Features**:
- Sales pipeline overview (funnel, conversion rates)
- Revenue analytics (monthly, quarterly, annual)
- Top customers and products
- Team performance tracking
- Real-time metrics and KPIs

**API Endpoints**:
```
GET    /api/v1/dashboard/metrics/          → Overall business metrics
GET    /api/v1/dashboard/pipeline/         → Sales pipeline analytics
GET    /api/v1/dashboard/revenue/          → Revenue reports
GET    /api/v1/dashboard/team/             → Team performance
GET    /api/v1/dashboard/products/         → Product sales analytics
```

---

### 5. **Common Module** (`common/`)
**Purpose**: Shared utilities, base models, validators, custom exceptions

**Contains**:
- `TenantBaseModel` — Base model with tenant isolation, timestamps, audit fields
- Custom validators (mobile format, GST, PAN verification)
- Custom exceptions (BusinessLogicException, InvalidOperation)
- Pagination classes for API responses
- Custom renderers for consistent API responses
- Service layer helpers

---

---

## Data Models & Relationships

### Entity Relationship Diagram (Simplified)

```
┌──────────────┐
│ User         │
├──────────────┤
│ id (PK)      │
│ email        │ ─────────────┐
│ role         │              │
│ organization │              │
└──────────────┘              │
       │                       │
       │ assigned_to           │ created_by
       │                       │
       ▼                       ▼
┌──────────────────────────────────────┐
│ Lead                                 │
├──────────────────────────────────────┤
│ id (PK)                              │
│ lead_number (unique)                 │
│ first_name, last_name                │
│ company_name                         │
│ email, mobile                        │
│ status (OPEN, IN_PROGRESS, WON, etc) │
│ stage_id (FK: LeadStage)             │
│ priority (LOW, MEDIUM, HIGH, URGENT) │
│ estimated_value                      │
│ source_id (FK: LeadSource)           │
│ assigned_to_id (FK: User)            │
│ created_at, updated_at               │
└──────────────────────────────────────┘
       │                  │
       │ lead_id          │ lead_id
       │                  │
       ▼                  ▼
┌────────────────┐  ┌──────────────┐
│ Activity       │  │ Appointment  │
├────────────────┤  ├──────────────┤
│ id (PK)        │  │ id (PK)      │
│ lead_id (FK)   │  │ lead_id (FK) │
│ activity_type  │  │ date         │
│ description    │  │ time         │
│ created_by     │  │ purpose      │
│ timestamp      │  │ outcome_id   │
└────────────────┘  └──────────────┘


┌──────────────────────────┐
│ Quotation                │
├──────────────────────────┤
│ id (PK)                  │
│ quotation_number         │
│ lead_id (FK)             │
│ customer_id (FK)         │
│ valid_till               │
│ total_amount             │
│ total_tax                │
│ status (DRAFT, SENT, etc)│
│ created_at               │
└──────────────────────────┘
       │
       │ quotation_id
       ▼
┌──────────────────────────┐
│ QuotationItem            │
├──────────────────────────┤
│ id (PK)                  │
│ quotation_id (FK)        │
│ product_id (FK)          │
│ quantity                 │
│ unit_price               │
│ tax_amount               │
│ line_total               │
└──────────────────────────┘
       │
       └─────────────────────┐
                             │
                             │ can_convert_to
                             ▼
                    ┌──────────────────────────┐
                    │ Order                    │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ order_number             │
                    │ quotation_id (FK, null) │
                    │ customer_id (FK)        │
                    │ order_date               │
                    │ delivery_date            │
                    │ total_amount             │
                    │ payment_status           │
                    │ delivery_status          │
                    └──────────────────────────┘
                             │
                             │ order_id
                             ▼
                    ┌──────────────────────────┐
                    │ OrderItem                │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ order_id (FK)           │
                    │ product_id (FK)         │
                    │ quantity                │
                    │ unit_price              │
                    │ igst_amt, sgst_amt      │
                    │ line_total              │
                    └──────────────────────────┘
                             │
                             │ can_convert_to
                             ▼
                    ┌──────────────────────────┐
                    │ Invoice                  │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ invoice_number           │
                    │ order_id (FK, null)     │
                    │ customer_id (FK)        │
                    │ invoice_date             │
                    │ due_date                 │
                    │ total_with_tax           │
                    │ payment_status           │
                    └──────────────────────────┘
                             │
                             │ invoice_id
                             ▼
                    ┌──────────────────────────┐
                    │ InvoiceItem              │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ invoice_id (FK)         │
                    │ product_id (FK)         │
                    │ quantity                │
                    │ unit_price              │
                    │ igst_amt, sgst_amt      │
                    │ line_total              │
                    └──────────────────────────┘


┌──────────────────────────┐
│ ProductCatalog           │
├──────────────────────────┤
│ id (PK)                  │
│ product_name             │
│ sku                      │
│ category                 │
│ description              │
│ unit_price               │
│ tax_percentage           │
│ at_store (stock qty)     │
│ hsn_code (for GST)       │
│ created_at               │
└──────────────────────────┘


┌──────────────────────────┐
│ PurchaseOrder            │
├──────────────────────────┤
│ id (PK)                  │
│ po_number                │
│ vendor_id (FK: User/Org) │
│ po_date                  │
│ expected_delivery        │
│ total_amount             │
│ status                   │
└──────────────────────────┘
       │
       │ po_id
       ▼
┌──────────────────────────┐
│ PurchaseOrderItem        │
├──────────────────────────┤
│ id (PK)                  │
│ po_id (FK)               │
│ product_id (FK)          │
│ quantity                 │
│ unit_cost                │
│ tax_amount               │
│ line_total               │
└──────────────────────────┘


┌──────────────────────────┐
│ DebitNote                │
├──────────────────────────┤
│ id (PK)                  │
│ debit_note_number        │
│ invoice_id (optional FK) │
│ customer_id (FK)         │
│ reason                   │
│ total_amount             │
│ date                     │
└──────────────────────────┘
       │
       │ debit_note_id
       ▼
┌──────────────────────────┐
│ DebitNoteItem            │
├──────────────────────────┤
│ id (PK)                  │
│ debit_note_id (FK)       │
│ product_id (FK)          │
│ quantity                 │
│ unit_price               │
│ tax_amount               │
│ line_total               │
└──────────────────────────┘


┌──────────────────────────┐
│ Reminder                 │
├──────────────────────────┤
│ id (PK)                  │
│ reminder_text            │
│ reminder_date            │
│ reminder_time            │
│ status (PENDING, SENT)   │
│ assigned_to_id (FK: User)│
│ lead_id (optional FK)    │
│ type (CALL, EMAIL, etc)  │
└──────────────────────────┘
```

### Key Design Patterns

1. **Multi-Tenancy**: All models extend `TenantBaseModel` → automatic organization isolation
2. **Soft Deletes**: `is_deleted` flag instead of actual deletion
3. **Audit Trail**: Every model has `created_at`, `updated_at`, `created_by`, `updated_by`
4. **Document Numbering**: Automatic unique reference numbers (Lead-001, Q-001, etc.)
5. **Status Tracking**: FSM-pattern status fields with allowed transitions
6. **Nested Resources**: Activities under Leads, Items under Quotations/Orders

---

## API Structure & Endpoints

### Base URL
```
Development:  http://localhost:8000
Production:   https://api.greenedge.com
```

### Authentication
All API requests require JWT token in header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Endpoints
```
POST   /api/v1/auth/login/
  Request:  { "email": "user@company.com", "password": "..." }
  Response: { "access": "...", "refresh": "..." }

POST   /api/v1/auth/refresh/
  Request:  { "refresh": "..." }
  Response: { "access": "..." }

POST   /api/v1/auth/logout/
  Request:  { "refresh": "..." }
  Response: { "status": "success" }
```

### Response Format (JSON)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com"
  },
  "message": "Lead created successfully"
}
```

### Error Response
```json
{
  "success": false,
  "errors": {
    "email": ["This email is already registered."],
    "mobile": ["Invalid mobile format."]
  },
  "message": "Validation failed"
}
```

### Pagination
```
GET /api/v1/crm/leads/?page=1&page_size=20

Response:
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/crm/leads/?page=2",
  "previous": null,
  "results": [...]
}
```

### Filtering
```
GET /api/v1/crm/leads/?status=open&priority=high&assigned_to=5

GET /api/v1/crm/leads/?created_at__gte=2024-01-01&created_at__lte=2024-12-31

GET /api/v1/crm/leads/?order_by=-estimated_value
```

### API Documentation
```
Interactive Swagger UI:  http://localhost:8000/api/docs/
OpenAPI Schema:          http://localhost:8000/api/schema/
```

---

## Data Flow & Workflows

### Workflow 1: Lead to Invoice (Complete Sales Journey)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Lead Capture & Qualification                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend → POST /api/v1/crm/leads/                             │
│            | name, email, mobile, company, estimated_value      │
│            |                                                    │
│            ▼                                                    │
│  Backend  → Validate input (mobile format, email)               │
│            → Generate unique lead_number (sequence service)     │
│            → Create Lead object in DB                           │
│            → Create first Activity log                          │
│            → Emit WebSocket event "lead.created"                │
│            → Send welcome email (Celery task)                   │
│            |                                                    │
│            ▼                                                    │
│  Response → { "id": 1, "lead_number": "L-001", ... }           │
│                                                                 │
│  Frontend → Display new lead on dashboard                       │
│            → Trigger real-time notification                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ⬇
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Lead Interaction & Activities                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sales User → Schedule appointment & log call notes             │
│             → POST /api/v1/crm/leads/1/activities/              │
│               { type: "call", description: "...", outcome: "..." }    │
│             |                                                  │
│             ▼                                                  │
│  Backend  → Create Activity record                              │
│            → Update Lead status to "IN_PROGRESS"                │
│            → Create Reminder for next follow-up                 │
│            → Emit real-time activity update                     │
│            |                                                   │
│            ▼ (async: Celery task)                               │
│            → Send internal notification to team                 │
│            → Log to activity stream                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ⬇
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Create & Send Quotation                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sales User → Select products from catalog                      │
│             → Define quantities and pricing                     │
│             → POST /api/v1/crm/quotations/                      │
│               { lead_id: 1, items: [...], valid_till: "..." }   │
│             |                                                  │
│             ▼                                                  │
│  Backend  → Validate items exist in ProductCatalog              │
│            → Calculate item totals & apply taxes (GST)          │
│            → Generate unique quotation_number                   │
│            → Auto-calculate: SGST + IGST + total               │
│            → Create Quotation + QuotationItems in DB            │
│            → Create Activity log                                │
│            |                                                   │
│            ▼ (async: Celery task)                               │
│            → Generate PDF document                              │
│            → Send quotation via email to lead                   │
│            → Emit real-time notification                        │
│                                                                 │
│  Frontend → Show quotation preview                              │
│            → Option to download PDF                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ⬇
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Lead Conversion & Order Creation                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sales User → Lead accepted quotation (verbally/email)          │
│             → PUT /api/v1/crm/leads/1/
│               { status: "won" }                                 │
│             |                                                  │
│             ▼                                                  │
│  Backend  → Update Lead status to "WON"                         │
│            → Create Customer record (if new)                    │
│            → POST /api/v1/crm/quotations/1/convert/             │
│             → Convert Quotation to Order                        │
│            → Copy all items with same pricing                   │
│            → Create Order with status "PENDING"                 │
│            → Link Order → Quotation                             │
│            → Create audit trail                                 │
│            |                                                   │
│            ▼ (async: Celery task)                               │
│            → Generate order confirmation                        │
│            → Send to customer email                             │
│            → Create internal fulfillment task                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ⬇
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Invoice Generation                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Fulfillment User → Order ready for billing                     │
│                  → PUT /api/v1/crm/orders/1/
│                    { delivery_status: "completed" }             │
│                  |                                             │
│                  ▼                                             │
│  Backend       → Update Order status                            │
│                → Create Invoice from Order                      │
│                → POST /api/v1/crm/invoices/                     │
│                  { order_id: 1, invoice_date: "..." }           │
│                |                                              │
│                ▼                                              │
│  Backend (Invoice) → Copy all OrderItems to InvoiceItems        │
│                    → Generate unique invoice_number             │
│                    → Recalculate taxes for compliance check      │
│                    → Apply Debit notes if any returns           │
│                    → Calculate final amount due                 │
│                    → Save to DB with status "DRAFT"             │
│                    |                                           │
│                    ▼ (async: Celery task)                       │
│                    → Generate GST-compliant PDF invoice         │
│                    → Send to customer email                     │
│                    → Add payment reminder scheduled task        │
│                    → Send internal accounting notification      │
│                    → Create revenue entry for dashboard         │
│                                                                 │
│  Frontend       → Show invoice details & PDF                    │
│                → Payment tracking interface                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ⬇
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Analytics & Reporting (Real-time Dashboard)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard Service → Aggregates data asynchronously             │
│                   → GET /api/v1/dashboard/metrics/              │
│                   |                                            │
│                   ▼                                            │
│  Backend         → SQL queries aggregating:                     │
│                   • Total leads this month                      │
│                   • Conversion rate (Lead → Order)              │
│                   • Pipeline stage distribution                 │
│                   • Revenue by product/customer                 │
│                   • Team performance metrics                    │
│                   |                                            │
│                   ▼ (cached in Redis)                           │
│                   → Return aggregated metrics                   │
│                                                                 │
│  Frontend       → Display on KPI cards                         │
│                → Real-time charts (Recharts)                   │
│                → Drill-down capabilities                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow 2: Return/Adjustment (Debit Note Flow)

```
POST /api/v1/crm/invoices/5/debit-note/
{
  "reason": "Product damaged during transit",
  "items": [
    { "product_id": 10, "qty": 2, "unit_price": 500, "tax": 10% }
  ]
}
         ⬇
Backend: Generate unique debit_note_number
         Calculate total & tax
         Create DebitNote + DebitNoteItems
         Update Invoice: deductible_amount
         Create Activity log
         Email to customer
         Update Dashboard revenue metrics
```

### Workflow 3: Async Task Processing (Celery)

```
Main Thread (Django)          Celery Worker
───────────────────────      ────────────────
1. API Request                
   ├─ Validate                
   ├─ Create DB record        
   └─ Queue Celery task ────→ 2. Worker picks up task
                              ├─ Generate PDF
                              ├─ Send email
                              ├─ Update status
                              └─ Log completion
3. Return 202 Accepted    ←─── 4. Task complete
   to Frontend
```

---

## Authentication & Authorization

### JWT Token Flow

1. **Login Request**
```
POST /api/v1/auth/login/
{
  "email": "john@company.com",
  "password": "securepassword123"
}
```

2. **Server Response**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

3. **Token Usage in Requests**
```http
GET /api/v1/users/1/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Token Refresh**
```
POST /api/v1/auth/refresh/
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Response:
{
  "access": "new_access_token..."
}
```

5. **Logout (Token Blacklist)**
```
POST /api/v1/auth/logout/
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Role-Based Access Control (RBAC)

**Roles Hierarchy:**
```
┌─────────────────┐
│ Super Admin     │  → Full access, Multi-org management
└─────────────────┘
         △
         │
┌─────────────────┐
│ Admin           │  → Organization management, User management, Reports
└─────────────────┘
         △
         │
┌────────────────────────────────────────┐
├─ Manager                               │  → Team management, Approval workflow
├─ Sales Executive                       │  → Lead/Quote/Order management
├─ Support Executive                     │  → Customer support, Ticket handling
├─ Finance Manager                       │  → Invoice, Payment, Financial reports
└─ Accountant                            │  → Invoice review, Accounting reconciliation
└────────────────────────────────────────┘
```

**Permission System:**
- Each role has a set of permissions (e.g., `add_lead`, `change_lead`, `delete_lead`)
- Views check permissions using `@permission_required` decorator
- API returns 403 Forbidden if user lacks permission
- Multi-tenant isolation: User can only access data from their organization

### Data Isolation

```python
# Every query is automatically filtered by tenant
leads = Lead.objects.filter(tenant=request.user.organization)
# ✓ Even if a malicious user tries to query, they'll only see their org's data
```

---

## Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- Git

### Backend Setup

1. **Clone Repository**
```bash
git clone <repo-url>
cd GreenEdge\ CRM/backend
```

2. **Create Virtual Environment**
```bash
python -m venv venv
source venv/Scripts/activate  # Windows
# or
source venv/bin/activate      # Linux/Mac
```

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Setup Environment Variables**
```bash
cp .env.example .env
# Edit .env with your configurations:
# SECRET_KEY=your-secret-key
# DATABASE_URL=postgres://user:pass@localhost:5432/greenedge
# DEBUG=True
```

5. **Database Setup**
```bash
python manage.py migrate
python manage.py create_default_roles
python manage.py seed_test_data  # Optional: Add sample data
```

6. **Create Superuser**
```bash
python manage.py createsuperuser
```

7. **Run Development Server**
```bash
python manage.py runserver
# or with Daphne (WebSocket support)
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

8. **Start Celery Worker** (separate terminal)
```bash
celery -A core worker -l info
```

9. **API Documentation**
Visit: `http://localhost:8000/api/docs/`

### Frontend Setup

1. **Navigate to Frontend**
```bash
cd ../frontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Environment Variables**
```bash
cp .env.example .env.local
# Edit with:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. **Run Development Server**
```bash
npm run dev
# Access: http://localhost:3000
```

### Docker Deployment

1. **Build & Run Containers**
```bash
docker-compose up -d
```

2. **Run Migrations**
```bash
docker-compose exec backend python manage.py migrate
```

3. **Access Services**
```
Frontend:    http://localhost:3000
Backend:     http://localhost:8000
API Docs:    http://localhost:8000/api/docs/
Redis CLI:   localhost:6379
```

### Common Development Commands

```bash
# Create new Django app
python manage.py startapp <app_name>

# Generate migration for model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Access Django shell
python manage.py shell

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic

# Generate API schema
python manage.py spectacular --file schema.yml
```

---

## Key Architectural Decisions

1. **Multi-Tenant by Default** — Isolate data for different organizations at DB level
2. **Async Tasks** — Heavy operations (email, PDF) run in background with Celery
3. **REST API** — Language-agnostic, mobile-friendly, easy to scale
4. **JWT Authentication** — Stateless, scalable, mobile-first approach
5. **PostgreSQL** — Relational data, strong ACID guarantees, JSON support
6. **Django ORM** — Reduce SQL injection risks, cleaner code, migration support
7. **Next.js** — Server-side rendering, SEO, full-stack TypeScript
8. **Nested Routers** — Intuitive API paths (e.g., `/leads/1/activities/`)
9. **Soft Deletes** — Maintain data audit trail and recovery capability
10. **Status FSM** — Prevent invalid state transitions (e.g., delivered → draft is invalid)

---

## Conclusion

GreenEdge CRM is a **production-ready, scalable, multi-tenant ERP & CRM platform** built with modern technologies. Every design decision prioritizes:
- **Data Security** — Multi-tenant isolation, RBAC, JWT authentication
- **Scalability** — Async tasks, database indexing, API pagination
- **Developer Experience** — Clear folder structure, consistent patterns, auto-docs
- **User Experience** — Real-time notifications, responsive UI, fast interactions

This document serves as the complete technical reference for developers onboarding to the project.

---

**Document Version**: 1.0
**Last Updated**: August 1, 2026
**Maintained By**: GreenEdge Development Team
