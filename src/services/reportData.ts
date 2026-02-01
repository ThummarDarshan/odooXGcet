
import api from './api';
import { Budget, SalesOrder, CustomerInvoice } from '@/types';

export const reportService = {
    getBudgets: async (): Promise<Budget[]> => {
        const response = await api.get('/budgets?limit=1000'); // Fetch all for report
        return response.data.data;
    },

    getSalesOrders: async (): Promise<SalesOrder[]> => {
        const response = await api.get('/sales-orders?limit=1000');
        return response.data.data;
    },

    getCustomerInvoices: async (): Promise<CustomerInvoice[]> => {
        const response = await api.get('/customer-invoices?limit=1000');
        return response.data.data;
    }
};
