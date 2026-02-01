import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  useVendorBill, useCreateVendorBill, useUpdateVendorBill,
  useContacts, useProducts, useCostCenters, usePurchaseOrders, usePurchaseOrder, useBudgets
} from '@/hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { OrderStatus } from '@/types';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import { Skeleton } from '@/components/ui/skeleton';

const lineSchema = z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'), unitPrice: z.coerce.number().min(0), costCenterId: z.string().optional() });
const schema = z.object({
  purchaseOrderId: z.string().optional(),
  vendorId: z.string().min(1, 'Vendor required'),
  billReference: z.string().optional(),
  billDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(['draft', 'confirmed', 'posted', 'cancelled', 'done']),
  lineItems: z.array(lineSchema).min(1, 'Add at least one line'),
});

type FormValues = z.infer<typeof schema>;

export default function VendorBillForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: bill, isLoading: isLoadingBill, isError: isBillError } = useVendorBill(id);
  const { data: vendors = [] } = useContacts('vendor');
  const { data: products = [] } = useProducts({ limit: 100, status: 'active' });
  const { data: costCenters = [] } = useCostCenters();
  const { data: purchaseOrders = [] } = usePurchaseOrders({ limit: 100 });
  const { data: budgets = [] } = useBudgets();

  const { mutate: createBill, isPending: isCreating } = useCreateVendorBill();
  const { mutate: updateBill, isPending: isUpdating } = useUpdateVendorBill();

  // Filter posted/confirmed POs for selection
  const validPOs = purchaseOrders.filter((po: any) => po.status === 'posted' || po.status === 'confirmed');

  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const [budgetWarnings, setBudgetWarnings] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseOrderId: '',
      vendorId: '',
      billReference: '',
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'draft',
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const purchaseOrderId = watch('purchaseOrderId');
  const status = watch('status');

  useEffect(() => {
    if (bill) {
      setValue('purchaseOrderId', bill.purchaseOrderId ?? '');
      setValue('vendorId', bill.vendorId);
      setValue('billReference', bill.billNumber ?? ''); // Map billNumber to reference or separate field? Schema has billReference. Hook returns billNumber.
      // Usually bill reference is external invoice number. billNumber is internal.
      // If hook doesn't return reference, maybe we use billNumber for now or empty.
      // Let's assume user enters reference.
      setValue('billDate', bill.date ? new Date(bill.date).toISOString().slice(0, 10) : '');
      setValue('dueDate', bill.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : '');
      setValue('status', bill.status as OrderStatus);

      setLines(bill.items?.map((li: any) => ({
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        costCenterId: li.costCenterId
      })) || []);
    }
  }, [bill, setValue]);

  useEffect(() => { setValue('lineItems', lines); }, [lines, setValue]);

  // Handle Purchase Order selection to auto-fill
  // We need to fetch details of selected PO if not available in list?
  // usePurchaseOrders list might have items? Yes, my hook includes items.
  useEffect(() => {
    if (purchaseOrderId && !isEdit) { // Only on create? Or if user changes PO?
      const po = purchaseOrders.find((p: any) => p.id === purchaseOrderId);
      if (po) {
        setValue('vendorId', po.vendorId);
        const poLines = po.lineItems.map((li: any) => ({
          productId: li.productId,
          quantity: li.quantity, // allow float/decimal from PO
          unitPrice: li.unitPrice,
          costCenterId: li.costCenterId,
        }));
        setLines(poLines);
      }
    }
  }, [purchaseOrderId, purchaseOrders, setValue, isEdit]);

  useEffect(() => {
    if (isEdit && (isBillError || (!bill && !isLoadingBill))) {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
    }
  }, [isEdit, isBillError, bill, isLoadingBill, queryClient]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as Record<string, unknown>)[field] = value;
      if (field === 'productId') {
        const p = products.find((prod: any) => prod.id === value);
        if (p) next[idx].unitPrice = p.purchasePrice || 0;
      }
      return next;
    });
  };

  const validateBudget = () => {
    const warnings: string[] = [];
    lines.forEach(line => {
      if (line.costCenterId) {
        const amount = line.quantity * line.unitPrice;
        const budget = budgets.find((b: any) => b.costCenterId === line.costCenterId && b.stage === 'confirmed');
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

  const onSubmit = (data: FormValues) => {
    const linesWithoutCostCenter = data.lineItems.filter(li => !li.costCenterId);
    if (linesWithoutCostCenter.length > 0) {
      toast({ title: 'Validation Error', description: 'All line items must have a cost center assigned.', variant: 'destructive' });
      return;
    }

    // items mapping
    const items = data.lineItems.map(li => ({
      productId: li.productId,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      costCenterId: li.costCenterId
    }));

    if (isEdit && id) {
      updateBill({ id, data: { ...data, items } }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Vendor bill updated.' });
          navigate('/purchase/bills');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update bill.', variant: 'destructive' })
      });
    } else {
      createBill({
        vendorId: data.vendorId,
        date: data.billDate,
        dueDate: data.dueDate,
        purchaseOrderId: data.purchaseOrderId, // If selected
        items
      }, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Vendor bill created.' });
          navigate('/purchase/bills');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create bill.', variant: 'destructive' })
      });
    }
  };

  const handleConfirm = () => {
    validateBudget();
    if (id) {
      updateBill({ id, data: { status: 'posted' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Bill confirmed (posted).' });
          navigate(0);
        }
      });
    }
  };

  const handleRegisterPayment = () => {
    if (id) navigate(`/purchase/payments/create?billId=${id}`);
  };

  if (isEdit && isLoadingBill) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  if (isEdit && (isBillError || (!bill && !isLoadingBill))) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-destructive mb-2">Vendor Bill Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested vendor bill could not be found. It may have been deleted.</p>
        <Button onClick={() => navigate('/purchase/bills')}>Back to Bills</Button>
      </div>
    );
  }

  const isReadOnly = status === 'posted' || status === 'cancelled';
  const paymentStatus = bill?.paymentStatus ?? 'not_paid';

  return (
    <DocumentLayout
      title={isEdit ? bill?.billNumber ?? 'Vendor Bill' : 'New Vendor Bill'}
      subtitle={bill?.vendorName}
      backTo="/purchase/bills"
      status={status}
      statusOptions={['Draft', 'Posted', 'Cancelled']}
      actions={
        <>
          {!isEdit && <Button type="submit" form="vb-form" loading={isCreating}>Save</Button>}
          {isEdit && status === 'draft' && (
            <>
              <Button type="submit" form="vb-form" loading={isUpdating}>Save</Button>
              <Button variant="default" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm</Button>
            </>
          )}
          {status !== 'cancelled' && paymentStatus !== 'PAID' && paymentStatus !== 'paid' && (
            <Button variant="default" onClick={handleRegisterPayment} className="bg-teal-700 hover:bg-teal-800">Register Payment</Button>
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

      <form id="vb-form" onSubmit={handleSubmit(onSubmit)}>
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
                  <Label className="font-medium">Bill Reference</Label>
                  <Input disabled={isReadOnly} {...register('billReference')} placeholder="e.g. INV/2024/0001" className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="font-medium">Bill Date</Label><Input disabled={isReadOnly} type="date" {...register('billDate')} /></div>
                <div className="space-y-2"><Label className="font-medium">Due Date</Label><Input disabled={isReadOnly} type="date" {...register('dueDate')} /></div>
                <div className="space-y-2">
                  <Label className="font-medium">Source PO</Label>
                  <select disabled={isReadOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('purchaseOrderId')}>
                    <option value="">Select purchase order</option>
                    {validPOs.map((po: any) => <option key={po.id} value={po.id}>{po.orderNumber}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Invoice Lines</CardTitle>
            {!isReadOnly && <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-2" /> Add Line</Button>}
          </CardHeader>
          <CardContent>
            {/* Similar table as PO */}
            <div className="grid grid-cols-12 gap-4 mb-2 px-2 py-1 text-sm font-medium text-muted-foreground bg-muted/50 rounded-md">
              <div className="col-span-4">Product</div>
              <div className="col-span-3">Asset/Account</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1"></div>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center p-2 border rounded-md hover:bg-muted/10 transition-colors">
                  <div className="col-span-4">
                    <select disabled={isReadOnly} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
                      <option value="">Select</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <select disabled={isReadOnly} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={line.costCenterId ?? ''} onChange={e => updateLine(idx, 'costCenterId', e.target.value || undefined)}>
                      <option value="">None</option>
                      {costCenters.map((cc: any) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><Input disabled={isReadOnly} type="number" min={1} className="h-9 text-right" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 0)} /></div>
                  <div className="col-span-2 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input disabled={isReadOnly} type="number" min={0} className="h-9 text-right pl-6" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 text-right">
                    {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeLine(idx)}><Trash2 className="h-4 w-4" /></Button>}
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
                <div className="flex justify-between text-sm pt-2 text-destructive border-t border-border mt-2">
                  <span className="font-bold">Amount Due:</span>
                  <span className="font-bold text-lg font-mono">
                    ₹{((lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0) * (1 + DEFAULT_TAX_RATE)) - (bill?.paidAmount ?? 0)).toLocaleString('en-IN')}
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
