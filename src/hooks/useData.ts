import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Contact, Product, CostCenter, Budget, SalesOrder, PurchaseOrder } from '@/types';

// ================= CONTACTS =================
export const useContacts = (type?: 'customer' | 'vendor') => {
    return useQuery<Contact[]>({
        queryKey: ['contacts', type],
        queryFn: async () => {
            const { data } = await api.get('/contacts');
            const raw = data.data || data;

            let contacts = raw;
            if (type === 'customer') contacts = raw.filter((c: any) => c.type === 'CUSTOMER' || c.type === 'BOTH');
            if (type === 'vendor') contacts = raw.filter((c: any) => c.type === 'VENDOR' || c.type === 'BOTH');

            return contacts.map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                type: c.type,
                // Map separate address fields
                street: c.street,
                city: c.city,
                state: c.state,
                country: c.country,
                pincode: c.pincode,
                portalAccess: !!c.user_id,
                status: c.is_active ? 'confirmed' : 'archived',
                tags: c.tag ? [c.tag.name] : [],
                createdAt: c.created_at,
                updatedAt: c.updated_at
            }));
        }
    });
};

export const useContact = (id: string | undefined) => {
    return useQuery<Contact>({
        queryKey: ['contacts', id],
        queryFn: async () => {
            const { data } = await api.get(`/contacts/${id}`);
            const contact = data.data || data; // Unwrap the response
            return {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                type: contact.type.toLowerCase() as 'customer' | 'vendor',
                // Map separate address fields
                street: contact.street,
                city: contact.city,
                state: contact.state,
                country: contact.country,
                pincode: contact.pincode,
                portalAccess: !!contact.user_id,
                status: contact.is_active ? 'confirmed' : 'archived',
                tags: contact.tag ? [contact.tag.name] : [],
                createdAt: contact.created_at,
                updatedAt: contact.updated_at
            };
        },
        enabled: !!id
    });
};

export const useCreateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            // Combine address fields if needed or send as is
            const payload = { ...data, address: data.street ? `${data.street} ${data.city || ''}` : data.address };
            const { data: result } = await api.post('/contacts', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    });
};

export const useUpdateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const { data: result } = await api.patch(`/contacts/${id}`, data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    });
};

export const useArchiveContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/contacts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    });
};

// ================= PRODUCTS =================
export const useProducts = (filters?: { limit?: number, search?: string, status?: string }) => {
    return useQuery<Product[]>({
        queryKey: ['products', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.search) params.append('search', filters.search);
            if (filters?.status) params.append('status', filters.status);

            const { data } = await api.get(`/products?${params.toString()}`);
            const raw = data.data || data;
            return raw.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: Number(p.sell_price),
                purchasePrice: Number(p.purchase_price),
                status: p.is_active ? 'confirmed' : 'archived',
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
        }
    });
};

