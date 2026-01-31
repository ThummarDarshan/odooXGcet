# API Specification
# Shiv Furniture Budget Accounting System

**Version:** 1.0  
**Base URL:** `https://api.shivfurniture.com` (Production)  
**Base URL:** `http://localhost:5000/api` (Development)

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [Error Handling](#3-error-handling)
4. [Master Data APIs](#4-master-data-apis)
5. [Transaction APIs](#5-transaction-apis)
6. [Budget APIs](#6-budget-apis)
7. [Payment APIs](#7-payment-apis)
8. [Report APIs](#8-report-apis)
9. [Portal APIs](#9-portal-apis)
10. [Utility APIs](#10-utility-apis)

---

## 1. API Overview

### 1.1 General Information

**Protocol:** HTTP/HTTPS  
**Data Format:** JSON  
**Authentication:** JWT Bearer Token  
**Rate Limiting:** 100 requests per 15 minutes per IP  
**CORS:** Enabled for configured frontend domains

### 1.2 Common Headers

```http
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

### 1.3 Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }  // or array
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }  // Optional, for validation errors
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 1.4 Common Query Parameters

**Pagination:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)

**Sorting:**
- `sort_by`: field name
- `order`: `asc` | `desc`

**Search:**
- `search`: search term (searches across multiple fields)

---

## 2. Authentication

### 2.1 User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "admin@shivfurniture.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@shivfurniture.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "expiresIn": "24h"
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is inactive

### 2.2 User Registration (Admin Only)

**Endpoint:** `POST /auth/register`

**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "name": "New User",
  "role": "ADMIN" | "PORTAL_USER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "ADMIN",
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

### 2.3 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Headers:** `Authorization: Bearer {EXPIRED_TOKEN}`

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": "24h"
  }
}
```

### 2.4 Change Password

**Endpoint:** `POST /auth/change-password`

**Headers:** `Authorization: Bearer {TOKEN}`

**Request:**
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 3. Error Handling

### 3.1 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/POST/PUT |
| 201 | Created | Successful resource creation |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### 3.2 Validation Error Format

**Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "budgeted_amount": "Must be a positive number"
  }
}
```

---

## 4. Master Data APIs

### 4.1 Contacts

#### 4.1.1 List Contacts

**Endpoint:** `GET /contacts`

**Query Parameters:**
- `type`: `CUSTOMER` | `VENDOR` | `BOTH`
- `has_user`: `true` | `false`
- `is_active`: `true` | `false`
- `search`: search term
- `page`, `limit`, `sort_by`, `order`

**Example Request:**
```http
GET /contacts?type=CUSTOMER&search=ABC&page=1&limit=20
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "CUSTOMER",
      "name": "ABC Furniture Store",
      "email": "abc@example.com",
      "phone": "+91-9876543210",
      "address": "123 Main St, Mumbai",
      "tax_id": "27XXXXX1234X1ZX",
      "image_url": "https://res.cloudinary.com/...",
      "user_id": "uuid",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 4.1.2 Get Contact by ID

**Endpoint:** `GET /contacts/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "CUSTOMER",
    "name": "ABC Furniture Store",
    "email": "abc@example.com",
    "phone": "+91-9876543210",
    "address": "123 Main St, Mumbai",
    "tax_id": "27XXXXX1234X1ZX",
    "image_url": "https://res.cloudinary.com/...",
    "user_id": "uuid",
    "user": {
      "id": "uuid",
      "email": "abc@example.com",
      "name": "ABC User",
      "role": "PORTAL_USER"
    },
    "is_active": true,
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

#### 4.1.3 Create Contact

**Endpoint:** `POST /contacts`

**Request:**
```json
{
  "type": "CUSTOMER",
  "name": "XYZ Corporation",
  "email": "xyz@example.com",
  "phone": "+91-9876543210",
  "address": "456 Business Park, Delhi",
  "tax_id": "07XXXXX5678X1ZX",
  "create_user": true,
  "user_password": "TempPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "CUSTOMER",
    "name": "XYZ Corporation",
    "email": "xyz@example.com",
    "user_id": "uuid",
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

**Business Logic:**
- If `create_user` is true:
  - Creates user account with role PORTAL_USER
  - Email becomes required
  - Links contact to user via user_id
- If image provided, uploads to Cloudinary
- Validates email uniqueness

#### 4.1.4 Update Contact

**Endpoint:** `PUT /contacts/:id`

**Request:**
```json
{
  "name": "XYZ Corporation Ltd",
  "phone": "+91-9876543211",
  "address": "New address"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "XYZ Corporation Ltd",
    // ... updated fields
    "updated_at": "2026-01-31T11:00:00Z"
  }
}
```

**Restrictions:**
- Cannot change `type` if transactions exist
- Cannot unlink user (set user_id to null) if portal login active

#### 4.1.5 Archive Contact

**Endpoint:** `DELETE /contacts/:id`

**Response:**
```json
{
  "success": true,
  "message": "Contact archived successfully"
}
```

**Business Rules:**
- Soft delete (sets is_active = false)
- Cannot archive if:
  - Has unpaid invoices/bills
  - Has active purchase/sales orders
- Returns 422 with details if cannot archive

### 4.2 Products

#### 4.2.1 List Products

**Endpoint:** `GET /products`

**Query Parameters:**
- `category`: filter by category
- `is_active`: `true` | `false`
- `search`: search in name, sku, description
- Pagination and sorting parameters

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Teak Wood Dining Table",
      "description": "6-seater dining table",
      "sku": "PRD-20260115-0001",
      "category": "Dining Furniture",
      "unit_price": 45000.00,
      "cost_price": 30000.00,
      "image_url": "https://res.cloudinary.com/...",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### 4.2.2 Create Product

**Endpoint:** `POST /products`

**Request (multipart/form-data):**
```
name: Teak Wood Dining Table
description: 6-seater dining table
category: Dining Furniture
unit_price: 45000
cost_price: 30000
image: [file]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Teak Wood Dining Table",
    "sku": "PRD-20260131-0015",  // Auto-generated
    "category": "Dining Furniture",
    "unit_price": 45000.00,
    "cost_price": 30000.00,
    "image_url": "https://res.cloudinary.com/shiv-furniture/products/uuid.jpg",
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

**SKU Generation:**
```
Format: PRD-YYYYMMDD-XXXX
Example: PRD-20260131-0001

Logic:
- Count products created today
- Increment and pad to 4 digits
- If user provides SKU, use it (after uniqueness check)
```

#### 4.2.3 Update Product

**Endpoint:** `PUT /products/:id`

#### 4.2.4 Archive Product

**Endpoint:** `DELETE /products/:id`

**Business Rules:**
- Cannot archive if used in active transactions

### 4.3 Analytical Accounts

#### 4.3.1 List Analytical Accounts

**Endpoint:** `GET /analytical-accounts`

**Query Parameters:**
- `include_hierarchy`: `true` | `false` (returns tree structure)
- `parent_id`: filter by parent (null for root level)
- `is_active`: `true` | `false`

**Response (Flat):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "MARKETING",
      "name": "Marketing",
      "description": "All marketing activities",
      "parent_id": null,
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "code": "MARKETING-EXPO",
      "name": "Marketing - Expo 2026",
      "parent_id": "uuid-of-marketing",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

**Response (Hierarchy with include_hierarchy=true):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "MARKETING",
      "name": "Marketing",
      "parent_id": null,
      "children": [
        {
          "id": "uuid",
          "code": "MARKETING-EXPO",
          "name": "Marketing - Expo 2026",
          "parent_id": "uuid-of-marketing",
          "children": []
        },
        {
          "id": "uuid",
          "code": "MARKETING-DIGITAL",
          "name": "Marketing - Digital",
          "parent_id": "uuid-of-marketing",
          "children": []
        }
      ]
    }
  ]
}
```

#### 4.3.2 Create Analytical Account

**Endpoint:** `POST /analytical-accounts`

**Request:**
```json
{
  "code": "PRODUCTION-A",
  "name": "Production - Factory A",
  "description": "Factory A production costs",
  "parent_id": "uuid-of-production"
}
```

**Validation:**
- Code: uppercase alphanumeric with hyphens only
- Code must be unique
- Cannot create circular hierarchy
- Maximum depth: 5 levels

#### 4.3.3 Update Analytical Account

**Endpoint:** `PUT /analytical-accounts/:id`

**Restrictions:**
- Cannot change parent if budgets or transactions linked (return 422)

#### 4.3.4 Archive Analytical Account

**Endpoint:** `DELETE /analytical-accounts/:id`

**Business Rules:**
- Cannot archive if:
  - Has active budgets
  - Has transactions linked
  - Has active children accounts

### 4.4 Budgets

#### 4.4.1 List Budgets

**Endpoint:** `GET /budgets`

**Query Parameters:**
- `analytical_account_id`: filter by account
- `status`: `DRAFT` | `ACTIVE` | `CLOSED` | `REVISED`
- `start_date_from`, `start_date_to`: date range filters
- `include_actuals`: `true` | `false` (includes budget vs actual data)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Marketing Budget 2026",
      "analytical_account": {
        "id": "uuid",
        "code": "MARKETING",
        "name": "Marketing"
      },
      "start_date": "2026-01-01",
      "end_date": "2026-12-31",
      "budgeted_amount": 1000000.00,
      "description": "Annual marketing budget",
      "status": "ACTIVE",
      "revision_number": 0,
      "parent_budget_id": null,
      "created_at": "2026-01-01T00:00:00Z",
      // If include_actuals=true:
      "actuals": {
        "actual_expense": 250000.00,
        "actual_income": 0.00,
        "net_actual": -250000.00,
        "variance": -250000.00,
        "achievement_percentage": -25.00,
        "remaining_balance": 1250000.00
      }
    }
  ]
}
```

#### 4.4.2 Create Budget

**Endpoint:** `POST /budgets`

**Request:**
```json
{
  "name": "Marketing Budget 2026",
  "analytical_account_id": "uuid",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "budgeted_amount": 1000000,
  "description": "Annual marketing budget"
}
```

**Validation:**
- start_date < end_date
- budgeted_amount > 0
- analytical_account_id must exist

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Marketing Budget 2026",
    "status": "DRAFT",  // Initial status
    "revision_number": 0,
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

#### 4.4.3 Activate Budget

**Endpoint:** `POST /budgets/:id/activate`

**Business Logic:**
1. Check no overlapping ACTIVE budgets for same analytical account
2. Update status: DRAFT → ACTIVE
3. Lock analytical account (prevent archiving)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "activated_at": "2026-01-31T10:00:00Z"
  }
}
```

**Errors:**
- `422 Unprocessable Entity`: Overlapping budget exists

```json
{
  "success": false,
  "error": "Overlapping budget exists",
  "details": {
    "existing_budget": {
      "id": "uuid",
      "name": "Marketing Q1 2026",
      "period": "2026-01-01 to 2026-03-31"
    }
  }
}
```

#### 4.4.4 Revise Budget

**Endpoint:** `POST /budgets/:id/revise`

**Request:**
```json
{
  "budgeted_amount": 1200000,  // New amount
  "description": "Mid-year revision - increased budget"
}
```

**Business Logic:**
1. Original budget status → REVISED
2. Create new budget:
   - Copy all fields from original
   - Update budgeted_amount and description
   - Set parent_budget_id = original id
   - Set revision_number = original.revision_number + 1
   - Set status = DRAFT

**Response:**
```json
{
  "success": true,
  "data": {
    "new_budget": {
      "id": "uuid-new",
      "revision_number": 1,
      "budgeted_amount": 1200000.00,
      "parent_budget_id": "uuid-original",
      "status": "DRAFT"
    },
    "original_budget": {
      "id": "uuid-original",
      "status": "REVISED"
    }
  }
}
```

#### 4.4.5 Get Budget Revision History

**Endpoint:** `GET /budgets/:id/revisions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v1",
      "revision_number": 0,
      "budgeted_amount": 1000000.00,
      "status": "REVISED",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid-v2",
      "revision_number": 1,
      "budgeted_amount": 1200000.00,
      "status": "ACTIVE",
      "created_at": "2026-06-01T00:00:00Z"
    }
  ]
}
```

#### 4.4.6 Close Budget

**Endpoint:** `POST /budgets/:id/close`

**Business Logic:**
- Status: ACTIVE → CLOSED
- No more transactions will affect this budget

### 4.5 Auto Analytical Models

#### 4.5.1 List Auto Models

**Endpoint:** `GET /auto-models`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Wood Products → Production",
      "priority": 100,
      "analytical_account": {
        "id": "uuid",
        "code": "PRODUCTION",
        "name": "Production"
      },
      "rule_type": "PRODUCT_CATEGORY",
      "rule_condition": {
        "product_category": "Wood Furniture"
      },
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### 4.5.2 Create Auto Model

**Endpoint:** `POST /auto-models`

**Request:**
```json
{
  "name": "Large Orders → Sales-Enterprise",
  "priority": 50,
  "analytical_account_id": "uuid",
  "rule_type": "AMOUNT_RANGE",
  "rule_condition": {
    "min_amount": 100000,
    "max_amount": null
  }
}
```

**Rule Type Examples:**

**PRODUCT_CATEGORY:**
```json
{
  "rule_type": "PRODUCT_CATEGORY",
  "rule_condition": {
    "product_category": "Wood Furniture"
  }
}
```

**CONTACT:**
```json
{
  "rule_type": "CONTACT",
  "rule_condition": {
    "contact_id": "uuid"
  }
}
```

**AMOUNT_RANGE:**
```json
{
  "rule_type": "AMOUNT_RANGE",
  "rule_condition": {
    "min_amount": 10000,
    "max_amount": 50000
  }
}
```

#### 4.5.3 Test Auto Model

**Endpoint:** `POST /auto-models/test`

**Description:** Test which auto model would be applied to a transaction item

**Request:**
```json
{
  "product_id": "uuid",
  "contact_id": "uuid",
  "amount": 15000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matched_model": {
      "id": "uuid",
      "name": "Wood Products → Production",
      "priority": 100,
      "analytical_account_id": "uuid"
    },
    "all_matching_models": [
      // Array of all models that matched, sorted by priority
    ]
  }
}
```

---

## 5. Transaction APIs

### 5.1 Purchase Orders

#### 5.1.1 Create Purchase Order

**Endpoint:** `POST /purchase-orders`

**Request:**
```json
{
  "vendor_id": "uuid",
  "order_date": "2026-01-31",
  "expected_delivery_date": "2026-02-15",
  "notes": "Urgent order",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 10,
      "unit_price": 5000,
      "tax_rate": 18,
      "analytical_account_id": "uuid"  // Optional
    },
    {
      "product_id": "uuid",
      "quantity": 5,
      "unit_price": 8000,
      "tax_rate": 18
      // No analytical_account_id - will be auto-assigned
    }
  ]
}
```

**Backend Processing:**
1. For each item without analytical_account_id:
   - Apply auto models in priority order
   - Assign first matching analytical account
2. Calculate item totals:
   - tax_amount = (quantity × unit_price) × (tax_rate / 100)
   - total_amount = (quantity × unit_price) + tax_amount
3. Calculate PO totals:
   - subtotal = Σ(quantity × unit_price)
   - tax_amount = Σ(item.tax_amount)
   - total_amount = subtotal + tax_amount
4. Generate PO number: PO-YYYYMM-XXXXX
5. Set status = DRAFT

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "po_number": "PO-202601-00015",
    "vendor": {
      "id": "uuid",
      "name": "ABC Suppliers"
    },
    "order_date": "2026-01-31",
    "expected_delivery_date": "2026-02-15",
    "status": "DRAFT",
    "subtotal": 90000.00,
    "tax_amount": 16200.00,
    "total_amount": 106200.00,
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Teak Wood Plank"
        },
        "quantity": 10,
        "unit_price": 5000.00,
        "tax_rate": 18.00,
        "tax_amount": 9000.00,
        "total_amount": 59000.00,
        "analytical_account": {
          "id": "uuid",
          "code": "PRODUCTION",
          "name": "Production"
        }
      }
    ],
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

#### 5.1.2 List Purchase Orders

**Endpoint:** `GET /purchase-orders`

**Query Parameters:**
- `vendor_id`: filter by vendor
- `status`: `DRAFT` | `SENT` | `CONFIRMED` | `RECEIVED` | `CANCELLED`
- `date_from`, `date_to`: order date range
- Pagination parameters

#### 5.1.3 Get Purchase Order

**Endpoint:** `GET /purchase-orders/:id`

**Response:** Same structure as create response

#### 5.1.4 Update Purchase Order

**Endpoint:** `PUT /purchase-orders/:id`

**Business Rules:**
- Can only update if status = DRAFT
- Returns 422 if status != DRAFT

#### 5.1.5 Confirm Purchase Order

**Endpoint:** `POST /purchase-orders/:id/confirm`

**Business Logic:**
- Status: DRAFT → CONFIRMED
- Lock PO (no more edits)
- Optional: Generate and email PDF to vendor

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONFIRMED",
    "confirmed_at": "2026-01-31T10:30:00Z"
  }
}
```

#### 5.1.6 Convert PO to Vendor Bill

**Endpoint:** `POST /purchase-orders/:id/convert-to-bill`

**Request:**
```json
{
  "bill_date": "2026-02-15",
  "due_date": "2026-03-15"
}
```

**Business Logic:**
1. Validate PO status = CONFIRMED
2. Create vendor bill:
   - Copy vendor_id, all items, analytical accounts
   - Set purchase_order_id = PO id
   - Set bill_date, due_date from request
   - Generate bill_number: BILL-YYYYMM-XXXXX
   - Set status = DRAFT
   - Set payment_status = NOT_PAID
   - Calculate remaining_amount = total_amount

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor_bill": {
      "id": "uuid",
      "bill_number": "BILL-202602-00008",
      "purchase_order_id": "uuid",
      "status": "DRAFT",
      "payment_status": "NOT_PAID"
    }
  }
}
```

