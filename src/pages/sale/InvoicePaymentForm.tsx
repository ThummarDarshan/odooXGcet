import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { invoicePaymentStore, customerInvoiceStore } from '@/services/mockData';
import { PAYMENT_MODES } from '@/lib/constants';
import type { PaymentMode } from '@/types';

const schema = z.object({
  invoiceId: z.string().min(1, 'Select an invoice'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  paymentMode: z.string() as z.ZodType<PaymentMode>,
  paymentDate: z.string().min(1),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function InvoicePaymentForm() {
  const [searchParams] = useSearchParams();
  const preselectedInvoiceId = searchParams.get('invoiceId');
  const navigate = useNavigate();
  const { toast } = useToast();
  const invoices = customerInvoiceStore.getAll().filter(inv => inv.paymentStatus !== 'paid');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: preselectedInvoiceId ?? '',
      amount: 0,
      paymentMode: 'UPI',
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceId: '',
      notes: '',
    },
  });

  useEffect(() => { if (preselectedInvoiceId) reset(prev => ({ ...prev, invoiceId: preselectedInvoiceId })); }, [preselectedInvoiceId, reset]);

  const onSubmit = (data: FormValues) => {
    invoicePaymentStore.create({
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentMode: data.paymentMode,
      paymentDate: data.paymentDate,
      referenceId: data.referenceId,
      notes: data.notes,
    });
    toast({ title: 'Payment recorded', description: 'Invoice payment has been recorded.' });
    navigate('/sale/payments');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Record Invoice Payment</h1>
      <p className="text-muted-foreground mb-6">Select invoice and enter payment info.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Payment details</CardTitle><CardDescription>Invoice, amount, mode, date</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Invoice</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('invoiceId')}>
                <option value="">Select invoice</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName} - Rs.{inv.total.toLocaleString()}</option>
                ))}
              </select>
              {errors.invoiceId && <p className="text-sm text-destructive">{errors.invoiceId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Amount (Rs.)</Label>
              <Input type="number" step="0.01" {...register('amount')} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('paymentMode')}>
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input type="date" {...register('paymentDate')} />
              {errors.paymentDate && <p className="text-sm text-destructive">{errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Reference ID (optional)</Label>
              <Input {...register('referenceId')} placeholder="Transaction ID" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input {...register('notes')} />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record Payment</Button>
            <Button type="button" variant="outline" asChild><Link to="/sale/payments">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
