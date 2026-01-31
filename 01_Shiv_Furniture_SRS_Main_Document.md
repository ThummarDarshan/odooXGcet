# Software Requirements Specification (SRS)
# Shiv Furniture Budget Accounting System

**Document Version:** 1.0  
**Date:** January 31, 2026  
**Client:** Shiv Furniture  
**Project Type:** Full-Stack Web Application

---

## Executive Summary

This SRS document provides complete technical specifications for developing the Shiv Furniture Budget Accounting System - a web-based application for managing purchases, sales, budgets, and financial monitoring with cost-center tracking.

**Technology Stack:**
- **Frontend:** React + Redux + Material-UI/Ant Design
- **Backend:** Node.js + Express.js + Prisma ORM
- **Database:** PostgreSQL (Neon Console)
- **Storage:** Cloudinary (Images)
- **Payments:** Razorpay Integration

**Key Features:**
- Master data management (Contacts, Products, Cost Centers, Budgets)
- Complete transaction lifecycle (PO → Bills, SO → Invoices → Payments)
- Budget vs Actual monitoring with visual reports
- Customer portal with online payment capability
- Automated analytical account assignment

---

## Table of Contents

1. [Business Requirements](#1-business-requirements)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [User Roles & Access Control](#4-user-roles--access-control)
5. [Core Functional Requirements](#5-core-functional-requirements)
6. [Database Design](#6-database-design)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Integration Requirements](#8-integration-requirements)

---

## 1. Business Requirements

### 1.1 Business Problem

Shiv Furniture currently faces these challenges:
1. **No centralized financial tracking** - Transactions scattered across different systems
2. **Budget monitoring gaps** - Manual tracking of budget vs actual spending
3. **Cost center visibility** - Unable to track expenses by business activity
4. **Payment reconciliation** - Manual effort to match payments with invoices
5. **Customer access** - Customers cannot view or pay invoices online

### 1.2 Solution Overview

The Budget Accounting System provides:

**Master Data Management**
- Unified contact database for customers and vendors
- Product catalog with pricing
- Analytical accounts (cost centers) for activity tracking
- Budget definitions with period-based planning
- Auto-assignment rules for analytical accounts

**Transaction Processing**
- Purchase Orders → Vendor Bills → Payments (purchase cycle)
- Sales Orders → Customer Invoices → Payments (sales cycle)
- Automatic analytical account linking
- Multi-invoice payment allocation

**Budget Monitoring**
- Real-time budget vs actual computation
- Achievement percentage tracking
- Variance analysis and remaining balance
- Visual charts and detailed reports
- Budget revision tracking with history

**Customer Portal**
- Secure login for customers/vendors
- View and download invoices/bills
- Online payment via Razorpay
- Transaction history

### 1.3 Success Criteria

1. **Operational Efficiency**
   - 80% reduction in manual budget tracking time
   - Real-time budget visibility for all cost centers
   - Automated analytical account assignment (90%+ accuracy)

2. **Financial Control**
   - 100% transaction linkage to cost centers
   - Complete audit trail for all financial operations
   - Accurate budget vs actual reports available on-demand

3. **Customer Satisfaction**
   - Customer portal adoption rate > 60%
   - Online payment usage > 40% of total payments
   - Invoice download capability reducing support requests

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────── PRESENTATION LAYER ────────────────────────────┐
│                                                                              │
│   ┌──────────────────┐           ┌──────────────────┐                      │
│   │  Admin Dashboard │           │  Customer Portal  │                      │
│   │   (React SPA)    │           │   (React SPA)     │                      │
│   │                  │           │                   │                      │
│   │  - Master Data   │           │  - View Invoices  │                      │
│   │  - Transactions  │           │  - Download PDFs  │                      │
│   │  - Budgets       │           │  - Make Payments  │                      │
│   │  - Reports       │           │  - View History   │                      │
│   └────────┬─────────┘           └─────────┬─────────┘                      │
│            │                               │                                │
└────────────┼───────────────────────────────┼────────────────────────────────┘
             │                               │
             └───────────────┬───────────────┘
                             │
                     HTTPS/JSON over REST
                             │
             ┌───────────────▼───────────────┐
             │       API GATEWAY             │
             │      (Express.js)             │
             │                               │
             │  - Authentication (JWT)       │
             │  - Authorization (RBAC)       │
             │  - Request Validation         │
             │  - Rate Limiting              │
             │  - Error Handling             │
             └───────────────┬───────────────┘
                             │
┌──────────────────────────── APPLICATION LAYER ─────────────────────────────┐
│                             │                                               │
│    ┌────────────┬───────────┼───────────┬─────────────┐                    │
│    │            │           │           │             │                    │
│    ▼            ▼           ▼           ▼             ▼                    │
│ ┌──────┐  ┌──────────┐ ┌──────────┐ ┌───────┐  ┌──────────┐             │
│ │ Auth │  │  Master  │ │Transaction│ │Budget │  │ Payment  │             │
│ │Service│  │   Data   │ │ Service  │ │Service│  │ Service  │             │
│ │      │  │  Service │ │          │ │       │  │          │             │
│ └───┬──┘  └────┬─────┘ └────┬─────┘ └───┬───┘  └────┬─────┘             │
│     │          │            │           │           │                     │
│     └──────────┴────────────┴───────────┴───────────┘                     │
│                             │                                               │
│                             │                                               │
│                    ┌────────▼────────┐                                     │
│                    │  Prisma ORM     │                                     │
│                    │  (Data Access)  │                                     │
│                    └────────┬────────┘                                     │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
┌──────────────────────────── DATA LAYER ─────────────────────────────────────┐
│                             │                                                │
│         ┌───────────────────┼───────────────────┐                           │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│  │ PostgreSQL  │    │ Cloudinary  │    │  Razorpay   │                    │
│  │   (Neon)    │    │   (Images)  │    │ (Payments)  │                    │
│  │             │    │             │    │             │                    │
│  │ - Users     │    │ - Product   │    │ - Orders    │                    │
│  │ - Contacts  │    │   Images    │    │ - Payments  │                    │
│  │ - Products  │    │ - Contact   │    │ - Webhooks  │                    │
│  │ - Budgets   │    │   Photos    │    │             │                    │
│  │ - Txns      │    │             │    │             │                    │
│  └─────────────┘    └─────────────┘    └─────────────┘                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction Flow

**Example: Customer Makes Payment**

```
1. Customer Portal (React)
   ↓ Click "Pay Invoice"
   
2. Frontend Service
   ↓ POST /api/payments/razorpay/create-order
   
3. Payment Service (Backend)
   ↓ Create Razorpay Order
   
4. Razorpay API
   ↓ Return order_id
   
5. Frontend
   ↓ Open Razorpay Checkout Modal
   
6. Customer
   ↓ Complete Payment
   
7. Razorpay
   ↓ Callback with payment_id
   
8. Frontend
   ↓ POST /api/payments/razorpay/verify
   
9. Payment Service
   ↓ Verify Signature
   ↓ Create Payment Record
   ↓ Update Invoice Payment Status
   ↓ Create Payment Allocation
   
10. Database
    ↓ Persist Payment Data
    
11. Frontend
    ↓ Show Success Message
    ↓ Refresh Invoice Status
```

### 2.3 Data Flow Patterns

**Pattern 1: Transaction Creation with Auto Analytical Account**

```
User creates Vendor Bill
  → Backend receives line items with product info
  → Auto Model Service evaluates rules in priority order
  → Finds matching rule (e.g., product category = "Wood")
  → Assigns analytical account "Production"
  → Saves bill with analytical account linkage
  → Returns complete bill to frontend
```

**Pattern 2: Budget vs Actual Calculation**

```
User requests Budget Report
  → Backend fetches active budgets for date range
  → For each budget:
      → Get analytical account
      → Query journal entries (POSTED status) for:
          - Same analytical account
          - Date within budget period
      → Sum debit amounts (expenses)
      → Sum credit amounts (income)
      → Calculate: Net = Income - Expense
      → Calculate: Variance = Net - Budgeted Amount
      → Calculate: Achievement % = (Net / Budgeted) × 100
      → Calculate: Remaining = Budgeted - Net
  → Return aggregated results
  → Frontend renders charts and tables
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies

**Core Framework**
```
React 18.2+
├── React Router v6 (Navigation)
├── Redux Toolkit (State Management)
└── Axios (HTTP Client)
```

**UI Framework Options**
```
Option 1: Material-UI (MUI)
- Modern, comprehensive component library
- Built-in theming
- Good accessibility

Option 2: Ant Design
- Enterprise-grade UI
- Rich component set
- Strong table/form components
```

**Additional Libraries**
```javascript
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.49.0",
    "@mui/material": "^5.15.0",  // or antd
    "@mui/icons-material": "^5.15.0",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### 3.2 Backend Technologies

**Core Framework**
```
Node.js 18+
├── Express.js 4.18+ (Web Framework)
├── Prisma 5.7+ (ORM)
└── PostgreSQL 15+ (Database)
```

**Essential Packages**
```javascript
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "razorpay": "^2.9.2",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "prisma": "^5.7.0",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

### 3.3 Database: PostgreSQL via Neon

**Why PostgreSQL?**
- ACID compliance for financial data
- Strong relationship support
- JSON support for flexible fields
- Excellent performance with proper indexing

**Why Neon?**
- Serverless PostgreSQL (auto-scaling)
- Built-in connection pooling
- Automatic backups
- Branch-based development
- Cost-effective for startups

**Connection Configuration**
```javascript
// .env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

// Prisma connection pooling
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations
}
```

### 3.4 Third-Party Integrations

**Cloudinary (Image Management)**
```javascript
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Usage
- Product images: /shiv-furniture/products/{product_id}
- Contact photos: /shiv-furniture/contacts/{contact_id}
- Invoice attachments: /shiv-furniture/invoices/{invoice_id}
```

**Razorpay (Payment Gateway)**
```javascript
// Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Features Used
- Orders API (create payment orders)
- Payments API (verify payments)
- Webhooks (payment status updates)
- Refunds API (handle refunds if needed)
```

---

## 4. User Roles & Access Control

### 4.1 Role Definitions

**ADMIN (Business Owner)**

Access Level: Full System Access

Capabilities:
```
Master Data:
  ✓ Create, Read, Update, Archive all master data
  ✓ Manage contacts (customers/vendors)
  ✓ Manage products
  ✓ Manage analytical accounts (cost centers)
  ✓ Manage budgets
  ✓ Configure auto analytical models

Transactions:
  ✓ Create purchase orders
  ✓ Record vendor bills
  ✓ Create sales orders  
  ✓ Generate customer invoices
  ✓ Record all payments
  ✓ Allocate payments to invoices

Budgets & Reports:
  ✓ View all budget reports
  ✓ Generate budget vs actual analysis
  ✓ Access all financial reports
  ✓ Export data
  ✓ Revise budgets

System:
  ✓ Manage user accounts
  ✓ Configure system settings
  ✓ View audit logs
```

**PORTAL_USER (Customer/Vendor)**

Access Level: Limited Portal Access

Capabilities:
```
View Own Data:
  ✓ View own invoices/bills
  ✓ View own sales orders/purchase orders
  ✓ View payment history

Actions:
  ✓ Download invoice PDFs
  ✓ Make online payments (customers only)
  ✓ View payment receipts

Restrictions:
  ✗ Cannot view other users' data
  ✗ Cannot access admin functions
  ✗ Cannot view master data
  ✗ Cannot view budgets or reports
  ✗ Cannot create transactions
```

### 4.2 Permission Matrix

| Feature | Admin | Portal User |
|---------|-------|-------------|
| Dashboard - Full | ✓ | ✗ |
| Dashboard - Personal | ✓ | ✓ |
| Contacts - Manage | ✓ | ✗ |
| Products - Manage | ✓ | ✗ |
| Analytical Accounts | ✓ | ✗ |
| Budgets - Manage | ✓ | ✗ |
| Auto Models | ✓ | ✗ |
| Purchase Orders - Create | ✓ | ✗ |
| Vendor Bills - Create | ✓ | ✗ |
| Sales Orders - Create | ✓ | ✗ |
| Customer Invoices - Create | ✓ | ✗ |
| Invoices - View Own | ✓ | ✓ |
| Invoices - Download | ✓ | ✓ |
| Payments - Record | ✓ | ✗ |
| Payments - Make Online | ✓ | ✓ |
| Reports - All | ✓ | ✗ |
| Reports - Personal | ✓ | ✓ |
| Users - Manage | ✓ | ✗ |
| Settings | ✓ | ✗ |

### 4.3 Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────┐
│  Auth Service   │
└─────────┬───────┘
          │
          │ 2. Verify credentials
          │    (bcrypt compare)
          ▼
┌──────────────────┐
│    Database      │
│  Find user by    │
│  email, check    │
│  password_hash   │
└─────────┬────────┘
          │
          │ 3. User found & verified
          ▼
┌─────────────────┐
│  Generate JWT   │
│  payload: {     │
│    userId,      │
│    email,       │
│    role         │
│  }              │
│  expires: 24h   │
└─────────┬───────┘
          │
          │ 4. Return token
          ▼
┌─────────────────┐
│   Frontend      │
│   Store token   │
│   in localStorage│
└─────────────────┘

Subsequent Requests:
┌─────────────┐
│   Browser   │
│   Headers:  │
│   Authorization:│
│   Bearer {token}│
└──────┬──────┘
       │
       │ Request with token
       ▼
┌─────────────────┐
│  Auth Middleware│
│  1. Extract token│
│  2. Verify JWT   │
│  3. Decode payload│
│  4. Attach user  │
│     to req.user  │
└─────────┬───────┘
          │
          │ req.user = { userId, email, role }
          ▼
┌─────────────────┐
│ Role Middleware │
│ Check if role   │
│ is authorized   │
└─────────┬───────┘
          │
          │ Authorized
          ▼
┌─────────────────┐
│    Controller   │
│   Process req   │
└─────────────────┘
```

---

## 5. Core Functional Requirements

### 5.1 Master Data Management

#### 5.1.1 Contact Management

**FR-CONTACT-001: Create Contact**

Description: Admin can create customer, vendor, or dual-type contacts

Input Fields:
- Type: CUSTOMER | VENDOR | BOTH (required)
- Name: string (required, max 255 chars)
- Email: string (optional, must be valid email format)
- Phone: string (optional, max 20 chars)
- Address: text (optional)
- Tax ID: string (optional, e.g., GST number)
- Image: file (optional, upload to Cloudinary)
- Link to User: boolean (create portal access)

Business Rules:
1. If "Link to User" is true:
   - Create user account with role PORTAL_USER
   - Email becomes required
   - Send welcome email with login credentials
2. Email must be unique if provided
3. Image upload: max 5MB, formats: jpg, png, webp

Validation:
```javascript
{
  type: Joi.string().valid('CUSTOMER', 'VENDOR', 'BOTH').required(),
  name: Joi.string().max(255).required(),
  email: Joi.string().email().when('create_user', { 
    is: true, 
    then: Joi.required() 
  }),
  phone: Joi.string().max(20).optional(),
  address: Joi.string().optional(),
  tax_id: Joi.string().max(50).optional(),
  create_user: Joi.boolean().default(false)
}
```

Success Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "CUSTOMER",
    "name": "ABC Furniture Store",
    "email": "abc@example.com",
    "phone": "+91-9876543210",
    "image_url": "https://res.cloudinary.com/...",
    "user_id": "uuid (if created)",
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

**FR-CONTACT-002: List Contacts**

Filters:
- Type: CUSTOMER | VENDOR | BOTH
- Search: name, email, phone (partial match)
- Status: active | archived
- Has User Account: true | false

Pagination:
- Page: default 1
- Limit: default 20, max 100

Sort:
- Fields: name, created_at, updated_at
- Order: asc | desc

Response:
```json
{
  "success": true,
  "data": [...contacts],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**FR-CONTACT-003: Update Contact**

Rules:
- Cannot change type if transactions exist
- Cannot unlink user if portal login exists
- Email change requires uniqueness check

**FR-CONTACT-004: Archive Contact**

Rules:
- Soft delete (set is_active = false)
- Cannot archive if:
  - Has unpaid invoices/bills
  - Has active purchase/sales orders
- Can be restored later

#### 5.1.2 Product Management

**FR-PRODUCT-001: Create Product**

Input Fields:
- Name: string (required, max 255)
- Description: text (optional)
- SKU: string (optional, auto-generated if empty)
- Category: string (optional, max 100)
- Unit Price: decimal (required, min 0.01)
- Cost Price: decimal (optional, min 0)
- Image: file (optional, upload to Cloudinary)

SKU Auto-generation Logic:
```javascript
// Format: PRD-YYYYMMDD-XXXX
// Example: PRD-20260131-0001

const generateSKU = async () => {
  const date = format(new Date(), 'yyyyMMdd');
  const count = await prisma.product.count({
    where: {
      sku: { startsWith: `PRD-${date}` }
    }
  });
  const sequence = (count + 1).toString().padStart(4, '0');
  return `PRD-${date}-${sequence}`;
};
```

Validation:
```javascript
{
  name: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  sku: Joi.string().max(100).optional(),
  category: Joi.string().max(100).optional(),
  unit_price: Joi.number().positive().precision(2).required(),
  cost_price: Joi.number().min(0).precision(2).optional()
}
```

#### 5.1.3 Analytical Account (Cost Center) Management

**FR-ANALYTICAL-001: Create Analytical Account**

Purpose: Track WHERE money is spent, not WHAT it's spent on

Examples:
- Marketing → Furniture Expo 2026
- Production → Factory A
- Sales → Region North
- R&D → Product Development

Input Fields:
- Code: string (required, unique, max 50)
- Name: string (required, max 255)
- Description: text (optional)
- Parent Account: UUID (optional, creates hierarchy)

Validation:
```javascript
{
  code: Joi.string().max(50).regex(/^[A-Z0-9-]+$/).required(),
  name: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  parent_id: Joi.string().uuid().optional()
}
```

Business Rules:
1. Code must be uppercase alphanumeric with hyphens
2. Cannot create circular hierarchy (A → B → A)
3. Maximum hierarchy depth: 5 levels
4. Cannot delete if budgets or transactions linked

Hierarchy Example:
```
MARKETING (parent)
├── MARKETING-EXPO-2026 (child)
├── MARKETING-DIGITAL (child)
└── MARKETING-PRINT (child)
```

**FR-ANALYTICAL-002: Analytical Account Hierarchy**

Features:
- Tree view display
- Drag-and-drop to change parent
- Roll-up reporting (sum child values)
- Breadcrumb navigation

### 5.2 Budget Management

#### 5.2.1 Budget Creation

**FR-BUDGET-001: Create Budget**

Input Fields:
- Name: string (required)
- Analytical Account: UUID (required)
- Start Date: date (required)
- End Date: date (required, must be after start date)
- Budgeted Amount: decimal (required, positive)
- Description: text (optional)

Validation:
```javascript
{
  name: Joi.string().max(255).required(),
  analytical_account_id: Joi.string().uuid().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().greater(Joi.ref('start_date')).required(),
  budgeted_amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().optional()
}
```

Business Rules:
1. No overlapping ACTIVE budgets for same analytical account
2. Initial status: DRAFT
3. Must activate budget before monitoring
4. Can have multiple budgets for same account if periods don't overlap

**FR-BUDGET-002: Budget Lifecycle**

State Transitions:
```
DRAFT → ACTIVE → CLOSED
  ↓       ↓
  ↓    REVISED (when new version created)
  ↓
CANCELLED (if deleted before activation)
```

Actions:
- **Activate**: DRAFT → ACTIVE
  - Validates no overlapping budgets
  - Locks analytical account (cannot be archived)
  
- **Close**: ACTIVE → CLOSED
  - Manual closure or auto-close after end date
  - Prevents new transactions from affecting it
  
- **Revise**: ACTIVE → REVISED, creates new budget
  - Links to original via parent_budget_id
  - Increments revision_number
  - Original budget marked as REVISED

**FR-BUDGET-003: Budget Revision**

When to Revise:
- Market conditions change
- Business strategy shifts
- Unexpected expenses/income
- Quarterly/mid-year adjustments

Revision Process:
1. User clicks "Revise Budget" on active budget
2. System creates new budget:
   - Copies all fields from original
   - Sets parent_budget_id = original budget id
   - Sets revision_number = original.revision_number + 1
   - Status = DRAFT
3. Original budget status → REVISED
4. User can modify new budget and activate

Revision History:
```
Budget: Marketing 2026
├── V1 (REVISED) - Jan-Dec 2026, ₹100,000
│   └── Created: Jan 1, 2026
├── V2 (REVISED) - Jan-Dec 2026, ₹120,000
│   └── Created: Apr 1, 2026 (mid-year adjustment)
└── V3 (ACTIVE) - Jan-Dec 2026, ₹150,000
    └── Created: Jul 1, 2026 (final revision)
```

### 5.3 Auto Analytical Model Configuration

**FR-AUTOMODEL-001: Create Auto Model**

Purpose: Automatically assign analytical accounts to transaction line items based on rules

Input Fields:
- Name: string (required, max 255)
- Priority: integer (default 10, higher = evaluated first)
- Analytical Account: UUID (required, the account to assign)
- Rule Type: enum (required)
  - PRODUCT_CATEGORY
  - CONTACT
  - AMOUNT_RANGE
  - CUSTOM
- Rule Condition: JSON object (required, structure depends on rule type)

Rule Type Examples:

**1. PRODUCT_CATEGORY**
```json
{
  "rule_type": "PRODUCT_CATEGORY",
  "rule_condition": {
    "product_category": "Wood Furniture"
  }
}
// Matches: Any line item with product.category = "Wood Furniture"
```

**2. CONTACT**
```json
{
  "rule_type": "CONTACT",
  "rule_condition": {
    "contact_id": "uuid-of-specific-vendor"
  }
}
// Matches: Any transaction with this specific vendor
```

**3. AMOUNT_RANGE**
```json
{
  "rule_type": "AMOUNT_RANGE",
  "rule_condition": {
    "min_amount": 10000,
    "max_amount": 50000
  }
}
// Matches: Line items with amount between 10,000 and 50,000
```

**4. CUSTOM**
```json
{
  "rule_type": "CUSTOM",
  "rule_condition": {
    "field": "product.name",
    "operator": "contains",
    "value": "Teak"
  }
}
// Matches: Products with "Teak" in name
```

Evaluation Order:
```
Priority 100: Specific vendor rule
Priority 50:  Product category rule
Priority 10:  Amount range rule
Priority 1:   Default fallback rule
```

Evaluation Process:
```javascript
// When creating a vendor bill line item
const item = {
  product_id: "uuid",
  product: { name: "Teak Chair", category: "Wood Furniture" },
  vendor_id: "uuid",
  amount: 15000
};

// Backend evaluates all active auto models
// Returns first match based on priority
const analyticalAccountId = await autoModelService.applyAutoModels(item);

// Assigns to line item
item.analytical_account_id = analyticalAccountId;
```

### 5.4 Transaction Processing

#### 5.4.1 Purchase Order Workflow

**FR-PO-001: Create Purchase Order**

Input:
```json
{
  "vendor_id": "uuid",
  "order_date": "2026-01-31",
  "expected_delivery_date": "2026-02-15",
  "notes": "Optional notes",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 10,
      "unit_price": 5000,
      "tax_rate": 18,
      "analytical_account_id": "uuid (optional, auto-assigned if empty)"
    }
  ]
}
```

Backend Processing:
1. Validate vendor exists and is active
2. For each line item:
   - Validate product exists
   - If analytical_account_id empty, apply auto models
   - Calculate: tax_amount = (quantity × unit_price) × (tax_rate / 100)
   - Calculate: total_amount = (quantity × unit_price) + tax_amount
3. Calculate PO totals:
   - subtotal = sum of (quantity × unit_price)
   - tax_amount = sum of all item tax amounts
   - total_amount = subtotal + tax_amount
4. Generate PO number: PO-YYYY-MM-XXXXX
5. Set status = DRAFT
6. Save to database

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "po_number": "PO-2026-01-00001",
    "vendor": {
      "id": "uuid",
      "name": "Vendor Name"
    },
    "order_date": "2026-01-31",
    "status": "DRAFT",
    "subtotal": 50000,
    "tax_amount": 9000,
    "total_amount": 59000,
    "items": [...]
  }
}
```