### 5.2 Vendor Bills

#### 5.2.1 Create Vendor Bill

**Endpoint:** `POST /vendor-bills`

**Request:** Similar to PO create, but with bill_date and due_date

**Response:** Similar to PO response

#### 5.2.2 Post Vendor Bill

**Endpoint:** `POST /vendor-bills/:id/post`

**Business Logic:**
1. Validate status = DRAFT
2. Update status = POSTED
3. Create journal entries for each item with analytical_account_id:
   ```javascript
   {
     entry_number: "JE-{timestamp}-{random}",
     entry_date: bill.bill_date,
     entry_type: "PURCHASE",
     reference_type: "VENDOR_BILL",
     reference_id: bill.id,
     analytical_account_id: item.analytical_account_id,
     debit_amount: item.total_amount,  // Expense
     credit_amount: 0,
     status: "POSTED"
   }
   ```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "POSTED",
    "posted_at": "2026-02-15T10:00:00Z",
    "journal_entries_created": 3
  }
}
```

**Errors:**
- `422`: If status != DRAFT

### 5.3 Sales Orders

**Similar structure to Purchase Orders**

Endpoints:
- `POST /sales-orders` - Create
- `GET /sales-orders` - List
- `GET /sales-orders/:id` - Get
- `PUT /sales-orders/:id` - Update
- `POST /sales-orders/:id/confirm` - Confirm
- `POST /sales-orders/:id/convert-to-invoice` - Convert to invoice

### 5.4 Customer Invoices

**Similar structure to Vendor Bills**

#### 5.4.1 Post Customer Invoice

**Endpoint:** `POST /customer-invoices/:id/post`

**Business Logic:**
1. Status: DRAFT → POSTED
2. Create journal entries:
   ```javascript
   {
     entry_type: "SALE",
     reference_type: "CUSTOMER_INVOICE",
     debit_amount: 0,
     credit_amount: item.total_amount  // Revenue
   }
   ```

---

## 6. Budget APIs

### 6.1 Budget vs Actual Report

**Endpoint:** `GET /budgets/vs-actual`

**Query Parameters:**
- `analytical_account_id`: filter by account
- `status`: filter by budget status
- `date_from`, `date_to`: filter budgets within date range
- `include_closed`: `true` | `false`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "budget": {
        "id": "uuid",
        "name": "Marketing 2026",
        "analytical_account": {
          "code": "MARKETING",
          "name": "Marketing"
        },
        "period": "2026-01-01 to 2026-12-31",
        "budgeted_amount": 1000000.00,
        "status": "ACTIVE"
      },
      "actuals": {
        "actual_expense": 250000.00,
        "actual_income": 0.00,
        "net_actual": -250000.00,
        "variance": -250000.00,
        "achievement_percentage": -25.00,
        "remaining_balance": 1250000.00
      },
      "period_progress": {
        "days_elapsed": 31,
        "days_total": 365,
        "percentage_elapsed": 8.49
      }
    }
  ]
}
```

