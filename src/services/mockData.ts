/**
 * In-memory mock data store for BudgetWise ERP.
 * Replace with API calls when backend is ready.
 */
import type {
  Contact,
  Product,
  CostCenter,
  Budget,
  BudgetRevision,
  AutoAnalyticalRule,
  PurchaseOrder,
  VendorBill,
  BillPayment,
  SalesOrder,
  CustomerInvoice,
  InvoicePayment,
  LineItem,
} from '@/types';
import { DEFAULT_TAX_RATE } from '@/lib/constants';

// ==================== CONTACTS ====================
let contacts: Contact[] = [
  {
    id: 'c1',
    name: 'ABC Furniture Mart',
    email: 'abc@furniture.com',
    phone: '+91 9876543210',
    address: '123 MG Road, Bangalore',
    type: 'vendor',
    portalAccess: false,
    status: 'active',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
  },
  {
    id: 'c2',
    name: 'John Customer',
    email: 'customer@example.com',
    phone: '+91 9123456789',
    address: '456 Park Street, Mumbai',
    type: 'customer',
    portalAccess: true,
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'c3',
    name: 'XYZ Wood Suppliers',
    email: 'xyz@wood.com',
    phone: '+91 9988776655',
    address: '789 Industrial Area, Chennai',
    type: 'vendor',
    portalAccess: false,
    status: 'active',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
];

export const contactStore = {
  getAll: (): Contact[] => [...contacts],
  getById: (id: string): Contact | undefined => contacts.find(c => c.id === id),
  getByType: (type: 'customer' | 'vendor'): Contact[] => contacts.filter(c => c.type === type && c.status === 'active'),
  create: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact => {
    const now = new Date().toISOString().slice(0, 10);
    const contact: Contact = {
      ...data,
      status: data.status || 'active', // Ensure status defaults to 'active'
      id: 'c' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    contacts = [...contacts, contact];
    return contact;
  },
  update: (id: string, data: Partial<Contact>): Contact | undefined => {
    const idx = contacts.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    const updated = { ...contacts[idx], ...data, updatedAt: new Date().toISOString().slice(0, 10) };
    contacts = [...contacts.slice(0, idx), updated, ...contacts.slice(idx + 1)];
    return updated;
  },
  archive: (id: string): Contact | undefined => contactStore.update(id, { status: 'archived' }),
};

// ==================== COST CENTERS ====================
let costCenters: CostCenter[] = [
  { id: 'cc1', name: 'Manufacturing', description: 'Production and assembly', status: 'active', createdAt: '2024-01-01' },
  { id: 'cc2', name: 'Marketing', description: 'Marketing and promotions', status: 'active', createdAt: '2024-01-01' },
  { id: 'cc3', name: 'Operations', description: 'Daily operations', status: 'active', createdAt: '2024-01-01' },
  { id: 'cc4', name: 'Logistics', description: 'Warehouse and delivery', status: 'active', createdAt: '2024-01-01' },
  { id: 'cc5', name: 'Admin', description: 'Administration', status: 'active', createdAt: '2024-01-01' },
];

export const costCenterStore = {
  getAll: (): CostCenter[] => [...costCenters],
  getActive: (): CostCenter[] => costCenters.filter(cc => cc.status === 'active'),
  getById: (id: string): CostCenter | undefined => costCenters.find(cc => cc.id === id),
  create: (data: Omit<CostCenter, 'id' | 'createdAt'>): CostCenter => {
    const cc: CostCenter = { ...data, id: 'cc' + Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
    costCenters = [...costCenters, cc];
    return cc;
  },
  update: (id: string, data: Partial<CostCenter>): CostCenter | undefined => {
    const idx = costCenters.findIndex(cc => cc.id === id);
    if (idx === -1) return undefined;
    costCenters = [...costCenters.slice(0, idx), { ...costCenters[idx], ...data }, ...costCenters.slice(idx + 1)];
    return costCenters[idx];
  },
};

// ==================== PRODUCTS ====================
let products: Product[] = [
  { id: 'p1', name: 'Classic Sofa Set', category: 'sofa', price: 45000, status: 'active', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
  { id: 'p2', name: 'King Size Bed', category: 'bed', price: 35000, status: 'active', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
  { id: 'p3', name: 'Dining Table 6 Seater', category: 'table', price: 28000, status: 'active', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
  { id: 'p4', name: 'Office Chair', category: 'chair', price: 8500, status: 'active', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
  { id: 'p5', name: 'Sliding Wardrobe', category: 'wardrobe', price: 52000, status: 'active', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
];

export const productStore = {
  getAll: (): Product[] => [...products],
  getActive: (): Product[] => products.filter(p => p.status === 'active'),
  getById: (id: string): Product | undefined => products.find(p => p.id === id),
  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString().slice(0, 10);
    const product: Product = { ...data, id: 'p' + Date.now(), createdAt: now, updatedAt: now };
    products = [...products, product];
    return product;
  },
  update: (id: string, data: Partial<Product>): Product | undefined => {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const now = new Date().toISOString().slice(0, 10);
    products = [...products.slice(0, idx), { ...products[idx], ...data, updatedAt: now }, ...products.slice(idx + 1)];
    return products[idx];
  },
};

// ==================== BUDGETS ====================
let budgets: Budget[] = [
  { id: 'b1', name: 'Q1 Manufacturing', costCenterId: 'cc1', periodStart: '2024-01-01', periodEnd: '2024-03-31', plannedAmount: 50000, actualAmount: 42000, remainingBalance: 8000, achievementPercentage: 84, status: 'under_budget', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'b2', name: 'Q1 Marketing', costCenterId: 'cc2', periodStart: '2024-01-01', periodEnd: '2024-03-31', plannedAmount: 25000, actualAmount: 28000, remainingBalance: -3000, achievementPercentage: 112, status: 'over_budget', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'b3', name: 'Q1 Operations', costCenterId: 'cc3', periodStart: '2024-01-01', periodEnd: '2024-03-31', plannedAmount: 30000, actualAmount: 26000, remainingBalance: 4000, achievementPercentage: 87, status: 'under_budget', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

let budgetRevisions: BudgetRevision[] = [];

export const budgetStore = {
  getAll: (): Budget[] => budgets.map(b => {
    const cc = costCenters.find(c => c.id === b.costCenterId);
    return { ...b, costCenterName: cc?.name };
  }),
  getById: (id: string): Budget | undefined => {
    const b = budgets.find(x => x.id === id);
    if (!b) return undefined;
    const cc = costCenters.find(c => c.id === b.costCenterId);
    return { ...b, costCenterName: cc?.name };
  },
  getRevisions: (budgetId: string): BudgetRevision[] => budgetRevisions.filter(r => r.budgetId === budgetId),
  create: (data: Omit<Budget, 'id' | 'actualAmount' | 'remainingBalance' | 'achievementPercentage' | 'status' | 'createdAt' | 'updatedAt'>): Budget => {
    const b: Budget = {
      ...data,
      id: 'b' + Date.now(),
      actualAmount: 0,
      remainingBalance: data.plannedAmount,
      achievementPercentage: 0,
      status: 'under_budget',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    budgets = [...budgets, b];
    return budgetStore.getById(b.id)!;
  },
  update: (id: string, data: Partial<Pick<Budget, 'plannedAmount' | 'name' | 'periodStart' | 'periodEnd'>>): Budget | undefined => {
    const idx = budgets.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    const prev = budgets[idx];
    if (data.plannedAmount !== undefined && data.plannedAmount !== prev.plannedAmount) {
      budgetRevisions = [...budgetRevisions, {
        id: 'rev' + Date.now(),
        budgetId: id,
        previousAmount: prev.plannedAmount,
        newAmount: data.plannedAmount,
        reason: 'Revision',
        revisedBy: 'Admin',
        revisedAt: new Date().toISOString(),
      }];
    }
    const updated: Budget = {
      ...prev,
      ...data,
      remainingBalance: (data.plannedAmount ?? prev.plannedAmount) - prev.actualAmount,
      achievementPercentage: Math.round((prev.actualAmount / (data.plannedAmount ?? prev.plannedAmount)) * 100),
      status: prev.actualAmount <= (data.plannedAmount ?? prev.plannedAmount) ? (prev.actualAmount >= (data.plannedAmount ?? prev.plannedAmount) * 0.8 ? 'near_limit' : 'under_budget') : 'over_budget',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    budgets = [...budgets.slice(0, idx), updated, ...budgets.slice(idx + 1)];
    return budgetStore.getById(id);
  },
  addActual: (costCenterId: string, amount: number): void => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    budgets = budgets.map(b => {
      if (b.costCenterId !== costCenterId || today < b.periodStart || today > b.periodEnd) return b;
      const newActual = b.actualAmount + amount;
      const remaining = b.plannedAmount - newActual;
      const pct = Math.round((newActual / b.plannedAmount) * 100);
      const status: Budget['status'] = newActual > b.plannedAmount ? 'over_budget' : pct >= 80 ? 'near_limit' : 'under_budget';
      return { ...b, actualAmount: newActual, remainingBalance: remaining, achievementPercentage: pct, status, updatedAt: today };
    });
  },
};

// ==================== AUTO ANALYTICAL RULES ====================
let analyticalRules: AutoAnalyticalRule[] = [
  { id: 'r1', name: 'Sofa → Manufacturing', ruleType: 'category', category: 'sofa', costCenterId: 'cc1', priority: 1, enabled: true, createdAt: '2024-01-01' },
  { id: 'r2', name: 'Office → Admin', ruleType: 'category', category: 'office', costCenterId: 'cc5', priority: 2, enabled: true, createdAt: '2024-01-01' },
];

export const analyticalRuleStore = {
  getAll: (): AutoAnalyticalRule[] => [...analyticalRules].sort((a, b) => a.priority - b.priority),
  getById: (id: string): AutoAnalyticalRule | undefined => analyticalRules.find(r => r.id === id),
  create: (data: Omit<AutoAnalyticalRule, 'id' | 'createdAt'>): AutoAnalyticalRule => {
    const rule: AutoAnalyticalRule = { ...data, id: 'r' + Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
    analyticalRules = [...analyticalRules, rule].sort((a, b) => a.priority - b.priority);
    return rule;
  },
  update: (id: string, data: Partial<AutoAnalyticalRule>): AutoAnalyticalRule | undefined => {
    const idx = analyticalRules.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    analyticalRules = [...analyticalRules.slice(0, idx), { ...analyticalRules[idx], ...data }, ...analyticalRules.slice(idx + 1)].sort((a, b) => a.priority - b.priority);
    return analyticalRules.find(r => r.id === id);
  },
  delete: (id: string): boolean => {
    const before = analyticalRules.length;
    analyticalRules = analyticalRules.filter(r => r.id !== id);
    return analyticalRules.length < before;
  },
};

// ==================== PURCHASE ORDERS ====================
let purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    orderNumber: 'PO-2024-001',
    vendorId: 'c1',
    vendorName: 'ABC Furniture Mart',
    orderDate: '2024-01-15',
    status: 'posted',
    lineItems: [
      { id: 'li1', productId: 'p1', productName: 'Classic Sofa Set', quantity: 2, unitPrice: 45000, amount: 90000, costCenterId: 'cc1', costCenterName: 'Manufacturing' },
    ],
    subtotal: 90000,
    tax: 16200,
    total: 106200,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
];

export const purchaseOrderStore = {
  getAll: (): PurchaseOrder[] => purchaseOrders.map(po => ({
    ...po,
    vendorName: contactStore.getById(po.vendorId)?.name ?? po.vendorName,
    lineItems: po.lineItems.map(li => ({ ...li, productName: productStore.getById(li.productId)?.name ?? li.productName, costCenterName: li.costCenterId ? costCenterStore.getById(li.costCenterId)?.name : undefined })),
  })),
  getById: (id: string): PurchaseOrder | undefined => purchaseOrderStore.getAll().find(po => po.id === id),
  create: (data: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): PurchaseOrder => {
    const num = purchaseOrders.length + 1;
    const orderNumber = `PO-2024-${String(num).padStart(3, '0')}`;
    const po: PurchaseOrder = { ...data, id: 'po' + Date.now(), orderNumber, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
    purchaseOrders = [...purchaseOrders, po];
    
    // Automatically create vendor bill when PO is created
    const billData = {
      purchaseOrderId: po.id,
      vendorId: po.vendorId,
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days from now
      status: 'posted' as const,
      lineItems: po.lineItems,
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
    };
    
    // Create vendor bill
    const bill: VendorBill = {
      ...billData,
      id: 'vb' + Date.now(),
      billNumber: `VB-2024-${String(vendorBills.length + 1).padStart(3, '0')}`,
      paidAmount: 0,
      paymentStatus: 'not_paid' as const,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    vendorBills = [...vendorBills, bill];
    
    // Update budget with actual expenses
    po.lineItems.forEach(li => {
      if (li.costCenterId) {
        budgetStore.addActual(li.costCenterId, li.amount);
      }
    });
    
    return purchaseOrderStore.getById(po.id)!;
  },
  update: (id: string, data: Partial<PurchaseOrder>): PurchaseOrder | undefined => {
    const idx = purchaseOrders.findIndex(po => po.id === id);
    if (idx === -1) return undefined;
    const updated = { ...purchaseOrders[idx], ...data, updatedAt: new Date().toISOString().slice(0, 10) };
    purchaseOrders = [...purchaseOrders.slice(0, idx), updated, ...purchaseOrders.slice(idx + 1)];
    return purchaseOrderStore.getById(id);
  },
};

// ==================== VENDOR BILLS ====================
let vendorBills: VendorBill[] = [
  {
    id: 'vb1',
    billNumber: 'VB-2024-001',
    purchaseOrderId: 'po1',
    vendorId: 'c1',
    vendorName: 'ABC Furniture Mart',
    billDate: '2024-01-20',
    dueDate: '2024-02-20',
    status: 'posted',
    paymentStatus: 'partially_paid',
    lineItems: [
      { id: 'vbli1', productId: 'p1', productName: 'Classic Sofa Set', quantity: 2, unitPrice: 45000, amount: 90000, costCenterId: 'cc1', costCenterName: 'Manufacturing' },
    ],
    subtotal: 90000,
    tax: 16200,
    total: 106200,
    paidAmount: 50000,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
  },
];

export const vendorBillStore = {
  getAll: (): VendorBill[] => vendorBills.map(vb => ({
    ...vb,
    vendorName: contactStore.getById(vb.vendorId)?.name ?? vb.vendorName,
    lineItems: vb.lineItems.map(li => ({ ...li, productName: productStore.getById(li.productId)?.name ?? li.productName })),
  })),
  getById: (id: string): VendorBill | undefined => vendorBillStore.getAll().find(vb => vb.id === id),
  create: (data: Omit<VendorBill, 'id' | 'billNumber' | 'paidAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'>): VendorBill => {
    const num = vendorBills.length + 1;
    const bill: VendorBill = {
      ...data,
      id: 'vb' + Date.now(),
      billNumber: `VB-2024-${String(num).padStart(3, '0')}`,
      paidAmount: 0,
      paymentStatus: 'not_paid',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    vendorBills = [...vendorBills, bill];
    return vendorBillStore.getById(bill.id)!;
  },
  recordPayment: (billId: string, amount: number): void => {
    const idx = vendorBills.findIndex(vb => vb.id === billId);
    if (idx === -1) return;
    const vb = vendorBills[idx];
    const newPaid = vb.paidAmount + amount;
    const paymentStatus: VendorBill['paymentStatus'] = newPaid >= vb.total ? 'paid' : newPaid > 0 ? 'partially_paid' : 'not_paid';
    vendorBills = [...vendorBills.slice(0, idx), { ...vb, paidAmount: newPaid, paymentStatus, updatedAt: new Date().toISOString().slice(0, 10) }, ...vendorBills.slice(idx + 1)];
    vb.lineItems.forEach(li => {
      if (li.costCenterId) budgetStore.addActual(li.costCenterId, (amount / vb.total) * li.amount);
    });
  },
};

// ==================== BILL PAYMENTS ====================
let billPayments: BillPayment[] = [
  { id: 'bp1', billId: 'vb1', billNumber: 'VB-2024-001', amount: 50000, paymentMode: 'BANK_TRANSFER', paymentDate: '2024-01-25', referenceId: 'TXN001', createdAt: '2024-01-25' },
];

export const billPaymentStore = {
  getAll: (): BillPayment[] => billPayments.map(bp => ({ ...bp, billNumber: vendorBillStore.getById(bp.billId)?.billNumber })),
  getByBillId: (billId: string): BillPayment[] => billPayments.filter(bp => bp.billId === billId),
  create: (data: Omit<BillPayment, 'id' | 'createdAt'>): BillPayment => {
    const bp: BillPayment = { ...data, id: 'bp' + Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
    billPayments = [...billPayments, bp];
    vendorBillStore.recordPayment(data.billId, data.amount);
    return { ...bp, billNumber: vendorBillStore.getById(data.billId)?.billNumber };
  },
};

// ==================== SALES ORDERS ====================
let salesOrders: SalesOrder[] = [
  {
    id: 'so1',
    orderNumber: 'SO-2024-001',
    customerId: 'c2',
    customerName: 'John Customer',
    orderDate: '2024-01-18',
    status: 'posted',
    lineItems: [
      { id: 'soli1', productId: 'p1', productName: 'Classic Sofa Set', quantity: 1, unitPrice: 55000, amount: 55000, costCenterId: 'cc1', costCenterName: 'Manufacturing' },
    ],
    subtotal: 55000,
    discount: 0,
    tax: 9900,
    total: 64900,
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
  },
];

export const salesOrderStore = {
  getAll: (): SalesOrder[] => salesOrders.map(so => ({
    ...so,
    customerName: contactStore.getById(so.customerId)?.name ?? so.customerName,
    lineItems: so.lineItems.map(li => ({ ...li, productName: productStore.getById(li.productId)?.name ?? li.productName })),
  })),
  getById: (id: string): SalesOrder | undefined => salesOrderStore.getAll().find(so => so.id === id),
  create: (data: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): SalesOrder => {
    const num = salesOrders.length + 1;
    const so: SalesOrder = { ...data, id: 'so' + Date.now(), orderNumber: `SO-2024-${String(num).padStart(3, '0')}`, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
    salesOrders = [...salesOrders, so];
    return salesOrderStore.getById(so.id)!;
  },
  update: (id: string, data: Partial<SalesOrder>): SalesOrder | undefined => {
    const idx = salesOrders.findIndex(so => so.id === id);
    if (idx === -1) return undefined;
    salesOrders = [...salesOrders.slice(0, idx), { ...salesOrders[idx], ...data, updatedAt: new Date().toISOString().slice(0, 10) }, ...salesOrders.slice(idx + 1)];
    return salesOrderStore.getById(id);
  },
};

// ==================== CUSTOMER INVOICES ====================
let customerInvoices: CustomerInvoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2024-001',
    salesOrderId: 'so1',
    customerId: 'c2',
    customerName: 'John Customer',
    invoiceDate: '2024-01-19',
    dueDate: '2024-02-19',
    status: 'posted',
    paymentStatus: 'partially_paid',
    lineItems: [
      { id: 'invli1', productId: 'p1', productName: 'Classic Sofa Set', quantity: 1, unitPrice: 55000, amount: 55000 },
    ],
    subtotal: 55000,
    discount: 0,
    tax: 9900,
    total: 64900,
    paidAmount: 30000,
    createdAt: '2024-01-19',
    updatedAt: '2024-01-19',
  },
];

export const customerInvoiceStore = {
  getAll: (): CustomerInvoice[] => customerInvoices.map(inv => ({
    ...inv,
    customerName: contactStore.getById(inv.customerId)?.name ?? inv.customerName,
  })),
  getById: (id: string): CustomerInvoice | undefined => customerInvoiceStore.getAll().find(inv => inv.id === id),
  getByCustomerId: (customerId: string): CustomerInvoice[] => customerInvoices.filter(inv => inv.customerId === customerId),
  create: (data: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'>): CustomerInvoice => {
    const num = customerInvoices.length + 1;
    const inv: CustomerInvoice = {
      ...data,
      id: 'inv' + Date.now(),
      invoiceNumber: `INV-2024-${String(num).padStart(3, '0')}`,
      paidAmount: 0,
      paymentStatus: 'not_paid',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    customerInvoices = [...customerInvoices, inv];
    return customerInvoiceStore.getById(inv.id)!;
  },
  recordPayment: (invoiceId: string, amount: number): void => {
    const idx = customerInvoices.findIndex(inv => inv.id === invoiceId);
    if (idx === -1) return;
    const inv = customerInvoices[idx];
    const newPaid = inv.paidAmount + amount;
    const paymentStatus: CustomerInvoice['paymentStatus'] = newPaid >= inv.total ? 'paid' : newPaid > 0 ? 'partially_paid' : 'not_paid';
    customerInvoices = [...customerInvoices.slice(0, idx), { ...inv, paidAmount: newPaid, paymentStatus, updatedAt: new Date().toISOString().slice(0, 10) }, ...customerInvoices.slice(idx + 1)];
  },
};

// ==================== INVOICE PAYMENTS ====================
let invoicePayments: InvoicePayment[] = [
  { id: 'ip1', invoiceId: 'inv1', invoiceNumber: 'INV-2024-001', amount: 30000, paymentMode: 'UPI', paymentDate: '2024-01-22', referenceId: 'UPI123', createdAt: '2024-01-22' },
];

export const invoicePaymentStore = {
  getAll: (): InvoicePayment[] => invoicePayments.map(ip => ({ ...ip, invoiceNumber: customerInvoiceStore.getById(ip.invoiceId)?.invoiceNumber })),
  getByInvoiceId: (invoiceId: string): InvoicePayment[] => invoicePayments.filter(ip => ip.invoiceId === invoiceId),
  getByCustomerId: (customerId: string): InvoicePayment[] => {
    const invIds = customerInvoices.filter(inv => inv.customerId === customerId).map(inv => inv.id);
    return invoicePayments.filter(ip => invIds.includes(ip.invoiceId)).map(ip => ({ ...ip, invoiceNumber: customerInvoiceStore.getById(ip.invoiceId)?.invoiceNumber }));
  },
  create: (data: Omit<InvoicePayment, 'id' | 'createdAt'>): InvoicePayment => {
    const ip: InvoicePayment = { ...data, id: 'ip' + Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
    invoicePayments = [...invoicePayments, ip];
    customerInvoiceStore.recordPayment(data.invoiceId, data.amount);
    return { ...ip, invoiceNumber: customerInvoiceStore.getById(data.invoiceId)?.invoiceNumber };
  },
};

// ==================== HELPERS ====================
export function computeLineItemsTotal(items: LineItem[], taxRate: number = DEFAULT_TAX_RATE, discount: number = 0): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, li) => sum + li.amount, 0);
  const afterDiscount = subtotal - discount;
  const tax = Math.round(afterDiscount * taxRate);
  const total = afterDiscount + tax;
  return { subtotal, tax, total };
}