**FR-PO-002: Confirm Purchase Order**

Action: DRAFT → CONFIRMED

Process:
1. Validate PO exists and status = DRAFT
2. Update status = CONFIRMED
3. Lock PO (no more edits allowed)
4. Optional: Send PO email to vendor
5. Optional: Generate PDF

**FR-PO-003: Convert PO to Vendor Bill**

Process:
1. Validate PO exists and status = CONFIRMED
2. Create new vendor bill:
   - Copy all PO fields
   - Set purchase_order_id = PO id (link)
   - Copy all line items with analytical accounts
   - Set bill_date = today
   - Set due_date = today + 30 days (or configurable)
   - Set status = DRAFT
   - Generate bill_number: BILL-YYYY-MM-XXXXX
3. Return created bill

#### 5.4.2 Vendor Bill Workflow

**FR-BILL-001: Post Vendor Bill**

Action: DRAFT → POSTED

Business Logic:
1. Validate bill status = DRAFT
2. Update status = POSTED
3. Create journal entries for budget tracking:

For each line item with analytical_account_id:
```javascript
await prisma.journalEntry.create({
  entry_number: `JE-${timestamp}-${random}`,
  entry_date: bill.bill_date,
  entry_type: 'PURCHASE',
  reference_type: 'VENDOR_BILL',
  reference_id: bill.id,
  analytical_account_id: item.analytical_account_id,
  debit_amount: item.total_amount,  // Expense increases
  credit_amount: 0,
  description: `Vendor Bill ${bill.bill_number} - ${item.product.name}`,
  status: 'POSTED'
});
```

