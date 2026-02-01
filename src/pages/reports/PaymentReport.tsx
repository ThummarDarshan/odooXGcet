import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportService } from '@/services/reportData';
import { exportToCSV } from '@/lib/utils';
import { CustomerInvoice } from '@/types';
import { Download } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentReport() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await reportService.getCustomerInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Failed to fetch invoices", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const notPaid = invoices.filter(inv => {
    const status = String(inv.paymentStatus).toUpperCase();
    return status === 'NOT_PAID';
  });
  const partiallyPaid = invoices.filter(i => {
    const status = String(i.paymentStatus).toUpperCase();
    return status === 'PARTIALLY_PAID';
  });
  const paid = invoices.filter(i => {
    const status = String(i.paymentStatus).toUpperCase();
    return status === 'PAID';
  });
  const outstanding = notPaid.reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);

  const handleExport = () => {
    const data = invoices.map(inv => ({
      InvoiceNumber: inv.invoiceNumber,
      Customer: inv.customerName || inv.customerId,
      InvoiceDate: new Date(inv.invoiceDate).toLocaleDateString(),
      DueDate: new Date(inv.dueDate).toLocaleDateString(),
      Total: inv.total,
      PaidAmount: inv.paidAmount,
      RemainingAmount: Number(inv.total) - Number(inv.paidAmount),
      PaymentStatus: inv.paymentStatus,
      Status: inv.status
    }));
    exportToCSV(data, 'payment_status_report');
  };

  const getPaymentStatusBadge = (status: string) => {
    const upperStatus = String(status).toUpperCase();
    if (upperStatus === 'PAID') return <Badge className="bg-green-600 hover:bg-green-700 text-white">Paid</Badge>;
    if (upperStatus === 'PARTIALLY_PAID') return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Partially Paid</Badge>;
    return <Badge variant="destructive">Not Paid</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[350px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-3 w-[80px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => (
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoice Payment Status Report</h1>
          <p className="text-muted-foreground">Outstanding, partially paid, paid</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Not Paid</CardTitle><CardDescription>Outstanding</CardDescription></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{notPaid.length}</p>
            <p className="text-xs text-muted-foreground">₹{outstanding.toLocaleString('en-IN')} outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Partially Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{partiallyPaid.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{paid.length}</p></CardContent>
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
                <TableHead>Invoice Date</TableHead>
                <TableHead>Total (₹)</TableHead>
                <TableHead>Paid (₹)</TableHead>
                <TableHead>Remaining (₹)</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices found.</TableCell></TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customerName ?? inv.customerId}</TableCell>
                    <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">₹{Number(inv.total).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-mono">₹{Number(inv.paidAmount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-mono">₹{(Number(inv.total) - Number(inv.paidAmount)).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{getPaymentStatusBadge(inv.paymentStatus)}</TableCell>
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
