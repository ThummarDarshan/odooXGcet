
import api from './api';
import { Budget, SalesOrder, CustomerInvoice } from '@/types';

// Helper function to transform snake_case to camelCase
const transformInvoice = (invoice: any): CustomerInvoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    salesOrderId: invoice.sales_order_id,
    customerId: invoice.customer_id,
    customerName: invoice.customer?.name,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    paymentStatus: invoice.payment_status,
    lineItems: invoice.items?.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.total_amount,
        costCenterId: item.analytical_account_id,
        costCenterName: item.analytical_account?.name
    })) || [],
    subtotal: invoice.subtotal,
    discount: 0, // Not in backend schema
    tax: invoice.tax_amount,
    total: invoice.total_amount,
    paidAmount: invoice.paid_amount,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at
});

const transformBudget = (budget: any): Budget => ({
    id: budget.id,
    name: budget.name,
    costCenterId: budget.cost_center_id,
    costCenterName: budget.cost_center?.name,
    type: budget.type,
    periodStart: budget.period_start,
    periodEnd: budget.period_end,
    plannedAmount: budget.budgeted_amount,
    actualAmount: budget.actual_amount || 0,
    reservedAmount: budget.reserved_amount || 0,
    remainingBalance: budget.budgeted_amount - (budget.actual_amount || 0),
    achievementPercentage: budget.budgeted_amount > 0
        ? Math.round(((budget.actual_amount || 0) / budget.budgeted_amount) * 100)
        : 0,
    stage: budget.status,
    version: budget.version || 1,
    revisionOfId: budget.revision_of_id,
    nextVersionId: budget.next_version_id,
    status: budget.actual_amount > budget.budgeted_amount ? 'over_budget'
        : budget.actual_amount > budget.budgeted_amount * 0.9 ? 'near_limit'
            : 'under_budget',
    createdAt: budget.created_at,
    updatedAt: budget.updated_at
});

const transformSalesOrder = (order: any): SalesOrder => ({
    id: order.id,
    orderNumber: order.so_number,
    customerId: order.customer_id,
    customerName: order.customer?.name,
    reference: order.reference,
    orderDate: order.order_date,
    status: order.status,
    lineItems: order.items?.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.total_amount,
        costCenterId: item.analytical_account_id,
        costCenterName: item.analytical_account?.name
    })) || [],
    subtotal: order.subtotal,
    discount: 0,
    tax: order.tax_amount,
    total: order.total_amount,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at
});

export const reportService = {
    getBudgets: async (): Promise<Budget[]> => {
        const response = await api.get('/budgets?limit=1000');
        return response.data.data.map(transformBudget);
    },

    getSalesOrders: async (): Promise<SalesOrder[]> => {
        const response = await api.get('/sales-orders?limit=1000');
        return response.data.data.map(transformSalesOrder);
    },

    getCustomerInvoices: async (): Promise<CustomerInvoice[]> => {
        const response = await api.get('/customer-invoices?limit=1000');
        return response.data.data.map(transformInvoice);
    }
};