4. These journal entries are used for budget vs actual calculations

**FR-BILL-002: Record Payment Against Bill**

See Payment Processing section

#### 5.4.3 Sales Order to Customer Invoice Workflow

**FR-SO-001: Create Sales Order**

Similar to Purchase Order but for sales:
- Select customer instead of vendor
- Use selling prices
- Status: DRAFT → CONFIRMED → DELIVERED

**FR-INVOICE-001: Post Customer Invoice**

Action: DRAFT → POSTED

Business Logic:
1. Update status = POSTED
2. Create journal entries:

For each line item with analytical_account_id:
```javascript
await prisma.journalEntry.create({
  entry_number: `JE-${timestamp}-${random}`,
  entry_date: invoice.invoice_date,
  entry_type: 'SALE',
  reference_type: 'CUSTOMER_INVOICE',
  reference_id: invoice.id,
  analytical_account_id: item.analytical_account_id,
  debit_amount: 0,
  credit_amount: item.total_amount,  // Revenue increases
  description: `Customer Invoice ${invoice.invoice_number} - ${item.product.name}`,
  status: 'POSTED'
});
```

### 5.5 Payment Processing

**FR-PAYMENT-001: Record Payment**

Types:
- **INCOMING**: Payment from customer
- **OUTGOING**: Payment to vendor

