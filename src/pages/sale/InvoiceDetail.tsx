import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { customerInvoiceStore } from '@/services/mockData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

export default function InvoiceDetail() {
  const { id } = useParams();
  const invoice = id ? customerInvoiceStore.getById(id) : undefined;

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button asChild variant="link"><Link to="/sale/invoices">Back to Invoices</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sale/invoices" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Invoices
            </Link>
          </Button>
          <h1 className="text-2xl font-bold mt-2">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">{invoice.customerName} - Due: {invoice.dueDate}</p>
        </div>
        <Badge variant={payMap[invoice.paymentStatus]?.color === 'destructive' ? 'destructive' : 'secondary'}>
          {invoice.paymentStatus.replace('_', ' ')}
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Amounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs.{invoice.subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>Rs.{invoice.tax.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">Rs.{invoice.total.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>Rs.{invoice.paidAmount.toLocaleString()}</span></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map(li => (
                <TableRow key={li.id}>
                  <TableCell>{li.productName ?? li.productId}</TableCell>
                  <TableCell>{li.quantity}</TableCell>
                  <TableCell>Rs.{li.unitPrice.toLocaleString()}</TableCell>
                  <TableCell>Rs.{li.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {invoice.paymentStatus !== 'paid' && (
        <Button asChild><Link to={`/sale/payments/create?invoiceId=${invoice.id}`}>Record Payment</Link></Button>
      )}
    </div>
  );
}
