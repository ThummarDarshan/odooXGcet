import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { salesOrderStore, contactStore, productStore, costCenterStore } from '@/services/mockData';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { LineItem, OrderStatus } from '@/types';

const lineSchema = z.object({ productId: z.string().min(1), quantity: z.coerce.number().min(0.01), unitPrice: z.coerce.number().min(0), costCenterId: z.string().optional() });
const schema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  orderDate: z.string().min(1),
  status: z.enum(['draft', 'confirmed', 'posted', 'cancelled']),
  lineItems: z.array(lineSchema).min(1, 'Add at least one line'),
});

type FormValues = z.infer<typeof schema>;

export default function SalesOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const order = id ? salesOrderStore.getById(id) : null;
  const customers = contactStore.getByType('customer');
  const products = productStore.getActive();
  const costCenters = costCenterStore.getActive();
  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>(
    order?.lineItems.map(li => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice, costCenterId: li.costCenterId })) ?? [{ productId: '', quantity: 1, unitPrice: 0 }]
  );

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: order?.customerId ?? '',
      orderDate: order?.orderDate ?? new Date().toISOString().slice(0, 10),
      status: (order?.status ?? 'draft') as OrderStatus,
      lineItems: lines,
    },
  });

  useEffect(() => { setValue('lineItems', lines); }, [lines, setValue]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as Record<string, unknown>)[field] = value;
      if (field === 'productId') { const p = productStore.getById(String(value)); if (p) next[idx].unitPrice = p.price; }
      return next;
    });
  };

  const onSubmit = (data: FormValues) => {
    const lineItems: LineItem[] = data.lineItems.map((li, i) => {
      const p = productStore.getById(li.productId);
      return {
        id: 'soli' + i,
        productId: li.productId,
        productName: p?.name,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: li.quantity * li.unitPrice,
        costCenterId: li.costCenterId,
        costCenterName: li.costCenterId ? costCenterStore.getById(li.costCenterId)?.name : undefined,
      };
    });
    const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
    const tax = Math.round(subtotal * DEFAULT_TAX_RATE);
    const total = subtotal + tax;
    if (isEdit && id) {
      salesOrderStore.update(id, { ...data, lineItems, subtotal, discount: 0, tax, total });
      toast({ title: 'Updated', description: 'Sales order updated.' });
    } else {
      salesOrderStore.create({ ...data, lineItems, subtotal, discount: 0, tax, total });
      toast({ title: 'Created', description: 'Sales order created.' });
    }
    navigate('/sale/orders');
  };

  if (isEdit && !order) return <div className="text-center py-12"><p className="text-muted-foreground">Order not found.</p><Button asChild variant="link"><Link to="/sale/orders">Back</Link></Button></div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Sales Order' : 'New Sales Order'}</h1>
      <p className="text-muted-foreground mb-6">Customer and line items.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader><CardTitle>Header</CardTitle><CardDescription>Customer, date, status</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('customerId')}>
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
              </div>
              <div className="space-y-2"><Label>Order Date</Label><Input type="date" {...register('orderDate')} /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-xs" {...register('status')}>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Line Items</CardTitle><CardDescription>Product, qty, price, cost center</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-2" /> Add line</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, idx) => (
                <div key={idx} className="flex flex-wrap gap-4 items-end p-4 border rounded-lg">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs">Product</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
                      <option value="">Select</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24"><Label className="text-xs">Qty</Label><Input type="number" min={0.01} className="mt-1" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                  <div className="w-32"><Label className="text-xs">Price</Label><Input type="number" min={0} className="mt-1" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} /></div>
                  <div className="flex-1 min-w-[140px]">
                    <Label className="text-xs">Cost Center</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={line.costCenterId ?? ''} onChange={e => updateLine(idx, 'costCenterId', e.target.value || undefined)}>
                      <option value="">None</option>
                      {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                    </select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            {errors.lineItems && <p className="text-sm text-destructive mt-2">{errors.lineItems.message}</p>}
          </CardContent>
        </Card>
        <Card><CardFooter className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="outline" asChild><Link to="/sale/orders">Cancel</Link></Button>
        </CardFooter></Card>
      </form>
    </div>
  );
}