### 6.2 Budget Achievement Charts

**Endpoint:** `GET /budgets/charts`

**Query Parameters:**
- `chart_type`: `bar` | `pie` | `line` | `gauge`
- `analytical_account_id`: optional filter
- `date_from`, `date_to`: date range

**Response for bar chart:**
```json
{
  "success": true,
  "chart_type": "bar",
  "data": [
    {
      "name": "Marketing",
      "budgeted": 1000000,
      "actual": 250000
    },
    {
      "name": "Production",
      "budgeted": 2000000,
      "actual": 1950000
    }
  ]
}
```

**Response for pie chart:**
```json
{
  "success": true,
  "chart_type": "pie",
  "data": [
    {
      "name": "Marketing",
      "value": 250000
    },
    {
      "name": "Production",
      "value": 1950000
    },
    {
      "name": "Sales",
      "value": 300000
    }
  ]
}
```

**Response for line chart (monthly trend):**
```json
{
  "success": true,
  "chart_type": "line",
  "data": [
    {
      "month": "Jan 2026",
      "budgeted": 83333,
      "actual": 250000
    },
    {
      "month": "Feb 2026",
      "budgeted": 83333,
      "actual": null  // Future month
    }
  ]
}
```

---

## 7. Payment APIs

### 7.1 Record Payment (Admin)

