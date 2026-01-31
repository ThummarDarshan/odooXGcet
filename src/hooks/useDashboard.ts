import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useDashboardMetrics = () => {
    return useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/metrics');
            return data.data;
        },
        retry: 1,
        staleTime: 30000, // 30 seconds
    });
};

export const useDashboardTrends = () => {
    return useQuery({
        queryKey: ['dashboard-trends'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/trends');
            return data.data;
        },
        retry: 1,
        staleTime: 30000,
    });
};

export const useDashboardExpenseDistribution = () => {
    return useQuery({
        queryKey: ['dashboard-expenses'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/expenses');
            return data.data;
        },
        retry: 1,
        staleTime: 30000,
    });
};

export const useDashboardBudgets = () => {
    return useQuery({
        queryKey: ['dashboard-budgets'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/budgets');
            return data.data;
        },
        retry: 1,
        staleTime: 30000,
    });
};
