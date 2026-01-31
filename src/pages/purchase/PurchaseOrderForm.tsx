import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, Printer, Send, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { purchaseOrderStore, contactStore, productStore, costCenterStore, analyticalRuleStore, budgetStore, vendorBillStore } from '@/services/mockData';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { LineItem, OrderStatus } from '@/types';
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
  status: z.enum(['draft', 'confirmed', 'posted', 'cancelled']),
  lineItems: z.array(lineSchema).min(1, 'Add at least one line item'),
});

type FormValues = z.infer<typeof schema>;

export default function PurchaseOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const [order, setOrder] = useState(id ? purchaseOrderStore.getById(id) : null);
  const vendors = contactStore.getByType('vendor');
  const products = productStore.getActive();
  const costCenters = costCenterStore.getActive();

  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>(
    order?.lineItems.map(li => ({ productId: li.productId, quantity: Math.floor(li.quantity), unitPrice: li.unitPrice, costCenterId: li.costCenterId })) ?? [{ productId: '', quantity: 1, unitPrice: 0 }]
  );

  const [budgetWarnings, setBudgetWarnings] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorId: order?.vendorId ?? '',
      reference: order?.reference ?? '',
      orderDate: order?.orderDate ?? new Date().toISOString().slice(0, 10),
      status: (order?.status ?? 'draft') as OrderStatus,
      lineItems: order?.lineItems.map(li => ({ productId: li.productId, quantity: Math.floor(li.quantity), unitPrice: li.unitPrice, costCenterId: li.costCenterId })) ?? [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const status = watch('status');

  useEffect(() => {
    setValue('lineItems', lines);
  }, [lines, setValue]);

  // Re-fetch order when ID changes or after updates
  useEffect(() => {
    if (id) {
      setOrder(purchaseOrderStore.getById(id));
    }
  }, [id]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as Record<string, unknown>)[field] = value;
      if (field === 'productId') {
        const p = productStore.getById(String(value));
        if (p) {
          next[idx].unitPrice = p.price;
          // Auto-assign cost center
          if (!next[idx].costCenterId) {
            const rules = analyticalRuleStore.getAll();
            const applicableRule = rules.find(rule => {
              return (rule.ruleType === 'category' && rule.category === p.category) || (rule.ruleType === 'product' && rule.productId === p.id);
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
        const check = budgetStore.checkBudget(line.costCenterId, amount);
        if (check && check.isExceeded) {
          warnings.push(`Budget "${check.budgetName}" exceeded! Remaining: Rs.${check.remaining.toLocaleString()}, Request: Rs.${amount.toLocaleString()}`);
        }
      }
    });
    setBudgetWarnings(warnings);
    return warnings.length === 0;
  };

  const onSubmit = async (data: FormValues) => {
    // Basic Validation
    const linesWithoutCostCenter = data.lineItems.filter(li => !li.costCenterId);
    if (linesWithoutCostCenter.length > 0) {
      toast({ title: 'Validation Error', description: 'All line items must have a cost center assigned.', variant: 'destructive' });
      return;
    }

    const lineItems: LineItem[] = data.lineItems.map((li, i) => {
      const p = productStore.getById(li.productId);
      return {
        id: 'li' + i,
        productId: li.productId,
        productName: p?.name,
        quantity: Math.floor(li.quantity),
        unitPrice: li.unitPrice,
        amount: Math.floor(li.quantity) * li.unitPrice,
        costCenterId: li.costCenterId,
        costCenterName: li.costCenterId ? costCenterStore.getById(li.costCenterId)?.name : undefined,
      };
    });
    const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
    const tax = Math.round(subtotal * DEFAULT_TAX_RATE);
    const total = subtotal + tax;

    let savedOrder;
    if (isEdit && id) {
      savedOrder = purchaseOrderStore.update(id, { ...data, lineItems, subtotal, tax, total });
      toast({ title: 'Updated', description: 'Purchase order updated.' });
    } else {
      savedOrder = purchaseOrderStore.create({
        vendorId: data.vendorId,
        reference: data.reference,
        orderDate: data.orderDate,
        status: data.status,
        lineItems,
        subtotal,
        tax,
        total
      });
      toast({ title: 'Created', description: 'Purchase order created.' });
      navigate('/purchase/orders');
    }
  };

  const handleConfirm = () => {
    validateBudget(); // Show warnings if any
    if (id) {
      purchaseOrderStore.update(id, { status: 'confirmed' });
      setValue('status', 'confirmed');
      setOrder(prev => prev ? ({ ...prev, status: 'confirmed' }) : null);
      toast({ title: 'Confirmed', description: 'Order confirmed.' });
    }
  };

  const handleCreateBill = () => {
    if (!order) return;
    // Check if bill already exists for this PO
    const existingBill = vendorBillStore.getAll().find(vb => vb.purchaseOrderId === order.id);
    if (existingBill) {
      navigate(`/purchase/bills/${existingBill.id}`);
      return;
    }

    const bill = vendorBillStore.create({
      purchaseOrderId: order.id,
      vendorId: order.vendorId,
      billReference: order.reference, // Use PO ref as bill ref default? Or PO Number? Requirement says fetch, usually PO number.
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'draft',
      lineItems: order.lineItems,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total
    });

    toast({ title: 'Bill Created', description: 'Draft bill created from PO.' });
    navigate(`/purchase/bills/${bill.id}`);
  };

  const handleCancel = () => {
    if (id) {
      purchaseOrderStore.update(id, { status: 'cancelled' });
      setValue('status', 'cancelled');
      setOrder(prev => prev ? ({ ...prev, status: 'cancelled' }) : null);
      toast({ title: 'Cancelled', description: 'Order cancelled.' });
    }
  };

  if (isEdit && !order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="link" onClick={() => navigate('/purchase/orders')}>Back</Button>
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
            <Button type="submit" form="po-form">Save</Button>
          )}
          {isEdit && status === 'draft' && (
            <>
              <Button type="submit" form="po-form">Save</Button>
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
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
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
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                  <span className="font-bold">Total:</span>
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