export const useProduct = (id: string | undefined) => {
    return useQuery<Product>({
        queryKey: ['products', id],
        queryFn: async () => {
            const { data } = await api.get(`/products/${id}`);
            const product = data.data || data; // Unwrap the response
            return {
                id: product.id,
                name: product.name,
                category: product.category,
                price: Number(product.sell_price),
                purchasePrice: Number(product.purchase_price),
                status: product.is_active ? 'confirmed' : 'archived',
                createdAt: product.created_at,
                updatedAt: product.updated_at
            };
        },
        enabled: !!id
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                name: data.name,
                category: data.category,
                sellPrice: data.price,
                purchasePrice: data.purchasePrice,
                description: data.description,
                is_active: data.status === 'confirmed'
            };
            const { data: result } = await api.post('/products', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const payload = {
                ...data,
                sellPrice: data.price,
                purchasePrice: data.purchasePrice,
                is_active: data.status === undefined ? undefined : (data.status === 'confirmed')
            };
            const { data: result } = await api.patch(`/products/${id}`, payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

export const useArchiveProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

// ================= BUDGETS =================
// ================= BUDGETS =================
export const useBudgets = () => {
    return useQuery<Budget[]>({
        queryKey: ['budgets'],
        queryFn: async () => {
            const { data } = await api.get('/budgets');
            const raw = data.data || data;
            return raw.map((b: any) => ({
                id: b.id,
                name: b.name,
                costCenterId: b.analytical_account_id,
                costCenterName: b.costCenterName || b.analytical_account?.name,
                type: b.type,
                periodStart: b.start_date,
                periodEnd: b.end_date,
                plannedAmount: Number(b.plannedAmount || b.budgeted_amount),
                actualAmount: Number(b.actualAmount || 0),
                reservedAmount: Number(b.reservedAmount || 0),
                remainingBalance: Number(b.remainingBalance || 0),
                achievementPercentage: Number(b.achievementPercentage || 0),
                status: b.status,
                stage: (b.stage === 'active' || b.stage === 'confirmed') ? 'confirmed' : (b.stage || 'draft'),
                version: b.revision_number || 1,
                revisionOfId: b.parent_budget_id,
                nextVersionId: b.child_budgets?.[0]?.id,
                createdAt: b.created_at,
                updatedAt: b.updated_at
            }));
        }
    });
};

export const useBudget = (id: string | undefined) => {
    return useQuery<Budget>({
        queryKey: ['budgets', id],
        queryFn: async () => {
            const { data } = await api.get(`/budgets/${id}`);
            const b = data.data || data;
            return {
                id: b.id,
                name: b.name,
                costCenterId: b.analytical_account_id,
                costCenterName: b.costCenterName || b.analytical_account?.name,
                type: b.type,
                periodStart: b.start_date,
                periodEnd: b.end_date,
                plannedAmount: Number(b.plannedAmount || b.budgeted_amount),
                actualAmount: Number(b.actualAmount || 0),
                reservedAmount: Number(b.reservedAmount || 0),
                remainingBalance: Number(b.remainingBalance || 0),
                achievementPercentage: Number(b.achievementPercentage || 0),
                status: b.status,
                stage: (b.stage === 'active' || b.stage === 'confirmed') ? 'confirmed' : (b.stage || 'draft'),
                version: b.revision_number || 1,
                revisionOfId: b.parent_budget_id,
                nextVersionId: b.child_budgets?.[0]?.id,
                transactions: b.transactions || [],
                createdAt: b.created_at,
                updatedAt: b.updated_at
            };
        },
        enabled: !!id
    });
};

export const useCreateBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                name: data.name,
                costCenterId: data.costCenterId,
                type: data.type,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                plannedAmount: data.plannedAmount,
                description: data.description,
                parent_budget_id: data.revisionOfId,
                revision_number: data.version
            };
            const { data: result } = await api.post('/budgets', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }
    });
};

export const useUpdateBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            // Mapping
            const payload: any = { ...data };
            if (data.status === 'confirmed') payload.status = 'ACTIVE'; // Map stage to backend status
            if (data.status === 'archived') payload.status = 'ARCHIVED';
            // If revising, that's likely a separate flow (create new), but update handles basic field edits
            const { data: result } = await api.patch(`/budgets/${id}`, payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }
    });
};

export const useArchiveBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/budgets/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }
    });
};


// ================= COST CENTERS =================
export const useCostCenters = () => {
    return useQuery<CostCenter[]>({
        queryKey: ['cost-centers'],
        queryFn: async () => {
            const { data } = await api.get('/cost-centers');
            return data.data.map((cc: any) => ({
                id: cc.id,
                name: cc.name,
                code: cc.code,
                description: cc.description,
                status: cc.is_active ? 'active' : 'inactive',
                createdAt: cc.created_at
            }));
        }
    });
};

export const useCostCenter = (id: string | undefined) => {
    return useQuery<CostCenter>({
        queryKey: ['cost-centers', id],
        queryFn: async () => {
            const { data } = await api.get(`/cost-centers/${id}`);
            // Backend currently returns the object directly, but we check for data wrapper just in case
            const cc = data.data || data;
            return {
                id: cc.id,
                name: cc.name,
                code: cc.code,
                description: cc.description,
                status: cc.is_active ? 'active' : 'inactive',
                createdAt: cc.created_at
            };
        },
        enabled: !!id
    });
};