Input:
```json
{
  "payment_type": "INCOMING",
  "payment_method": "RAZORPAY",
  "payment_date": "2026-01-31",
  "amount": 10000,
  "contact_id": "uuid",
  "reference_number": "TXN123456",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_order_id": "order_xxxxx",
  "allocations": [
    {
      "invoice_type": "CUSTOMER_INVOICE",
      "invoice_id": "uuid",
      "allocated_amount": 5000
    },
    {
      "invoice_type": "CUSTOMER_INVOICE",
      "invoice_id": "uuid",
      "allocated_amount": 5000
    }
  ]
}
```

Processing:
1. Create payment record
2. For each allocation:
   - Create payment_allocation record
   - Update invoice/bill:
     ```javascript
     paid_amount += allocated_amount
     remaining_amount = total_amount - paid_amount
     
     if (remaining_amount === 0) {
       payment_status = 'PAID'
       if (status === 'POSTED') status = 'PAID'
     } else if (paid_amount > 0) {
       payment_status = 'PARTIALLY_PAID'
     }
     ```
3. Validate: sum of allocations <= payment amount

### 5.6 Budget Monitoring

**FR-BUDGET-REPORT-001: Budget vs Actual Calculation**

Algorithm:
```javascript
async function calculateBudgetVsActual(budgetId) {
  // 1. Get budget details
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { analytical_account: true }
  });
  
  // 2. Get journal entries for this analytical account within budget period
  const entries = await prisma.journalEntry.findMany({
    where: {
      analytical_account_id: budget.analytical_account_id,
      entry_date: {
        gte: budget.start_date,
        lte: budget.end_date
      },
      status: 'POSTED'
    }
  });
  
  // 3. Calculate totals
  const actualExpense = entries.reduce((sum, e) => sum + e.debit_amount, 0);
  const actualIncome = entries.reduce((sum, e) => sum + e.credit_amount, 0);
  const netActual = actualIncome - actualExpense;
  
  // 4. Calculate metrics
  const budgetedAmount = budget.budgeted_amount;
  const variance = netActual - budgetedAmount;
  const achievementPercent = budgetedAmount > 0 
    ? (netActual / budgetedAmount) * 100 
    : 0;
  const remainingBalance = budgetedAmount - netActual;
  
  return {
    budget_name: budget.name,
    analytical_account: budget.analytical_account.name,
    period: `${budget.start_date} to ${budget.end_date}`,
    budgeted_amount: budgetedAmount,
    actual_expense: actualExpense,
    actual_income: actualIncome,
    net_actual: netActual,
    variance: variance,
    achievement_percentage: achievementPercent,
    remaining_balance: remainingBalance,
    status: budget.status
  };
}
```

