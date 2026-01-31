import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments } from '@/hooks/useData';
import { PAYMENT_MODES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

const modeMap = Object.fromEntries(PAYMENT_MODES.map(m => [m.value, m.label]));

export default function CustomerPayments() {
  const { data: payments = [], isLoading } = usePayments({ type: 'INCOMING' });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Payment History</h1><p className="text-muted-foreground">All payments you have made</p></div>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : payments.length === 0 ? (
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
