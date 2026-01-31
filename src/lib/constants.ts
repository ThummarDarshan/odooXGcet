import { ProductCategory, PaymentMode, OrderStatus, PaymentStatus } from '@/types';

// ==================== PAYMENT MODES ====================
// CRITICAL: These labels must match exactly between frontend and backend
export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
];

// ==================== PRODUCT CATEGORIES ====================
export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'sofa', label: 'Sofa' },
  { value: 'bed', label: 'Bed' },
  { value: 'table', label: 'Table' },
  { value: 'chair', label: 'Chair' },
  { value: 'wardrobe', label: 'Wardrobe' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'office', label: 'Office Furniture' },
  { value: 'outdoor', label: 'Outdoor Furniture' },
  { value: 'accessories', label: 'Accessories' },
];

// ==================== ORDER STATUS ====================
export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'muted' },
  { value: 'confirmed', label: 'Confirmed', color: 'warning' },
  { value: 'posted', label: 'Posted', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'destructive' },
];

// ==================== PAYMENT STATUS ====================
export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'not_paid', label: 'Not Paid', color: 'destructive' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'warning' },
  { value: 'paid', label: 'Paid', color: 'success' },
];

// ==================== NAVIGATION ====================
export const ADMIN_NAV_ITEMS = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Account',
    path: '/account',
    icon: 'Users',
    children: [
      { title: 'Contacts', path: '/account/contacts' },
      { title: 'Products', path: '/account/products' },
      { title: 'Cost Centers', path: '/account/cost-centers' },
      { title: 'Budgets', path: '/account/budgets' },
      { title: 'Auto Analytical Models', path: '/account/analytical-models' },
    ],
  },
  {
    title: 'Purchase',
    path: '/purchase',
    icon: 'ShoppingCart',
    children: [
      { title: 'Purchase Orders', path: '/purchase/orders' },
      { title: 'Vendor Bills', path: '/purchase/bills' },
      { title: 'Bill Payments', path: '/purchase/payments' },
    ],
  },
  {
    title: 'Sale',
    path: '/sale',
    icon: 'Receipt',
    children: [
      { title: 'Sales Orders', path: '/sale/orders' },
      { title: 'Customer Invoices', path: '/sale/invoices' },
      { title: 'Invoice Payments', path: '/sale/payments' },
    ],
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: 'BarChart3',
    children: [
      { title: 'Budget Report', path: '/reports/budget' },
      { title: 'Cost Center Report', path: '/reports/cost-centers' },
      { title: 'Payment Status Report', path: '/reports/payments' },
    ],
  },
];

export const CUSTOMER_NAV_ITEMS = [
  {
    title: 'Dashboard',
    path: '/portal/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'My Invoices',
    path: '/portal/invoices',
    icon: 'FileText',
  },
  {
    title: 'Payment History',
    path: '/portal/payments',
    icon: 'CreditCard',
  },
];

// ==================== BUDGET STATUS THRESHOLDS ====================
export const BUDGET_THRESHOLDS = {
  WARNING_PERCENTAGE: 80, // Yellow warning when 80%+ utilized
  DANGER_PERCENTAGE: 100, // Red when 100%+ utilized
};

// ==================== DATE FORMATS ====================
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';

// ==================== TAX RATE ====================
export const DEFAULT_TAX_RATE = 0.18; // 18% GST