**FR-BUDGET-REPORT-002: Dashboard Charts**

Chart 1: Budget vs Actual Bar Chart
```javascript
// Data format for Recharts
{
  data: [
    {
      name: "Marketing",
      budgeted: 100000,
      actual: 85000
    },
    {
      name: "Production",
      budgeted: 200000,
      actual: 195000
    }
  ]
}
```

Chart 2: Achievement Pie Chart
```javascript
{
  data: [
    { name: "Achieved", value: 85 },
    { name: "Remaining", value: 15 }
  ]
}
```

Chart 3: Monthly Trend Line Chart
```javascript
{
  data: [
    { month: "Jan", budgeted: 10000, actual: 8500 },
    { month: "Feb", budgeted: 10000, actual: 9200 },
    // ...
  ]
}
```

### 5.7 Customer Portal

**FR-PORTAL-001: Customer Login**

Process:
1. Contact must have linked user account (user_id not null)
2. User logs in with email/password
3. JWT token issued with role = PORTAL_USER
4. Frontend redirects to portal dashboard

**FR-PORTAL-002: View Invoices**

Endpoint: GET /api/portal/invoices

Filters:
- Status: ALL | POSTED | PAID
- Payment Status: ALL | NOT_PAID | PARTIALLY_PAID | PAID
- Date Range: from_date, to_date

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-2026-01-00001",
      "invoice_date": "2026-01-15",
      "due_date": "2026-02-14",
      "total_amount": 50000,
      "paid_amount": 20000,
      "remaining_amount": 30000,
      "payment_status": "PARTIALLY_PAID",
      "status": "POSTED"
    }
  ]
}
```

**FR-PORTAL-003: Download Invoice PDF**

Endpoint: GET /api/portal/invoices/:id/pdf

Process:
1. Verify user owns this invoice
2. Generate PDF using invoice template
3. Return PDF file or URL

**FR-PORTAL-004: Make Payment (Razorpay)**

Flow:
```
1. Customer clicks "Pay" on invoice
   ↓