**Endpoint:** `POST /payments`

**Request:**
```json
{
  "payment_type": "OUTGOING",
  "payment_method": "BANK_TRANSFER",
  "payment_date": "2026-01-31",
  "amount": 50000,
  "contact_id": "uuid-vendor",
  "reference_number": "TXN123456",
  "notes": "Payment for Bill BILL-202601-00005",
  "allocations": [
    {
      "invoice_type": "VENDOR_BILL",
      "invoice_id": "uuid",
      "allocated_amount": 30000
    },
    {
      "invoice_type": "VENDOR_BILL",
      "invoice_id": "uuid",
      "allocated_amount": 20000
    }
  ]
}
```

**Business Logic:**
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
     } else if (paid_amount > 0 && paid_amount < total_amount) {
       payment_status = 'PARTIALLY_PAID'
     }
     ```
3. Validate: sum(allocations) <= payment.amount

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payment_number": "PAY-202601-00042",
    "payment_type": "OUTGOING",
    "amount": 50000.00,
    "status": "SUCCESS",
    "allocations": [
      {
        "invoice_type": "VENDOR_BILL",
        "invoice": {
          "id": "uuid",
          "bill_number": "BILL-202601-00005",
          "payment_status": "PAID",
          "remaining_amount": 0
        },
        "allocated_amount": 30000.00
      }
    ],
    "created_at": "2026-01-31T10:00:00Z"
  }
}
```