export const useCreateCostCenter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                name: data.name,
                code: data.code,
                description: data.description,
                is_active: data.status === 'active'
            };
            const { data: result } = await api.post('/cost-centers', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
        }
    });
};

export const useUpdateCostCenter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const payload = {
                ...data,
                is_active: data.status === undefined ? undefined : (data.status === 'active')
            };
            const { data: result } = await api.patch(`/cost-centers/${id}`, payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
        }
    });
};


// ================= ANALYTICAL RULES =================
export const useAnalyticalRules = () => {
    return useQuery({
        queryKey: ['analytical-rules'],
        queryFn: async () => {
            const { data } = await api.get('/analytical/rules');
            const list = data.data || data || [];
            return list.map((r: any) => ({
                id: r.id,
                name: r.name,
                ruleType: r.ruleType || (r.product_id ? 'product' : 'category'),
                productId: r.product_id,
                productName: r.productName || r.product?.name,
                category: r.product_category,
                costCenterId: r.analytical_account_id,
                costCenterName: r.costCenterName || r.analytical_account?.name,
                priority: r.priority,
                enabled: r.is_active !== undefined ? r.is_active : r.enabled
            }));
        }
    });
};

export const useAnalyticalRule = (id: string | undefined) => {
    return useQuery({
        queryKey: ['analytical-rules', id],
        queryFn: async () => {
            const { data } = await api.get(`/analytical/rules/${id}`);
            const r = data.data || data;
            return {
                id: r.id,
                name: r.name,
                ruleType: r.ruleType || (r.product_id ? 'product' : 'category'),
                productId: r.product_id,
                category: r.product_category,
                costCenterId: r.analytical_account_id,
                priority: r.priority,
                enabled: r.is_active !== undefined ? r.is_active : r.enabled
            };
        },
        enabled: !!id
    });
};

export const useCreateAnalyticalRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload: any = {
                name: data.name,
                analytical_account_id: data.costCenterId,
                priority: Number(data.priority),
                is_active: data.enabled
            };

            if (data.ruleType === 'product') {
                payload.product_id = data.productId;
            } else {
                payload.product_category = data.category;
            }
            const { data: result } = await api.post('/analytical/rules', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['analytical-rules'] });
        }
    });
};

export const useUpdateAnalyticalRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const payload: any = {
                name: data.name,
                analytical_account_id: data.costCenterId,
                priority: data.priority !== undefined ? Number(data.priority) : undefined,
                is_active: data.enabled
            };

            if (data.ruleType === 'product') {
                payload.product_id = data.productId;
                payload.product_category = null;
            } else if (data.ruleType === 'category') {
                payload.product_category = data.category;
                payload.product_id = null;
            }
            const { data: result } = await api.patch(`/analytical/rules/${id}`, payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['analytical-rules'] });
        }
    });
};

// ================= SALES ORDERS =================
export const useSalesOrders = () => {
    return useQuery<SalesOrder[]>({
        queryKey: ['sales-orders'],
        queryFn: async () => {
            const { data } = await api.get('/sales-orders');
            const raw = data.data || data;
            return raw.map((so: any) => ({
                id: so.id,
                orderNumber: so.so_number,
                customerId: so.customer_id,
                customerName: so.customer?.name,
                orderDate: so.order_date,
                status: so.status ? so.status.toLowerCase() : 'draft',
                subtotal: Number(so.subtotal),
                tax: Number(so.tax_amount),
                total: Number(so.total_amount),
                createdAt: so.created_at,
                updatedAt: so.updated_at,
                lineItems: so.items?.map((item: any) => ({
                    id: item.id,
                    productId: item.product_id,
                    productName: item.product?.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                    amount: Number(item.total_amount)
                })) || []
            }));
        }
    });
};

export const useCreateSalesOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                customer_id: data.customerId,
                order_date: data.orderDate,
                items: data.lineItems.map((li: any) => ({
                    product_id: li.productId,
                    quantity: li.quantity,
                    unit_price: li.unitPrice,
                    tax_rate: 18,
                    // If cost center is selected
                    analytical_account_id: li.costCenterId
                }))
            };
            const { data: result } = await api.post('/sales-orders', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
        }
    });
};