2. Frontend: POST /api/portal/payments/create-order
   Body: { invoice_id, amount }
   ↓
3. Backend:
   - Verify invoice ownership
   - Create Razorpay order
   - Return: { order_id, amount, currency }
   ↓
4. Frontend: Open Razorpay checkout modal
   ↓
5. Customer completes payment in Razorpay
   ↓
6. Razorpay callback with payment_id
   ↓
7. Frontend: POST /api/portal/payments/verify
   Body: {
     razorpay_order_id,
     razorpay_payment_id,
     razorpay_signature,
     invoice_id,
     amount
   }
   ↓
8. Backend:
   - Verify signature
   - Create payment record
   - Allocate to invoice
   - Update invoice status
   - Return success
   ↓
9. Frontend: Show success message
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌────────────┐         ┌────────────┐         ┌───────────────┐
│   Users    │◄────────┤  Contacts  │────────►│   Products    │
└────────────┘         └────────────┘         └───────────────┘
      │                      │                         │
      │ created_by           │ vendor/customer         │ product
      │                      │                         │
      ▼                      ▼                         ▼
┌────────────────────────────────────────────────────────────┐
│                   Purchase Orders                          │
│                   Vendor Bills                             │
│                   Sales Orders                             │
│                   Customer Invoices                        │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      │ items reference
                      ▼
            ┌──────────────────┐
            │ Analytical       │
            │ Accounts         │
            │ (Cost Centers)   │
            └─────────┬────────┘
                      │
                      │ linked to
                      ▼
            ┌──────────────────┐         ┌──────────────────┐
            │    Budgets       │────────►│ Journal Entries  │
            │                  │         │ (Actuals)        │
            └──────────────────┘         └──────────────────┘
                      │
                      │
                      ▼
            ┌──────────────────┐
            │  Auto Analytical │
            │     Models       │
            └──────────────────┘
                      
┌──────────────────┐         ┌──────────────────┐
│    Payments      │────────►│     Payment      │
│                  │         │   Allocations    │
└──────────────────┘         └──────────────────┘
                                      │
                                      │ links to
                                      ▼
                        ┌──────────────────────────┐
                        │  Customer Invoices       │
                        │  Vendor Bills            │
                        └──────────────────────────┘
