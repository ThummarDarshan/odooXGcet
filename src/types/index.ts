// ==================== USER & AUTH TYPES ====================

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==================== CONTACT TYPES ====================

export type ContactType = 'customer' | 'vendor';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: ContactType;
  portalAccess: boolean;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ==================== PRODUCT TYPES ====================

export type ProductCategory = 
  | 'sofa'
  | 'bed'
  | 'table'
  | 'chair'
  | 'wardrobe'
  | 'cabinet'
  | 'office'
  | 'outdoor'
  | 'accessories';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ==================== COST CENTER / ANALYTICAL ACCOUNT TYPES ====================

export interface CostCenter {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ==================== BUDGET TYPES ====================

export type BudgetStatus = 'under_budget' | 'near_limit' | 'over_budget';

export interface Budget {
  id: string;
  name: string;
  costCenterId: string;
  costCenterName?: string;
  periodStart: string;
  periodEnd: string;
  plannedAmount: number;
  actualAmount: number;
  remainingBalance: number;
  achievementPercentage: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRevision {
  id: string;
  budgetId: string;
  previousAmount: number;
  newAmount: number;
  reason: string;
  revisedBy: string;
  revisedAt: string;
}

// ==================== AUTO ANALYTICAL MODEL TYPES ====================

export interface AutoAnalyticalRule {
  id: string;
  name: string;
  ruleType: 'product' | 'category';
  productId?: string;
  category?: ProductCategory;
  costCenterId: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
}

// ==================== ORDER TYPES ====================

export type OrderStatus = 'draft' | 'confirmed' | 'posted' | 'cancelled';
export type PaymentStatus = 'not_paid' | 'partially_paid' | 'paid';
export type PaymentMode = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD';

export interface LineItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  costCenterId?: string;
  costCenterName?: string;
}

// ==================== PURCHASE TYPES ====================

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName?: string;
  orderDate: string;
  status: OrderStatus;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  purchaseOrderId?: string;
  vendorId: string;
  vendorName?: string;
  billDate: string;
  dueDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillPayment {
  id: string;
  billId: string;
  billNumber?: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

// ==================== SALES TYPES ====================

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  orderDate: string;
  status: OrderStatus;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  customerId: string;
  customerName?: string;
  invoiceDate: string;
  dueDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

// ==================== DASHBOARD TYPES ====================

export interface DashboardMetrics {
  totalSales: number;
  totalPurchases: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  budgetUtilization: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
}

export interface BudgetChartData {
  name: string;
  planned: number;
  actual: number;
}

export interface CostCenterChartData {
  name: string;
  value: number;
  percentage: number;
}