// ================= SALES ORDERS =================
export const useSalesOrder = (id: string | undefined) => {
    return useQuery<SalesOrder>({
        queryKey: ['sales-orders', id],
        queryFn: async () => {
            const { data } = await api.get(`/sales-orders/${id}`);
            const so = data.data || data;
            return {
                id: so.id,
                orderNumber: so.so_number,
                customerId: so.customer_id,
                customerName: so.customer?.name,
                orderDate: so.order_date,
                status: so.status ? so.status.toLowerCase() : 'draft',
                subtotal: Number(so.subtotal),
                tax: Number(so.tax_amount),
                discount: 0,
                total: Number(so.total_amount),
                createdAt: so.created_at,
                updatedAt: so.updated_at,
                lineItems: so.items?.map((item: any) => ({
                    id: item.id,
                    productId: item.product_id,
                    productName: item.product?.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                    amount: Number(item.total_amount)
                })) || []
            };
        },
        enabled: !!id
    });
};

export const useUpdateSalesOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const payload: any = { ...data };
            // Ensure status is uppercase if present
            if (data.status) payload.status = data.status.toUpperCase();

            // If items are present, map them back to snake_case if needed by backend?
            // Backend update expects: items: [{ product_id, quantity, unit_price }]
            if (data.lineItems) {
                payload.items = data.lineItems.map((li: any) => ({
                    product_id: li.productId,
                    quantity: li.quantity,
                    unit_price: li.unitPrice,
                    tax_rate: 18 // Default to 18%
                }));
                delete payload.lineItems;
            }
            // Map other fields
            if (data.customerId) { payload.customer_id = data.customerId; delete payload.customerId; }
            if (data.orderDate) { payload.order_date = data.orderDate; delete payload.orderDate; }

            const { data: result } = await api.patch(`/sales-orders/${id}`, payload);
            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
            queryClient.invalidateQueries({ queryKey: ['sales-orders', variables.id] });
        }
    });
};

// ================= PURCHASE ORDERS =================
export const usePurchaseOrders = (filters?: { status?: string; vendorId?: string; limit?: number }) => {
    return useQuery<PurchaseOrder[]>({
        queryKey: ['purchase-orders', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.vendorId) params.append('vendorId', filters.vendorId);
            if (filters?.limit) params.append('limit', filters.limit.toString());

            const { data } = await api.get(`/purchase-orders?${params.toString()}`);
            const raw = data.data || data;
            return raw.map((po: any) => ({
                id: po.id,
                orderNumber: po.po_number,
                vendorId: po.vendor_id,
                vendorName: po.vendor?.name,
                orderDate: po.order_date,
                status: po.status ? po.status.toLowerCase() : 'draft',
                subtotal: Number(po.subtotal),
                tax: Number(po.tax_amount),
                total: Number(po.total_amount),
                createdAt: po.created_at,
                updatedAt: po.updated_at,
                lineItems: po.items?.map((item: any) => ({
                    id: item.id,
                    productId: item.product_id,
                    productName: item.product?.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                    amount: Number(item.total_amount),
                    costCenterId: item.analytical_account_id,
                    costCenterName: item.analytical_account?.name
                })) || []
            }));
        }
    });
};