```

### 6.2 Key Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'PORTAL_USER')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**contacts**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('CUSTOMER', 'VENDOR', 'BOTH')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  tax_id VARCHAR(50),
  user_id UUID UNIQUE REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_name ON contacts(name);
```

**products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  unit_price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
```

**analytical_accounts**
```sql
CREATE TABLE analytical_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES analytical_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytical_accounts_code ON analytical_accounts(code);
CREATE INDEX idx_analytical_accounts_parent ON analytical_accounts(parent_id);
```

**budgets**
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  analytical_account_id UUID NOT NULL REFERENCES analytical_accounts(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budgeted_amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'REVISED')),
  revision_number INT DEFAULT 0,
  parent_budget_id UUID REFERENCES budgets(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budgets_analytical_account ON budgets(analytical_account_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_status ON budgets(status);
```

**journal_entries**
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  entry_type VARCHAR(20) NOT NULL 
    CHECK (entry_type IN ('PURCHASE', 'SALE', 'PAYMENT', 'ADJUSTMENT')),
  reference_type VARCHAR(30) 
    CHECK (reference_type IN ('VENDOR_BILL', 'CUSTOMER_INVOICE', 'PAYMENT')),
  reference_id UUID,
  analytical_account_id UUID REFERENCES analytical_accounts(id),
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_analytical_account 
  ON journal_entries(analytical_account_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);
CREATE INDEX idx_journal_entries_reference 
  ON journal_entries(reference_type, reference_id);
```

**customer_invoices**
```sql
CREATE TABLE customer_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES contacts(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'POSTED', 'PAID', 'CANCELLED')),
  payment_status VARCHAR(20) DEFAULT 'NOT_PAID'
    CHECK (payment_status IN ('NOT_PAID', 'PARTIALLY_PAID', 'PAID')),
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customer_invoices_customer ON customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX idx_customer_invoices_payment_status 
  ON customer_invoices(payment_status);
CREATE INDEX idx_customer_invoices_dates 
  ON customer_invoices(invoice_date, due_date);
```

**payments**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE NOT NULL,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('INCOMING', 'OUTGOING')),
  payment_method VARCHAR(20) NOT NULL 
    CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'ONLINE', 'RAZORPAY')),
  amount DECIMAL(15,2) NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  reference_number VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_contact ON payments(contact_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_razorpay ON payments(razorpay_payment_id);
```

**payment_allocations**
```sql
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_type VARCHAR(30) NOT NULL 
    CHECK (invoice_type IN ('CUSTOMER_INVOICE', 'VENDOR_BILL')),
  invoice_id UUID NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice 
  ON payment_allocations(invoice_type, invoice_id);
```

### 6.3 Database Relationships

**One-to-Many:**
- Users → Contacts (created_by)
- Users → Products (created_by)
- Contacts → Purchase Orders (vendor)
- Contacts → Customer Invoices (customer)
- Products → Transaction Items
- Analytical Accounts → Budgets
- Analytical Accounts → Journal Entries
- Payments → Payment Allocations

**One-to-One:**
- Users ← Contacts (user_id) - Portal access link

**Self-Referencing:**
- Analytical Accounts → Analytical Accounts (parent_id) - Hierarchy
- Budgets → Budgets (parent_budget_id) - Revisions

**Polymorphic (via invoice_type):**
- Payment Allocations → Customer Invoices OR Vendor Bills

---

## 7. Non-Functional Requirements

### 7.1 Performance

**Response Time:**
- API simple queries: < 500ms
- API complex reports: < 2s
- Page load (first contentful paint): < 2s
- Time to interactive: < 3s

**Throughput:**
- Support 100 concurrent users
- Handle 1000 transactions per day
- Database queries optimized with proper indexing

**Database Optimization:**
```sql
-- Essential indexes created above
-- Additional performance tips:

-- Use pagination for all list queries
SELECT * FROM invoices LIMIT 20 OFFSET 0;

-- Use SELECT only needed columns
SELECT id, invoice_number, total_amount FROM invoices;

-- Use database-level aggregations
SELECT 
  analytical_account_id,
  SUM(debit_amount) as total_expense,
  SUM(credit_amount) as total_income
FROM journal_entries
WHERE status = 'POSTED'
GROUP BY analytical_account_id;
```

### 7.2 Scalability

**Horizontal Scaling:**
- Stateless backend (can run multiple instances)
- Load balancer distribution
- Database connection pooling (Prisma built-in)

**Vertical Scaling:**
- Neon auto-scales compute resources
- Cloudinary CDN for images

**Data Growth:**
- Design supports millions of transactions
- Implement archiving for old data (> 3 years)
- Partition large tables by date if needed

### 7.3 Security

**Authentication:**
```javascript
// JWT configuration
{
  secret: process.env.JWT_SECRET, // Min 32 chars, random
  expiresIn: '24h',
  algorithm: 'HS256'
}

// Password hashing
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

**Authorization:**
```javascript
// Middleware stack
app.post('/api/budgets', 
  authMiddleware,              // Verify JWT
  roleCheck(['ADMIN']),        // Check role
  validateRequest(budgetSchema), // Validate input
  budgetController.create      // Process request
);
```

**Data Protection:**
- HTTPS only (TLS 1.2+)
- SQL injection prevented by Prisma (parameterized queries)
- XSS prevented by React (automatic escaping)
- CSRF tokens for state-changing operations
- Rate limiting: 100 requests per 15 min per IP

**Sensitive Data:**
```javascript
// Password fields never returned in API responses
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    password_hash: false // Explicitly exclude
  }
});

