import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useCustomerInvoices } from '@/hooks/useData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useCustomerInvoices();

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Invoices</h1><p className="text-muted-foreground">View all your invoices</p></div>
      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Invoice number, date, total, status</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total (Incl. GST)</TableHead>
                <TableHead>Paid (Rs.)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices found.</TableCell></TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>Rs.{inv.total.toLocaleString()}</TableCell>
                    <TableCell>Rs.{inv.paidAmount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={payMap[inv.paymentStatus]?.color === 'destructive' ? 'destructive' : 'secondary'}>{inv.paymentStatus.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* In Portal, view only links to a read-only view or portal view? 
                           For now keeping it simple. */}
                      <Button variant="outline" size="sm" asChild><Link to={`/portal/invoices/${inv.id}`}>View</Link></Button>
                      {inv.paymentStatus !== 'paid' && <Button size="sm" asChild><Link to={`/portal/pay?invoiceId=${inv.id}`}>Pay Now</Link></Button>}
                    </TableCell>
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