export const usePurchaseOrder = (id: string | undefined) => {
    return useQuery<PurchaseOrder>({
        queryKey: ['purchase-orders', id],
        queryFn: async () => {
            const { data } = await api.get(`/purchase-orders/${id}`);
            const po = data.data || data;
            return {
                id: po.id,
                orderNumber: po.po_number,
                vendorId: po.vendor_id,
                vendorName: po.vendor?.name,
                orderDate: po.order_date,
                status: po.status ? po.status.toLowerCase() : 'draft',
                subtotal: Number(po.subtotal),
                tax: Number(po.tax_amount),
                total: Number(po.total_amount),
                createdAt: po.created_at,
                updatedAt: po.updated_at,
                lineItems: po.items?.map((item: any) => ({
                    id: item.id,
                    productId: item.product_id,
                    productName: item.product?.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                    amount: Number(item.total_amount),
                    costCenterId: item.analytical_account_id,
                    costCenterName: item.analytical_account?.name
                })) || []
            };
        },
        enabled: !!id
    });
};

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                vendorId: data.vendorId,
                orderDate: data.orderDate,
                items: data.lineItems.map((li: any) => ({
                    productId: li.productId,
                    quantity: li.quantity,
                    unitPrice: li.unitPrice,
                    costCenterId: li.costCenterId
                }))
            };
            const { data: result } = await api.post('/purchase-orders', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
        }
    });
};

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            // Check if status update vs full update?
            // PO update logic usually simpler, mostly status or fields if draft.
            // Backend updatePurchaseOrder accepts fields.
            const payload: any = { ...data };
            if (data.status === 'confirmed') payload.status = 'CONFIRMED';
            if (data.status === 'cancelled') payload.status = 'CANCELLED';
            const { data: result } = await api.patch(`/purchase-orders/${id}`, payload);
            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.id] });
        }
    });
};

// ================= VENDOR BILLS =================
export const useVendorBills = () => {
    return useQuery<any[]>({ // Using any[] for now to speed up, or define proper Type
        queryKey: ['vendor-bills'],
        queryFn: async () => {
            const { data } = await api.get('/vendor-bills');
            const raw = data.data || data;
            return raw.map((vb: any) => ({
                id: vb.id,
                billNumber: vb.bill_number,
                vendorId: vb.vendor_id,
                vendorName: vb.vendor?.name,
                date: vb.bill_date,
                dueDate: vb.due_date,
                status: vb.status ? vb.status.toLowerCase() : 'draft',
                paymentStatus: vb.payment_status,
                total: Number(vb.total_amount),
                paidAmount: Number(vb.paid_amount),
                purchaseOrderId: vb.purchase_order_id,
                purchaseOrderNumber: vb.purchase_order?.po_number,
                items: vb.items || []
            }));
        }
    });
};

export const useVendorBill = (id: string | undefined) => {
    return useQuery<any>({
        queryKey: ['vendor-bills', id],
        queryFn: async () => {
            const { data } = await api.get(`/vendor-bills/${id}`);
            const vb = data.data || data;
            return {
                id: vb.id,
                billNumber: vb.bill_number,
                vendorId: vb.vendor_id,
                vendorName: vb.vendor?.name,
                date: vb.bill_date,
                dueDate: vb.due_date,
                status: vb.status ? vb.status.toLowerCase() : 'draft',
                paymentStatus: vb.payment_status,
                total: Number(vb.total_amount),
                paidAmount: Number(vb.paid_amount),
                purchaseOrderId: vb.purchase_order_id,
                purchaseOrderNumber: vb.purchase_order?.po_number,
                items: vb.items?.map((i: any) => ({
                    id: i.id,
                    productId: i.product_id,
                    productName: i.product?.name,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unit_price),
                    amount: Number(i.total_amount),
                    costCenterId: i.analytical_account_id
                })) || []
            };
        },
        enabled: !!id
    });
};

export const useCreateVendorBill = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                vendorId: data.vendorId,
                billDate: data.date,
                dueDate: data.dueDate,
                purchaseOrderId: data.purchaseOrderId,
                items: data.items.map((i: any) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    costCenterId: i.costCenterId
                }))
            };
            const { data: result } = await api.post('/vendor-bills', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
        }
    });
};

export const useUpdateVendorBill = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const payload: any = { ...data };
            if (data.status === 'posted') payload.status = 'POSTED';
            const { data: result } = await api.patch(`/vendor-bills/${id}`, payload);
            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
            queryClient.invalidateQueries({ queryKey: ['vendor-bills', variables.id] });
        }
    });
};