### 7.2 Razorpay Payment Flow (Customer Portal)

#### 7.2.1 Create Razorpay Order

**Endpoint:** `POST /portal/payments/razorpay/create-order`

**Request:**
```json
{
  "invoice_id": "uuid",
  "amount": 50000
}
```

**Backend Processing:**
1. Verify invoice belongs to logged-in user's contact
2. Verify amount <= remaining_amount
3. Create Razorpay order:
   ```javascript
   const order = await razorpay.orders.create({
     amount: amount * 100,  // Convert to paise
     currency: 'INR',
     receipt: invoice.invoice_number,
     notes: {
       invoice_id: invoice.id,
       customer_id: invoice.customer_id
     }
   });
   ```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpay_order_id": "order_xxxxxxxxxxxxx",
    "amount": 5000000,  // In paise
    "currency": "INR",
    "razorpay_key_id": "rzp_live_xxxxx",
    "invoice": {
      "invoice_number": "INV-202601-00015",
      "total_amount": 50000.00,
      "remaining_amount": 50000.00
    }
  }
}
```

#### 7.2.2 Verify Razorpay Payment

**Endpoint:** `POST /portal/payments/razorpay/verify`

**Request:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_string",
  "invoice_id": "uuid",
  "amount": 50000
}
```

**Backend Processing:**
1. Verify signature:
   ```javascript
   const crypto = require('crypto');
   const expectedSignature = crypto
     .createHmac('sha256', RAZORPAY_KEY_SECRET)
     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
     .digest('hex');
   
   if (expectedSignature !== razorpay_signature) {
     throw new Error('Invalid signature');
   }
   ```

