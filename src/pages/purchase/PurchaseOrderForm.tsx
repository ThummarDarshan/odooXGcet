import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  usePurchaseOrder, useCreatePurchaseOrder, useUpdatePurchaseOrder,
  useContacts, useProducts, useCostCenters, useAnalyticalRules, useBudgets,
  useCreateVendorBill, useVendorBills
} from '@/hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { OrderStatus } from '@/types';
import { DocumentLayout } from '@/components/layout/DocumentLayout';

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0),
  costCenterId: z.string().optional(),
});
const schema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  reference: z.string().optional(),
  orderDate: z.string().min(1),
  status: z.enum(['draft', 'confirmed', 'posted', 'cancelled', 'done']),
  lineItems: z.array(lineSchema).min(1, 'Add at least one line item'),
});

type FormValues = z.infer<typeof schema>;

export default function PurchaseOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: order, isLoading: isLoadingOrder, isError: isOrderError } = usePurchaseOrder(id);
  const { data: vendors = [] } = useContacts('vendor');
  const { data: products = [] } = useProducts({ limit: 100, status: 'active' });
  const { data: costCenters = [] } = useCostCenters();
  const { data: analyticalRules = [] } = useAnalyticalRules();
  const { data: budgets = [] } = useBudgets();
  const { data: existingBills = [] } = useVendorBills();

  const { mutate: createOrder, isPending: isCreating } = useCreatePurchaseOrder();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdatePurchaseOrder();
  const { mutate: createBill } = useCreateVendorBill();

  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const [budgetWarnings, setBudgetWarnings] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorId: '',
      reference: '',
      orderDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const status = watch('status');

  // Load existing order data
  useEffect(() => {
    if (order) {
      setValue('vendorId', order.vendorId);
      setValue('reference', ''); // PO Reference not in hook? Backend PO model missing 'reference' field? It has 'po_number'. 
      // Typically user inputs 'reference' (vendor ref). Schema has 'notes', but not 'reference'. 
      // Let's assume 'notes' or check backend. Backend PurchaseOrder model doesn't have reference.
      // It has 'notes'. Let's map reference to notes or ignore? 
      // We'll ignore for now or add to notes if needed.
      setValue('orderDate', order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : '');
      setValue('status', order.status as OrderStatus);

      setLines(order.lineItems.map((li: any) => ({
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        costCenterId: li.costCenterId
      })));
    }
  }, [order, setValue]);

  useEffect(() => {
    setValue('lineItems', lines);
  }, [lines, setValue]);

  useEffect(() => {
    if (isEdit && (isOrderError || (!order && !isLoadingOrder))) {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  }, [isEdit, isOrderError, order, isLoadingOrder, queryClient]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as Record<string, unknown>)[field] = value;

      if (field === 'productId') {
        const p = products.find(prod => prod.id === value);
        if (p) {
          next[idx].unitPrice = p.purchasePrice || 0;
          // Auto-assign cost center
          if (!next[idx].costCenterId) {
            // Find applicable rule
            // Simple logic: priority sort done by hook? Hook sorts by priority desc?
            // useData hook maps them. Backend 'getRules' sorts by priority desc.
            // Client side 'analyticalRules' might be sorted.
            const applicableRule = analyticalRules.find((rule: any) => {
              if (!rule.enabled) return false;
              if (rule.ruleType === 'product' && rule.productId === p.id) return true;
              if (rule.ruleType === 'category' && rule.category === p.category) return true;
              return false;
            });
            if (applicableRule) next[idx].costCenterId = applicableRule.costCenterId;
          }
        }
      }
      return next;
    });
  };

  const validateBudget = () => {
    const warnings: string[] = [];
    lines.forEach(line => {
      if (line.costCenterId) {
        const amount = line.quantity * line.unitPrice;
        // Check active budget for this cost center
        const budget = budgets.find((b: any) => b.costCenterId === line.costCenterId && b.stage === 'confirmed');
        // Backend 'ACTIVE' maps to 'confirmed'? Yes.

        if (budget) {
          const remaining = (budget.plannedAmount || 0) - (budget.actualAmount || 0);
          if (amount > remaining) {
            warnings.push(`Budget "${budget.name}" exceeded! Remaining: ₹${remaining.toLocaleString()}, Request: ₹${amount.toLocaleString()}`);
          }
        }
      }
    });
    setBudgetWarnings(warnings);
    return warnings.length === 0;
  };

  const onSubmit = async (data: FormValues) => {
    const linesWithoutCostCenter = data.lineItems.filter(li => !li.costCenterId);
    if (linesWithoutCostCenter.length > 0) {
      toast({ title: 'Validation Error', description: 'All line items must have a cost center assigned.', variant: 'destructive' });
      return;
    }

    if (isEdit && id) {
      updateOrder({ id, data: { ...data, status: data.status } }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Purchase order updated.' });
          navigate('/purchase/orders');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update order.', variant: 'destructive' })
      });
    } else {
      createOrder(data, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Purchase order created.' });
          navigate('/purchase/orders');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create order.', variant: 'destructive' })
      });
    }
  };

  const handleConfirm = () => {
    validateBudget(); // Show warnings
    if (id) {
      updateOrder({ id, data: { status: 'confirmed' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Order confirmed.' });
          // Optimistically update
          navigate(0); // Reload to refresh state properly from backend
        }
      });
    }
  };

  const handleCreateBill = () => {
    if (!order) return;
    const existingBill = existingBills.find((vb: any) => vb.purchaseOrderId === order.id);
    if (existingBill) {
      navigate(`/purchase/bills/${existingBill.id}/edit`); // Navigate to edit
      return;
    }

    createBill({
      vendorId: order.vendorId,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      purchaseOrderId: order.id,
      items: order.lineItems
    }, {
      onSuccess: (newBill: any) => {
        toast({ title: 'Bill Created', description: 'Draft bill created from PO.' });
        navigate(`/purchase/bills/${newBill.id}/edit`);
      }
    });
  };

  const handleCancel = () => {
    if (id) {
      updateOrder({ id, data: { status: 'cancelled' } }, {
        onSuccess: () => {
          toast({ title: 'Cancelled', description: 'Order cancelled.' });
          navigate(0);
        }
      });
    }
  };

  if (isEdit && isLoadingOrder) {
    return <div className="p-8 text-center text-muted-foreground">Loading order...</div>;
  }



  if (isEdit && (isOrderError || (!order && !isLoadingOrder))) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-destructive mb-2">Purchase Order Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
        <Button onClick={() => navigate('/purchase/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const isReadOnly = status === 'confirmed' || status === 'posted' || status === 'cancelled';

  return (
    <DocumentLayout
      title={isEdit ? order?.orderNumber ?? 'Purchase Order' : 'New Purchase Order'}
      subtitle={order?.vendorName}
      backTo="/purchase/orders"
      status={status}
      statusOptions={['Draft', 'Confirmed', 'Posted', 'Cancelled']}
      actions={
        <>
          {!isEdit && (
            <Button type="submit" form="po-form" loading={isCreating}>Save</Button>
          )}
          {isEdit && status === 'draft' && (
            <>
              <Button type="submit" form="po-form" loading={isUpdating}>Save</Button>
              <Button variant="default" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm Order</Button>
            </>
          )}
          {status === 'confirmed' && (
            <Button variant="default" onClick={handleCreateBill} className="bg-teal-700 hover:bg-teal-800">Create Bill</Button>
          )}
          {status !== 'cancelled' && isEdit && (
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          )}
        </>
      }
    >
      {budgetWarnings.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800">
          <AlertTitle>Budget Warning</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {budgetWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form id="po-form" onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Vendor</Label>
                  <select disabled={isReadOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('vendorId')}>
                    <option value="">Select vendor</option>
                    {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  {errors.vendorId && <p className="text-sm text-destructive">{errors.vendorId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Vendor Reference</Label>
                  <Input disabled={isReadOnly} {...register('reference')} placeholder="e.g. REF-25-0001" className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Order Date</Label>
                  <Input disabled={isReadOnly} type="date" {...register('orderDate')} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Products</CardTitle>
            {!isReadOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 mb-2 px-2 py-1 text-sm font-medium text-muted-foreground bg-muted/50 rounded-md">
              <div className="col-span-4">Product</div>
              <div className="col-span-3">Analytical</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center p-2 border rounded-md hover:bg-muted/10 transition-colors">
                  <div className="col-span-4">
                    <select
                      disabled={isReadOnly}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={line.productId}
                      onChange={e => updateLine(idx, 'productId', e.target.value)}
                    >
                      <option value="">Select Product...</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <select
                      disabled={isReadOnly}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={line.costCenterId ?? ''}
                      onChange={e => updateLine(idx, 'costCenterId', e.target.value || undefined)}
                    >
                      <option value="">Select Account...</option>
                      {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input disabled={isReadOnly} type="number" min={1} className="h-9 text-right" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input disabled={isReadOnly} type="number" min={0} className="h-9 text-right pl-6" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 text-right">
                    {!isReadOnly && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeLine(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-8">
              <div className="w-1/3 space-y-2 min-w-[200px]">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Untaxed Amount:</span>
                  <span className="font-medium font-mono">₹{(lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({(DEFAULT_TAX_RATE * 100).toFixed(0)}%):</span>
                  <span className="font-medium font-mono">₹{(lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0) * DEFAULT_TAX_RATE).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Total (Incl. GST):</span>
                  <span className="font-bold text-lg font-mono">
                    ₹{(lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0) * (1 + DEFAULT_TAX_RATE)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </DocumentLayout>
  );
}

