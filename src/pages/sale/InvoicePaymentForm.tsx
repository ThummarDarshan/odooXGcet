import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCustomerInvoices, useCreatePayment } from '@/hooks/useData';
import { PAYMENT_MODES } from '@/lib/constants';
import type { PaymentMode } from '@/types';
import { DocumentLayout } from '@/components/layout/DocumentLayout';

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

  const { data: allInvoices = [], isLoading } = useCustomerInvoices();
  const { mutate: createPayment, isPending } = useCreatePayment();

  // Filter for unpaid or partially paid
  const invoices = allInvoices.filter((inv: any) => (inv.paymentStatus !== 'PAID' && inv.paymentStatus !== 'paid') && (inv.status !== 'CANCELLED' && inv.status !== 'cancelled'));

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
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

  const selectedInvoiceId = watch('invoiceId');

  useEffect(() => {
    if (preselectedInvoiceId && invoices.length > 0) {
      const inv = invoices.find((i: any) => i.id === preselectedInvoiceId);
      if (inv) {
        setValue('invoiceId', preselectedInvoiceId);
        setValue('amount', inv.total - inv.paidAmount);
      }
    }
  }, [preselectedInvoiceId, invoices, setValue]);

  useEffect(() => {
    if (selectedInvoiceId && !preselectedInvoiceId && invoices.length > 0) {
      const inv = invoices.find((i: any) => i.id === selectedInvoiceId);
      if (inv) setValue('amount', inv.total - inv.paidAmount);
    }
  }, [selectedInvoiceId, preselectedInvoiceId, setValue, invoices]);


  const onSubmit = (data: FormValues) => {
    const inv = invoices.find((i: any) => i.id === data.invoiceId);
    if (!inv) return;

    createPayment({
      contactId: inv.customerId,
      amount: data.amount,
      mode: data.paymentMode,
      type: 'INCOMING',
      date: data.paymentDate,
      billId: data.invoiceId, // repurposed for generic invoiceId in hook
      isBill: false,
      reference: data.referenceId,
      notes: data.notes
    }, {
      onSuccess: () => {
        toast({ title: 'Payment recorded', description: 'Invoice payment has been recorded.' });
        navigate(`/sale/invoices/${data.invoiceId}/edit`);
      },
      onError: () => toast({ title: 'Error', description: 'Failed to record payment.', variant: 'destructive' })
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading invoices...</div>;

  return (
    <DocumentLayout
      title="Register Payment"
      backTo={preselectedInvoiceId ? `/sale/invoices/${preselectedInvoiceId}/edit` : "/sale/payments"}
      actions={<Button type="submit" form="pay-form" loading={isPending}>Validate & Pay</Button>}
    >
      <form id="pay-form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Invoice</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('invoiceId')}>
                  <option value="">Select invoice</option>
                  {invoices.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName} - Due: Rs.{(inv.total - inv.paidAmount).toLocaleString()}</option>
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
            </div>
          </CardContent>
        </Card>
      </form>
    </DocumentLayout>
  );
}
