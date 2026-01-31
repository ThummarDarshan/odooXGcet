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
import { purchaseOrderStore, contactStore, productStore, costCenterStore } from '@/services/mockData';
import { DEFAULT_TAX_RATE } from '@/lib/constants';
import type { LineItem, OrderStatus } from '@/types';

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  costCenterId: z.string().optional(),
});
const schema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
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
  const order = id ? purchaseOrderStore.getById(id) : null;
  const vendors = contactStore.getByType('vendor');
  const products = productStore.getActive();
  const costCenters = costCenterStore.getActive();

  const [lines, setLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number; costCenterId?: string }>>(
    order?.lineItems.map(li => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice, costCenterId: li.costCenterId })) ?? [{ productId: '', quantity: 1, unitPrice: 0 }]
  );

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorId: order?.vendorId ?? '',
      orderDate: order?.orderDate ?? new Date().toISOString().slice(0, 10),
      status: (order?.status ?? 'draft') as OrderStatus,
      lineItems: order?.lineItems.map(li => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice, costCenterId: li.costCenterId })) ?? [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const vendorId = watch('vendorId');
  const orderDate = watch('orderDate');
  const status = watch('status');

  useEffect(() => {
    setValue('lineItems', lines);
  }, [lines, setValue]);

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      (next[idx] as Record<string, unknown>)[field] = value;
      if (field === 'productId') {
        const p = productStore.getById(String(value));
        if (p) next[idx].unitPrice = p.price;
      }
      return next;
    });
  };

  const onSubmit = (data: FormValues) => {
    const lineItems: LineItem[] = data.lineItems.map((li, i) => {
      const p = productStore.getById(li.productId);
      return {
        id: 'li' + i,
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
      purchaseOrderStore.update(id, { ...data, lineItems, subtotal, tax, total });
      toast({ title: 'Updated', description: 'Purchase order updated.' });
    } else {
      purchaseOrderStore.create({ ...data, lineItems, subtotal, tax, total });
      toast({ 
        title: 'Created Successfully', 
        description: 'Purchase order created. Vendor bill automatically generated and budget updated.',
        duration: 5000
      });
    }
    navigate('/purchase/orders');
  };

  if (isEdit && !order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="link"><Link to="/purchase/orders">Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
      <p className="text-muted-foreground mb-6">
        {isEdit 
          ? 'Vendor and line items.' 
          : 'Vendor and line items. Note: Vendor bill will be automatically created and budget will be updated.'
        }
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Header</CardTitle>
            <CardDescription>Vendor, date, status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('vendorId')}>
                  <option value="">Select vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {errors.vendorId && <p className="text-sm text-destructive">{errors.vendorId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input type="date" {...register('orderDate')} />
              </div>
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
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Product, quantity, price, cost center</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" /> Add line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, idx) => (
                <div key={idx} className="flex flex-wrap gap-4 items-end p-4 border rounded-lg">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs">Product</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      value={line.productId}
                      onChange={e => updateLine(idx, 'productId', e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" min={0.01} step={0.01} className="mt-1" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Unit Price</Label>
                    <Input type="number" min={0} step={0.01} className="mt-1" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <Label className="text-xs">Cost Center</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      value={line.costCenterId ?? ''}
                      onChange={e => updateLine(idx, 'costCenterId', e.target.value || undefined)}
                    >
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

        <Card>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/purchase/orders">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
