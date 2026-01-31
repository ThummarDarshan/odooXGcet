import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { billPaymentStore, vendorBillStore } from '@/services/mockData';
import { PAYMENT_MODES } from '@/lib/constants';
import type { PaymentMode } from '@/types';
import { DocumentLayout } from '@/components/layout/DocumentLayout';

const schema = z.object({
  billId: z.string().min(1, 'Select a bill'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  paymentMode: z.string() as z.ZodType<PaymentMode>,
  paymentDate: z.string().min(1),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function BillPaymentForm() {
  const [searchParams] = useSearchParams();
  const preselectedBillId = searchParams.get('billId');
  // const preselectedAmount = searchParams.get('amount'); // If we wanted to support passing amount
  const navigate = useNavigate();
  const { toast } = useToast();

  // Only show bills that are not fully paid
  const bills = vendorBillStore.getAll().filter(vb => vb.paymentStatus !== 'paid');

  const selectedBill = preselectedBillId ? vendorBillStore.getById(preselectedBillId) : null;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      billId: preselectedBillId ?? '',
      amount: selectedBill ? (selectedBill.total - selectedBill.paidAmount) : 0,
      paymentMode: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceId: '',
      notes: '',
    },
  });

  const billId = watch('billId');

  useEffect(() => {
    if (billId) {
      const bill = vendorBillStore.getById(billId);
      if (bill) {
        // Use remaining amount by default if amount is 0 or user changed bill? 
        // We can be smart but let's keep it simple: if amount is 0, set to remaining.
        // Or verify current amount vs new bill context.
        const remaining = bill.total - bill.paidAmount;
        // setValue('amount', remaining); // Removing auto-set on change to avoid overwriting user input if they are typing?
        // But if they switch bill, they likely want the new bill's amount.
        // Let's rely on user or initial load.
      }
    }
  }, [billId]);

  const onSubmit = (data: FormValues) => {
    billPaymentStore.create({
      billId: data.billId,
      amount: data.amount,
      paymentMode: data.paymentMode,
      paymentDate: data.paymentDate,
      referenceId: data.referenceId,
      notes: data.notes,
    });
    toast({ title: 'Payment recorded', description: 'Bill payment has been recorded.' });
    // Navigate back to the bill
    navigate(`/purchase/bills/${data.billId}`);
  };

  return (
    <DocumentLayout
      title="Record Bill Payment"
      subtitle="Process payment for vendor bill"
      backTo={preselectedBillId ? `/purchase/bills/${preselectedBillId}` : "/purchase/payments"}
      status="Draft"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Select bill and enter payment info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Bill</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('billId')}>
                <option value="">Select bill</option>
                {bills.map(vb => (
                  <option key={vb.id} value={vb.id}>
                    {vb.billNumber} - {vb.vendorName} - Rs.{vb.total.toLocaleString()} (Due: {vb.dueDate})
                  </option>
                ))}
              </select>
              {errors.billId && <p className="text-sm text-destructive">{errors.billId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (Rs.)</Label>
                <Input type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                {billId && (() => {
                  const b = vendorBillStore.getById(billId);
                  return b ? <p className="text-xs text-muted-foreground">Remaining: Rs.{(b.total - b.paidAmount).toLocaleString()}</p> : null;
                })()}
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" {...register('paymentDate')} />
                {errors.paymentDate && <p className="text-sm text-destructive">{errors.paymentDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('paymentMode')}>
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reference ID (Method / Check #)</Label>
              <Input {...register('referenceId')} placeholder="e.g. TXN-123456" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...register('notes')} placeholder="Additional notes..." />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 justify-end bg-muted/20 p-4">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate & Pay
            </Button>
          </CardFooter>
        </Card>
      </form>
    </DocumentLayout>
  );
}