2. Create payment record:
   ```javascript
   const payment = await prisma.payment.create({
     data: {
       payment_number: generatePaymentNumber(),
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
   ```

3. Update invoice payment status

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "payment_number": "PAY-202601-00043",
      "amount": 50000.00,
      "status": "SUCCESS",
      "razorpay_payment_id": "pay_xxxxxxxxxxxxx"
    },
    "invoice": {
      "id": "uuid",
      "invoice_number": "INV-202601-00015",
      "payment_status": "PAID",
      "paid_amount": 50000.00,
      "remaining_amount": 0.00
    }
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid signature
- `404 Not Found`: Invoice not found or not owned by user
- `422 Unprocessable Entity`: Amount exceeds remaining amount

---

## 8. Report APIs

### 8.1 Dashboard Summary

**Endpoint:** `GET /reports/dashboard`

**Query Parameters:**
- `period`: `today` | `week` | `month` | `year` | `custom`
- `date_from`, `date_to`: for custom period

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "current_period": 500000.00,
      "previous_period": 450000.00,
      "growth_percentage": 11.11
    },
    "expenses": {
      "current_period": 350000.00,
      "previous_period": 300000.00,
      "growth_percentage": 16.67
    },
    "profit": {
      "current_period": 150000.00,
      "previous_period": 150000.00,
      "margin_percentage": 30.00
    },
    "outstanding": {
      "receivables": 250000.00,
      "payables": 180000.00,
      "net": 70000.00
    },
    "top_customers": [
      {
        "id": "uuid",
        "name": "ABC Corporation",
        "total_revenue": 150000.00,
        "invoice_count": 5
      }
    ],
    "top_vendors": [
      {
        "id": "uuid",
        "name": "XYZ Suppliers",
        "total_spend": 120000.00,
        "bill_count": 8
      }
    ],
    "budget_summary": {
      "total_budgeted": 5000000.00,
      "total_actual": 3500000.00,
      "overall_achievement": 70.00,
      "under_budget_count": 5,
      "over_budget_count": 2
    }
  }
}
```

### 8.2 Sales Report

**Endpoint:** `GET /reports/sales`

**Query Parameters:**
- `date_from`, `date_to`: date range
- `group_by`: `customer` | `product` | `analytical_account` | `month`
- `customer_id`: filter by customer
- `product_id`: filter by product

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_invoices": 45,
      "total_amount": 2500000.00,
      "paid_amount": 2000000.00,
      "outstanding_amount": 500000.00
    },
    "grouped_data": [
      {
        "group_key": "ABC Corporation",  // Customer name
        "invoice_count": 8,
        "total_amount": 450000.00,
        "paid_amount": 400000.00,
        "outstanding": 50000.00
      }
    ]
  }
}
```

