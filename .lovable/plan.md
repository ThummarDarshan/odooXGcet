

# Budget Accounting System – Shiv Furniture
## Implementation Plan

---

### 🎯 Project Overview
A production-ready ERP-style React frontend for managing budgets, purchases, sales, invoices, and payments for a furniture business. The system will support two user roles (Admin and Customer) with proper security and clean API integration patterns.

---

## Phase 1: Foundation & Authentication

### 1.1 Project Structure & Layout
- **Global Layout Component** with top navigation bar, ERP-style module navigation, and breadcrumbs
- **Sidebar Navigation** with modules: Dashboard | Account | Purchase | Sale | Reports | Customer Portal
- **Responsive design** that works on desktop and tablet
- **Theme system** with professional ERP color scheme

### 1.2 Authentication System
- **Login Page** - Email/password with secure handling
- **Signup Page** - With password confirmation validation
- **Create User Page** (Admin only) - For managing system users
- **Route Protection** - Role-based access control (Admin vs Customer)
- **Mock Auth Context** - Ready for backend integration with proper password security practices

---

## Phase 2: Dashboard & Analytics

### 2.1 Admin Dashboard
- **Key Metrics Cards** - Total sales, purchases, outstanding payments, budget utilization
- **Budget vs Actual Chart** - Visual comparison using Recharts
- **Cost Center Performance Chart** - Expense distribution
- **Budget Utilization Progress Bars** - With color indicators (Green/Yellow/Red)
- **Monthly Trends Chart** - Revenue and expense trends
- **Quick Action Buttons** - Create invoice, record payment, etc.

---

## Phase 3: Account Module (Master Data)

### 3.1 Contact Master
- **List View** - Searchable, filterable table of contacts
- **Create/Edit Form** - Name, email, phone, address, Customer/Vendor classification
- **Archive Functionality** - Soft delete with status toggle
- **Portal Access Toggle** - Enable customer portal access on creation

### 3.2 Product Master
- **Product List** - With category filters and search
- **Product Form** - Name, category, price, status (Active/Archived)
- **Category Management** - Dropdown with common furniture categories

### 3.3 Analytical Accounts (Cost Centers)
- **Cost Center List** - Name, description, active status
- **Cost Center Form** - Create and manage cost centers for budget tracking

### 3.4 Budget Management
- **Budget List View** - All budgets with status indicators
- **Budget Form** - Name, linked cost center, period (start/end), planned amount
- **Budget Detail View** - Actual amount, remaining balance, achievement percentage
- **Revision History** - Read-only log of budget changes
- **Visual Indicators** - Green (under budget), Yellow (near limit), Red (over budget)

### 3.5 Auto Analytical Models
- **Rule Configuration** - Product/Category → Cost Center mapping
- **Priority-based Rules** - Drag-and-drop ordering
- **Enable/Disable Toggle** - Per rule activation

---

## Phase 4: Purchase Module

### 4.1 Purchase Order
- **Order List** - Status-filtered view (Draft, Confirmed, Posted)
- **Order Form** - Vendor selection, line items with product picker
- **Cost Center Assignment** - Manual or auto (based on analytical models)
- **Status Workflow** - Draft → Confirmed → Posted buttons

### 4.2 Vendor Bill
- **Bill Entry** - Linked to purchase orders
- **Line Item Management** - Product, quantity, price, cost center
- **Auto Calculation** - Subtotal, tax, total

### 4.3 Bill Payment
- **Payment Form** - Amount, mode, date, reference ID
- **Payment Mode Dropdown** - UPI, BANK_TRANSFER, CASH, CARD (exact labels)
- **Payment Status Auto-Update** - Updates bill status on payment

---

## Phase 5: Sales Module

### 5.1 Sales Order
- **Order Creation** - Customer selection, product line items
- **Cost Center Linking** - Per line item
- **Order Status Management** - Similar workflow to purchase

### 5.2 Customer Invoice
- **Invoice Generation** - From sales orders or standalone
- **Line Items** - Product, quantity, rate, amount
- **Auto Calculations** - Subtotal, discount, tax, grand total
- **Payment Status Badge** - Paid / Partially Paid / Not Paid

### 5.3 Invoice Payment
- **Payment Recording** - Link to invoice, amount, mode, date
- **Payment Mode Consistency** - Same labels as purchase (UPI, BANK_TRANSFER, CASH, CARD)
- **Reconciliation** - Auto-update invoice payment status

---

## Phase 6: Customer Portal

### 6.1 Separate Customer Layout
- **Simplified Navigation** - Invoice-focused menu
- **Customer Dashboard** - Outstanding invoices, payment history

### 6.2 Customer Features
- **Invoice List** - View all their invoices
- **Invoice Detail** - With download PDF button (UI only)
- **Payment Action** - Pay invoice with payment mode selection
- **Payment History** - Track all payments made
- **Read-Only Access** - No edit permissions

---

## Phase 7: Reports & Export

### 7.1 Report Views
- **Budget Achievement Report** - Planned vs actual by cost center
- **Cost Center Performance** - Expense breakdown
- **Invoice Payment Status Report** - Outstanding, paid, partially paid

### 7.2 Export Features
- **Export Buttons** - CSV / PDF (UI placeholders)
- **Print-Friendly Layouts** - For invoices and reports

---

## 🛠 Technical Architecture

### Data Layer
- **API Service Layer** - Axios-based services ready for backend integration
- **Mock Data Stores** - Realistic sample data for all modules
- **Type Definitions** - Full TypeScript interfaces for all entities

### Components
- **Reusable Form Components** - Input validation with Zod
- **Data Tables** - Sortable, filterable, paginated
- **Status Badges** - Consistent styling across modules
- **Confirmation Modals** - For destructive actions
- **Toast Notifications** - Success/error feedback
- **Loading States** - Skeleton loaders

### Security Considerations
- **Password Handling** - Never stored in state after submit, no console logging
- **Client-side Validation** - With proper error messages
- **Role-based Route Guards** - Admin vs Customer access
- **Payment Mode Consistency** - Exact label matching for API contract

---

## 📁 File Structure

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, Header, Breadcrumbs
│   ├── auth/            # AuthGuard, LoginForm, SignupForm
│   ├── dashboard/       # Charts, KPIs, Widgets
│   ├── shared/          # DataTable, StatusBadge, Modal, Forms
│   └── ui/              # shadcn/ui components
├── pages/
│   ├── auth/            # Login, Signup, CreateUser
│   ├── dashboard/       # AdminDashboard
│   ├── account/         # Contacts, Products, CostCenters, Budgets
│   ├── purchase/        # PurchaseOrder, VendorBill, BillPayment
│   ├── sales/           # SalesOrder, Invoice, InvoicePayment
│   ├── reports/         # BudgetReport, PaymentReport
│   └── portal/          # CustomerDashboard, CustomerInvoices
├── services/            # API service layer
├── types/               # TypeScript interfaces
├── hooks/               # Custom React hooks
└── lib/                 # Utilities, constants
```

---

## 🎨 Design Approach

- **Professional ERP aesthetic** - Clean tables, clear hierarchies
- **Consistent form patterns** - Aligned labels, clear validation
- **Status color system** - Green (success/under), Yellow (warning/near), Red (error/over)
- **Responsive tables** - Scroll on mobile, full view on desktop
- **Empty states** - Helpful messages when no data exists

---

This plan delivers a complete, demo-ready Budget Accounting System that demonstrates real-world ERP workflows while being fully prepared for backend integration.

