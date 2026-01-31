import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { customerInvoiceStore } from '@/services/mockData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

export default function PaymentReport() {
  const invoices = customerInvoiceStore.getAll();
  const notPaid = invoices.filter(inv => inv.paymentStatus === 'not_paid');
  const outstanding = notPaid.reduce((s, i) => s + (i.total - i.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Invoice Payment Status Report</h1><p className="text-muted-foreground">Outstanding, partially paid, paid</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Not Paid</CardTitle><CardDescription>Outstanding</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold">{notPaid.length}</p><p className="text-xs text-muted-foreground">Rs.{outstanding.toLocaleString()} outstanding</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Partially Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{invoices.filter(i => i.paymentStatus === 'partially_paid').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{invoices.filter(i => i.paymentStatus === 'paid').length}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>All Invoices by Payment Status</CardTitle><CardDescription>Invoice, customer, total, paid, status</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total (Rs.)</TableHead>
                <TableHead>Paid (Rs.)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invoices.</TableCell></TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customerName ?? inv.customerId}</TableCell>
                    <TableCell>{inv.total.toLocaleString()}</TableCell>
                    <TableCell>{inv.paidAmount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={payMap[inv.paymentStatus]?.color === 'destructive' ? 'destructive' : 'secondary'}>{inv.paymentStatus.replace('_', ' ')}</Badge></TableCell>
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