### 8.3 Purchase Report

**Endpoint:** `GET /reports/purchases`

Similar structure to sales report

### 8.4 Payment Report

**Endpoint:** `GET /reports/payments`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_payments": 120,
      "incoming_amount": 2000000.00,
      "outgoing_amount": 1500000.00,
      "net_cash_flow": 500000.00
    },
    "payments": [
      {
        "id": "uuid",
        "payment_number": "PAY-202601-00042",
        "date": "2026-01-31",
        "type": "INCOMING",
        "method": "RAZORPAY",
        "amount": 50000.00,
        "contact_name": "ABC Corporation",
        "allocations": [
          {
            "invoice_number": "INV-202601-00015",
            "allocated_amount": 50000.00
          }
        ]
      }
    ]
  }
}
```

---

## 9. Portal APIs

### 9.1 Portal Dashboard

**Endpoint:** `GET /portal/dashboard`

**Authentication:** Portal user JWT

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "uuid",
      "name": "ABC Corporation",
      "type": "CUSTOMER"
    },
    "summary": {
      "total_invoices": 15,
      "total_amount": 750000.00,
      "paid_amount": 500000.00,
      "outstanding_amount": 250000.00
    },
    "recent_invoices": [
      {
        "id": "uuid",
        "invoice_number": "INV-202601-00015",
        "invoice_date": "2026-01-15",
        "due_date": "2026-02-14",
        "total_amount": 50000.00,
        "payment_status": "NOT_PAID"
      }
    ],
    "recent_payments": [
      {
        "id": "uuid",
        "payment_number": "PAY-202601-00038",
        "payment_date": "2026-01-20",
        "amount": 30000.00,
        "method": "RAZORPAY"
      }
    ]
  }
}
```

