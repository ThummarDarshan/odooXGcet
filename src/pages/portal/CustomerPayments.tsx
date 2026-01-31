import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { invoicePaymentStore, contactStore } from '@/services/mockData';
import { PAYMENT_MODES } from '@/lib/constants';

const modeMap = Object.fromEntries(PAYMENT_MODES.map(m => [m.value, m.label]));

export default function CustomerPayments() {
  const { user } = useAuth();
  const customerId = user?.email ? contactStore.getAll().find(c => c.type === 'customer' && c.email === user.email)?.id ?? null : null;
  const payments = customerId ? invoicePaymentStore.getByCustomerId(customerId) : [];

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
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments.</TableCell></TableRow>
              ) : (
                payments.map(ip => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-medium">{ip.invoiceNumber ?? ip.invoiceId}</TableCell>
                    <TableCell>{ip.amount.toLocaleString()}</TableCell>
                    <TableCell>{modeMap[ip.paymentMode] ?? ip.paymentMode}</TableCell>
                    <TableCell>{ip.paymentDate}</TableCell>
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
