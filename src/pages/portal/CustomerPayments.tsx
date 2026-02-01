import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments } from '@/hooks/useData';
import { PAYMENT_MODES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

const modeMap = Object.fromEntries(PAYMENT_MODES.map(m => [m.value, m.label]));

import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerPayments() {
  const { data: payments = [], isLoading } = usePayments({ type: 'INCOMING' });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">All payments you have made</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Payments</CardTitle><CardDescription>Invoice, amount, mode, date</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount (Rs.)</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments.</TableCell></TableRow>
              ) : (
                payments.map(ip => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-medium">{ip.invoiceNumber ?? '-'}</TableCell>
                    <TableCell>Rs.{ip.amount.toLocaleString()}</TableCell>
                    <TableCell>{modeMap[ip.paymentMode] ?? ip.paymentMode}</TableCell>
                    <TableCell>{new Date(ip.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{ip.referenceId ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