### 9.2 List Portal Invoices

**Endpoint:** `GET /portal/invoices`

**Query Parameters:**
- `status`: filter by status
- `payment_status`: filter by payment status
- `date_from`, `date_to`: date range
- Pagination parameters

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-202601-00015",
      "invoice_date": "2026-01-15",
      "due_date": "2026-02-14",
      "status": "POSTED",
      "payment_status": "PARTIALLY_PAID",
      "total_amount": 50000.00,
      "paid_amount": 20000.00,
      "remaining_amount": 30000.00,
      "is_overdue": false
    }
  ],
  "pagination": { ... }
}
```

### 9.3 Get Portal Invoice Details

**Endpoint:** `GET /portal/invoices/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_number": "INV-202601-00015",
    "invoice_date": "2026-01-15",
    "due_date": "2026-02-14",
    "status": "POSTED",
    "payment_status": "PARTIALLY_PAID",
    "subtotal": 42372.88,
    "tax_amount": 7627.12,
    "total_amount": 50000.00,
    "paid_amount": 20000.00,
    "remaining_amount": 30000.00,
    "notes": "Thank you for your business",
    "items": [
      {
        "product_name": "Teak Dining Table",
        "quantity": 2,
        "unit_price": 20000.00,
        "tax_rate": 18.00,
        "total_amount": 47200.00
      }
    ],
    "payment_history": [
      {
        "payment_number": "PAY-202601-00038",
        "payment_date": "2026-01-20",
        "amount": 20000.00,
        "method": "RAZORPAY"
      }
    ]
  }
}
```

### 9.4 Download Invoice PDF

**Endpoint:** `GET /portal/invoices/:id/pdf`

**Response:** PDF file download

**Headers:**
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="INV-202601-00015.pdf"
```

---

## 10. Utility APIs

### 10.1 Upload Image to Cloudinary

**Endpoint:** `POST /cloudinary/upload`

**Content-Type:** `multipart/form-data`

**Request:**
```
image: [file]
folder: products | contacts | invoices
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/shiv-furniture/products/uuid.jpg",
    "public_id": "shiv-furniture/products/uuid",
    "width": 1000,
    "height": 1000,
    "format": "jpg"
  }
}
```

### 10.2 Delete Image from Cloudinary

**Endpoint:** `DELETE /cloudinary/delete`

**Request:**
```json
{
  "public_id": "shiv-furniture/products/uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### 10.3 Get Dropdown Options

**Endpoint:** `GET /dropdown-options`

**Description:** Get options for dropdown fields

**Query Parameters:**
- `type`: `contacts` | `products` | `analytical_accounts` | `budgets`
- `filter`: optional filter (e.g., contact_type=CUSTOMER)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": "uuid",
      "label": "ABC Corporation",
      "metadata": {
        "type": "CUSTOMER",
        "email": "abc@example.com"
      }
    }
  ]
}
```

---

## Appendix A: Status Code Quick Reference

| Code | Name | When to Use |
|------|------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request format, validation error |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry (unique constraint) |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Appendix B: Common Validation Rules

**Email:**
- Format: RFC 5322
- Example: user@example.com

**Phone:**
- Format: E.164 or local
- Example: +91-9876543210

**Date:**
- Format: ISO 8601 (YYYY-MM-DD)
- Example: 2026-01-31

**Decimal:**
- Precision: 2 decimal places
- Max: 9999999999999.99

**UUID:**
- Format: v4 UUID
- Example: 550e8400-e29b-41d4-a716-446655440000

---

**End of API Specification Document**