// ================= CUSTOMER INVOICES =================
export const useCustomerInvoices = () => {
    return useQuery<any[]>({
        queryKey: ['customer-invoices'],
        queryFn: async () => {
            const { data } = await api.get('/customer-invoices');
            const raw = data.data || data;
            return raw.map((inv: any) => ({
                id: inv.id,
                invoiceNumber: inv.invoice_number,
                customerId: inv.customer_id,
                customerName: inv.customer?.name,
                date: inv.invoice_date,
                dueDate: inv.due_date,
                status: inv.status ? inv.status.toLowerCase() : 'draft',
                paymentStatus: inv.payment_status,
                total: Number(inv.total_amount),
                paidAmount: Number(inv.paid_amount),
                salesOrderId: inv.sales_order_id,
                items: inv.items || []
            }));
        }
    });
};

export const useCustomerInvoice = (id: string | undefined) => {
    return useQuery<any>({
        queryKey: ['customer-invoices', id],
        queryFn: async () => {
            const { data } = await api.get(`/customer-invoices/${id}`);
            const inv = data.data || data;
            return {
                id: inv.id,
                invoiceNumber: inv.invoice_number,
                customerId: inv.customer_id,
                customerName: inv.customer?.name,
                date: inv.invoice_date,
                dueDate: inv.due_date,
                status: inv.status ? inv.status.toLowerCase() : 'draft',
                paymentStatus: inv.payment_status,
                total: Number(inv.total_amount),
                paidAmount: Number(inv.paid_amount),
                salesOrderId: inv.sales_order_id,
                lineItems: inv.items?.map((i: any) => ({
                    id: i.id,
                    productId: i.product_id,
                    productName: i.product?.name,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unit_price),
                    amount: Number(i.total_amount)
                })) || []
            };
        },
        enabled: !!id
    });
};

export const useCreateCustomerInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                customerId: data.customerId,
                invoiceDate: data.invoiceDate,
                dueDate: data.dueDate,
                salesOrderId: data.salesOrderId,
                items: data.items.map((i: any) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    costCenterId: i.costCenterId
                }))
            };
            const { data: result } = await api.post('/customer-invoices', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
        }
    });
};

export const useUpdateCustomerInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const payload: any = { ...data };
            if (data.status === 'posted') payload.status = 'POSTED';
            const { data: result } = await api.patch(`/customer-invoices/${id}`, payload);
            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['customer-invoices', variables.id] });
        }
    });
};

// ================= PAYMENTS =================
export const usePayments = (filters?: { type?: 'INCOMING' | 'OUTGOING' }) => {
    return useQuery<any[]>({
        queryKey: ['payments', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.type) params.append('type', filters.type);

            const { data } = await api.get(`/payments?${params.toString()}`);
            const raw = data.data || data;
            return raw.map((p: any) => ({
                id: p.id,
                amount: Number(p.amount),
                paymentMode: p.paymentMode,
                paymentDate: p.paymentDate,
                referenceId: p.referenceId,
                paymentType: p.paymentType,
                status: p.status,
                billNumber: p.billNumber,
                invoiceNumber: p.invoiceNumber,
                allocations: p.allocations
            }));
        }
    });
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            // Flexible mapping for different call signatures
            const paymentType = (data.type === 'outbound' || data.paymentType === 'OUTGOING') ? 'OUTGOING' : 'INCOMING';
            const invoiceId = data.billId || data.invoiceId || (data.invoices && data.invoices[0]?.id);
            const isBill = data.isBill || (data.type === 'outbound') || (data.paymentType === 'OUTGOING');

            const payload = {
                paymentDate: data.date || data.paymentDate,
                paymentType: paymentType,
                paymentMethod: data.mode || data.method || data.paymentMode,
                amount: Number(data.amount),
                contactId: data.contactId,
                referenceNumber: data.reference || data.referenceId,
                notes: data.notes,
                invoiceId: invoiceId,
                invoiceType: isBill ? 'VENDOR_BILL' : 'CUSTOMER_INVOICE'
            };
            const { data: result } = await api.post('/payments', payload);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
            queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
        }
    });
};

export const useCreatePaymentOrder = () => {
    return useMutation({
        mutationFn: async (data: { invoice_id: string; amount: number }) => {
            const { data: result } = await api.post('/payments/create-order', data);
            return result.data || result;
        }
    });
};

export const useVerifyPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            invoice_id: string;
            amount: number;
        }) => {
            const { data: result } = await api.post('/payments/verify', data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
        }
    });
};