// Environment variables for secrets
RAZORPAY_KEY_SECRET=...
JWT_SECRET=...
DATABASE_URL=...
```

### 7.4 Reliability

**Uptime:**
- Target: 99.5% availability
- Scheduled maintenance windows: Sundays 2-4 AM

**Error Handling:**
```javascript
// Global error handler
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  // Don't expose internal errors to client
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message;
    
  res.status(statusCode).json({
    success: false,
    error: message
  });
});
```

**Data Backup:**
- Neon automatic daily backups
- Retention: 30 days
- Point-in-time recovery available
- Test restore process monthly

**Audit Trail:**
```javascript
// All critical operations logged
{
  timestamp: "2026-01-31T10:00:00Z",
  user_id: "uuid",
  action: "POST_VENDOR_BILL",
  resource_type: "vendor_bills",
  resource_id: "uuid",
  changes: { status: "DRAFT → POSTED" },
  ip_address: "192.168.1.1"
}
```

### 7.5 Usability

**Responsive Design:**
- Mobile: 360px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Browser Support:**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (4.5:1 minimum)

**Internationalization:**
- Date format: Configurable (DD/MM/YYYY or MM/DD/YYYY)
- Currency: INR (₹) default, support for others
- Number format: Locale-aware (1,000.00 vs 1.000,00)

### 7.6 Maintainability

**Code Quality:**
```javascript
// ESLint configuration
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error"
  }
}

// Prettier configuration
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

**Documentation:**
- Inline code comments for complex logic
- README for setup instructions
- API documentation (Swagger)
- Database schema diagrams

**Testing:**
```javascript
// Unit tests (Jest)
describe('Budget Service', () => {
  test('calculates budget vs actual correctly', async () => {
    const result = await budgetService.calculateVsActual(budgetId);
    expect(result.achievement_percentage).toBe(85);
  });
});

// Integration tests (Supertest)
describe('POST /api/budgets', () => {
  test('creates budget with valid data', async () => {
    const response = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBudgetData);
    expect(response.status).toBe(201);
  });
});
```

---

## 8. Integration Requirements

### 8.1 Cloudinary Integration

**Purpose:** Store and serve product images, contact photos, invoice attachments

**Setup:**
```javascript
// Backend configuration
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload function
const uploadImage = async (file, folder) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `shiv-furniture/${folder}`,
    resource_type: 'auto',
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  });
  
  return result.secure_url;
};

// Delete function
const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};
```

**Folder Structure:**
```
shiv-furniture/
├── products/
│   ├── {product_id}_1.jpg
│   └── {product_id}_2.jpg
├── contacts/
│   └── {contact_id}.jpg
└── invoices/
    └── {invoice_id}_attachment.pdf
```

**Frontend Usage:**
```javascript
// Image upload component
const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'products');
  
  const response = await api.post('/api/cloudinary/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data.url;
};
```

### 8.2 Razorpay Integration

**Purpose:** Process online payments from customers

**Setup:**
```javascript
// Backend
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Frontend
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**Payment Flow:**

**Step 1: Create Order (Backend)**
```javascript
// POST /api/payments/razorpay/create-order
const createOrder = async (req, res) => {
  const { invoice_id, amount } = req.body;
  
  // Verify invoice ownership
  const invoice = await prisma.customerInvoice.findFirst({
    where: {
      id: invoice_id,
      customer: {
        user_id: req.user.id
      }
    }
  });
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  // Create Razorpay order
  const order = await razorpayInstance.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: invoice.invoice_number,
    notes: {
      invoice_id: invoice.id,
      customer_id: invoice.customer_id
    }
  });
  
  res.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env.RAZORPAY_KEY_ID
  });
};
```

**Step 2: Open Checkout (Frontend)**
```javascript
const openRazorpayCheckout = (orderData) => {
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Shiv Furniture',
    description: `Payment for Invoice ${invoice.invoice_number}`,
    order_id: orderData.order_id,
    handler: async (response) => {
      // Payment successful
      await verifyPayment(response);
    },
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone
    },
    theme: {
      color: '#3399cc'
    }
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.on('payment.failed', (response) => {
    alert('Payment failed: ' + response.error.description);
  });
  razorpay.open();
};
```

**Step 3: Verify Payment (Backend)**
```javascript
// POST /api/payments/razorpay/verify
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    invoice_id,
    amount
  } = req.body;
  
  // Verify signature
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      payment_number: `PAY-${Date.now()}`,
      payment_date: new Date(),
      payment_type: 'INCOMING',
      payment_method: 'RAZORPAY',
      amount: amount,
      contact_id: invoice.customer_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      status: 'SUCCESS',
      created_by: req.user.id,
      allocations: {
        create: {
          invoice_type: 'CUSTOMER_INVOICE',
          invoice_id: invoice_id,
          allocated_amount: amount
        }
      }
    }
  });
  
  // Update invoice
  await updateInvoicePaymentStatus(invoice_id, amount);
  
  res.json({
    success: true,
    payment_id: payment.id
  });
};
```

**Webhook Handling (Optional):**
```javascript
// POST /api/webhooks/razorpay
const handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(400).send('Invalid signature');
  }
  
  const event = req.body.event;
  const payload = req.body.payload;
  
  switch (event) {
    case 'payment.captured':
      // Payment successful
      await handlePaymentSuccess(payload.payment.entity);
      break;
    case 'payment.failed':
      // Payment failed
      await handlePaymentFailure(payload.payment.entity);
      break;
  }
  
  res.json({ success: true });
};
```

---

**End of Main SRS Document**

*See companion documents for:*
- **API Specification** - Complete endpoint documentation
- **Frontend Implementation Guide** - React component examples
- **Backend Implementation Guide** - Service layer details
- **Deployment Guide** - Production setup instructions

