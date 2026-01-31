import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  useCustomerInvoice, useCreateCustomerInvoice, useUpdateCustomerInvoice,
  useContacts, useProducts, useCostCenters, useAnalyticalRules, useSalesOrders
} from '@/hooks/useData';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { OrderStatus } from '@/types';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  salesOrderId: z.string().optional(),
  invoiceDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(['draft', 'confirmed', 'posted', 'cancelled']),
  lineItems: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'), unitPrice: z.coerce.number().min(0), costCenterId: z.string().optional() })).min(1),
});
type FormValues = z.infer<typeof schema>;

export default function CustomerInvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const { data: invoice, isLoading: isLoadingInvoice } = useCustomerInvoice(id);
  const { data: customers = [] } = useContacts('customer');
  const { data: products = [] } = useProducts({ limit: 100, status: 'active' });
  const { data: costCenters = [] } = useCostCenters();
  const { data: analyticalRules = [] } = useAnalyticalRules();
  const { data: salesOrders = [] } = useSalesOrders();

  const { mutate: createInvoice, isPending: isCreating } = useCreateCustomerInvoice();
  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateCustomerInvoice();

  // Filter posted/confirmed SOs
  const validSOs = salesOrders.filter((so: any) => so.status === 'posted' || so.status === 'confirmed');

  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      salesOrderId: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const status = watch('status');
  const selectedSalesOrderId = watch('salesOrderId');

  useEffect(() => {
    if (invoice) {
      setValue('customerId', invoice.customerId);
      setValue('salesOrderId', invoice.salesOrderId ?? '');
      setValue('invoiceDate', invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().slice(0, 10) : (invoice.date ? new Date(invoice.date).toISOString().slice(0, 10) : ''));
      setValue('dueDate', invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : '');
      setValue('status', invoice.status as OrderStatus);

      setLines(invoice.lineItems.map((li: any) => ({
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        costCenterId: li.costCenterId
      })));
    }
  }, [invoice, setValue]);

  // Handle Sales Order selection
  useEffect(() => {
    if (selectedSalesOrderId && !isEdit) {
      const so = salesOrders.find((s: any) => s.id === selectedSalesOrderId);
      if (so) {
        setValue('customerId', so.customerId);
        setLines(so.lineItems.map((li: any) => ({
          productId: li.productId,
          quantity: Math.floor(li.quantity),
          unitPrice: li.unitPrice,
          costCenterId: li.costCenterId
        })));
      }
    }
  }, [selectedSalesOrderId, salesOrders, setValue, isEdit]);

  useEffect(() => { setValue('lineItems', lines); }, [lines, setValue]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as Record<string, unknown>)[field] = value;
      if (field === 'productId') {
        const p = products.find((prod: any) => prod.id === value);
        if (p) {
          next[idx].unitPrice = p.price; // Sales price
          // Auto-assign cost center
          if (!next[idx].costCenterId) {
            const applicableRule = analyticalRules.find((rule: any) => {
              if (!rule.enabled) return false;
              return (rule.ruleType === 'category' && rule.category === p.category) || (rule.ruleType === 'product' && rule.productId === p.id);
            });
            if (applicableRule) next[idx].costCenterId = applicableRule.costCenterId;
          }
        }
      }
      return next;
    });
  };

  const onSubmit = (data: FormValues) => {
    // line items mapping
    const items = data.lineItems.map(li => ({
      productId: li.productId,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      costCenterId: li.costCenterId
    }));

    if (isEdit && id) {
      updateInvoice({ id, data: { ...data, items } }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Invoice updated.' });
          navigate('/sale/invoices');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update invoice.', variant: 'destructive' })
      });
    } else {
      createInvoice({
        customerId: data.customerId,
        salesOrderId: data.salesOrderId,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        items
      }, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Invoice created.' });
          navigate('/sale/invoices');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create invoice.', variant: 'destructive' })
      });
    }
  };

  const handleConfirm = () => {
    if (id) {
      updateInvoice({ id, data: { status: 'posted' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Invoice confirmed.' });
          navigate(0);
        }
      });
    }
  };

  const handleRegisterPayment = () => {
    if (id) navigate(`/sale/payments/create?invoiceId=${id}`);
  };

  if (isEdit && isLoadingInvoice) return <div className="p-8 text-center text-muted-foreground">Loading invoice...</div>;

  if (isEdit && !invoice && !isLoadingInvoice) return <div className="text-center py-12"><p className="text-muted-foreground">Invoice not found.</p><Button asChild variant="link" onClick={() => navigate('/sale/invoices')}>Back</Button></div>;

  const isReadOnly = status === 'posted' || status === 'cancelled' || user?.role === 'customer';
  const isCustomer = user?.role === 'customer';

  return (
    <DocumentLayout
      title={isEdit ? invoice?.invoiceNumber ?? 'Customer Invoice' : 'New Invoice'}
      subtitle={invoice?.customerName}
      backTo={isCustomer ? "/portal/invoices" : "/sale/invoices"}
      status={status}
      statusOptions={['Draft', 'Confirmed', 'Posted', 'Cancelled']} // Simplified status pipeline
      actions={
        !isCustomer && (
          <>
            {!isEdit && <Button type="submit" form="inv-form" loading={isCreating}>Save</Button>}
            {isEdit && status === 'draft' && (
              <>
                <Button type="submit" form="inv-form" loading={isUpdating}>Save</Button>
                <Button onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm</Button>
              </>
            )}
            {isEdit && status === 'posted' && (invoice?.paymentStatus !== 'paid') && (
              <Button onClick={handleRegisterPayment} className="bg-teal-700 hover:bg-teal-800">Pay Now</Button>
            )}
          </>
        )
      }
    >
      <form id="inv-form" onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Source Sales Order</Label>
                  <select disabled={isReadOnly || isEdit} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('salesOrderId')}>
                    <option value="">Select Sales Order (optional)</option>
                    {validSOs.map((so: any) => <option key={so.id} value={so.id}>{so.orderNumber} - {so.customerName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Customer</Label>
                  <select disabled={isReadOnly || (!!selectedSalesOrderId && !isEdit)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('customerId')}>
                    <option value="">Select customer</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="font-medium">Invoice Date</Label><Input disabled={isReadOnly} type="date" {...register('invoiceDate')} /></div>
                <div className="space-y-2"><Label className="font-medium">Due Date</Label><Input disabled={isReadOnly} type="date" {...register('dueDate')} /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Invoice Lines</CardTitle>
            {!isReadOnly && <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-2" /> Add line</Button>}
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 mb-2 px-2 py-1 text-sm font-medium text-muted-foreground bg-muted/50 rounded-md">
              <div className="col-span-4">Product</div>
              <div className="col-span-3">Analytical Account</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center p-2 border rounded-md hover:bg-muted/10 transition-colors">
                  <div className="col-span-4">
                    <select disabled={isReadOnly} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
                      <option value="">Select Product...</option>
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
            {errors.lineItems && <p className="text-sm text-destructive mt-2">{errors.lineItems.message}</p>}

            {/* Totals */}
            <div className="flex justify-end mt-8">
              <div className="w-1/3 space-y-2 min-w-[240px]">
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
                <div className="flex justify-between text-sm pt-2 text-destructive border-t border-border mt-2">
                  <span className="font-bold">Amount Due:</span>
                  <span className="font-bold text-lg font-mono">
                    ₹{((lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0) * (1 + DEFAULT_TAX_RATE)) - (invoice?.paidAmount ?? 0)).toLocaleString('en-IN')}
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
