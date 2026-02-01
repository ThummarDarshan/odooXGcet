import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  useSalesOrder,
  useCreateSalesOrder,
  useUpdateSalesOrder,
  useContacts,
  useProducts,
  useCostCenters,
  useAnalyticalRules,
  useCreateCustomerInvoice
} from '@/hooks/useData';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { OrderStatus } from '@/types';
import { DocumentLayout } from '@/components/layout/DocumentLayout';

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0),
  costCenterId: z.string().optional()
});

const schema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  orderDate: z.string().min(1),
  status: z.enum(['draft', 'confirmed', 'posted', 'cancelled']).optional(),
  lineItems: z.array(lineSchema).min(1, 'Add at least one line'),
  reference: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SalesOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: order, isLoading: isLoadingOrder } = useSalesOrder(id);
  const { data: customers = [] } = useContacts('customer');
  const { data: products = [] } = useProducts({ limit: 100, status: 'active' });
  const { data: costCenters = [] } = useCostCenters();
  const { data: analyticalRules = [] } = useAnalyticalRules();

  const { mutate: createOrder, isPending: isCreating } = useCreateSalesOrder();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateSalesOrder();
  const { mutate: createInvoiceFn, isPending: isCreatingInv } = useCreateCustomerInvoice();

  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      orderDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
      reference: '',
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (order) {
      setValue('customerId', order.customerId);
      setValue('orderDate', order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : '');
      setValue('status', (order.status || 'draft') as OrderStatus);
      // setValue('reference', order.reference || ''); // Backend currently doesn't map reference but implies it might exist or we can map it.
      // Assuming no reference field in backend response yet, or it's implicitly part of notes if mapped.

      setLines(order.lineItems.map((li: any) => ({
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        costCenterId: li.costCenterId
      })));
    }
  }, [order, setValue]);

  useEffect(() => { setValue('lineItems', lines); }, [lines, setValue]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;

      if (field === 'productId') {
        const p = products.find((prod: any) => prod.id === value);
        if (p) {
          next[idx].unitPrice = p.price;
          // Auto-assign cost center
          if (!next[idx].costCenterId) {
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

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      updateOrder({
        id, data: {
          ...data,
          // map lines? backend helper does it
        }
      }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Sales order updated.' });
          navigate('/sale/orders');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update order.', variant: 'destructive' })
      });
    } else {
      createOrder(data, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Sales order created.' });
          navigate('/sale/orders');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create order.', variant: 'destructive' })
      });
    }
  };

  const handleConfirm = () => {
    if (id) {
      updateOrder({ id, data: { status: 'confirmed' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Order confirmed.' });
          navigate(0);
        }
      });
    }
  };

  const handleCreateInvoice = () => {
    if (!order) return;
    // Backend `customerInvoices.service.js` create expects: customerId, items, etc.
    // There is 'salesOrderId' field in schema? Yes (checked in useData.ts useCreateCustomerInvoice payload)
    // Payload for useCreateCustomerInvoice: { customerId, date, dueDate, salesOrderId, items: [{productId, quantity, unitPrice}] }

    createInvoiceFn({
      customerId: order.customerId,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      salesOrderId: order.id,
      items: order.lineItems.map((li: any) => ({
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice
      }))
    }, {
      onSuccess: (newInv: any) => {
        toast({ title: 'Invoice Created', description: 'Draft invoice created.' });
        // If newInv returns object with id? createCustomerInvoice mutation returns result.
        if (newInv?.id) {
          navigate(`/sale/invoices/${newInv.id}/edit`); // Invoice edit page?
        } else {
          navigate('/sale/invoices');
        }
      },
      onError: () => toast({ title: 'Error', description: 'Failed to create invoice.', variant: 'destructive' })
    });
  };

  // Helper Calc
  const subtotal = lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
  const tax = subtotal * DEFAULT_TAX_RATE;
  const total = subtotal + tax;

  if (isEdit && isLoadingOrder) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (isEdit && !order && !isLoadingOrder) return <div className="text-center py-12">Order not found.</div>;

  const isReadOnly = status === 'posted' || status === 'cancelled';

  return (
    <DocumentLayout
      title={isEdit ? order?.orderNumber ?? 'Sales Order' : 'New Sales Order'}
      subtitle={order?.customerName}
      backTo="/sale/orders"
      status={status}
      statusOptions={['Draft', 'Confirmed', 'Posted', 'Cancelled']}
      actions={
        <>
          {!isEdit && <Button type="submit" form="so-form" loading={isCreating}>Save</Button>}
          {isEdit && status === 'draft' && (
            <>
              <Button type="submit" form="so-form" loading={isUpdating}>Save</Button>
              <Button variant="default" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm Order</Button>
            </>
          )}
          {isEdit && status === 'confirmed' && (
            <Button variant="default" onClick={handleCreateInvoice} loading={isCreatingInv} className="bg-teal-700 hover:bg-teal-800">Create Invoice</Button>
          )}
        </>
      }
    >
      <form id="so-form" onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Customer</Label>
                  <select disabled={isReadOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('customerId')}>
                    <option value="">Select customer</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Reference</Label>
                  <Input disabled={isReadOnly} {...register('reference')} placeholder="e.g. PO#123" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Order Date</Label>
                <Input disabled={isReadOnly} type="date" {...register('orderDate')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Order Lines</CardTitle>
            {!isReadOnly && <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-2" /> Add line</Button>}
          </CardHeader>
          <CardContent>
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

            <div className="flex justify-end mt-8">
              <div className="w-1/3 space-y-2 min-w-[240px]">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Untaxed Amount:</span>
                  <span className="font-medium font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({(DEFAULT_TAX_RATE * 100).toFixed(0)}%):</span>
                  <span className="font-medium font-mono">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Total (Incl. GST):</span>
                  <span className="font-bold text-lg font-mono">
                    ₹{total.toLocaleString('en-IN')}
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
