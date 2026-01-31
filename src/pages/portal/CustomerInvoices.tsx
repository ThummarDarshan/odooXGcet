import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { customerInvoiceStore, contactStore } from '@/services/mockData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

export default function CustomerInvoices() {
  const { user } = useAuth();
  const customerId = user?.email ? contactStore.getAll().find(c => c.type === 'customer' && c.email === user.email)?.id ?? null : null;
  const invoices = customerId ? customerInvoiceStore.getByCustomerId(customerId) : [];

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
                <TableHead>Total (Rs.)</TableHead>
                <TableHead>Paid (Rs.)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices.</TableCell></TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.invoiceDate}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>{inv.total.toLocaleString()}</TableCell>
                    <TableCell>{inv.paidAmount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={payMap[inv.paymentStatus]?.color === 'destructive' ? 'destructive' : 'secondary'}>{inv.paymentStatus.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild><Link to={`/sale/invoices/${inv.id}`}>View</Link></Button>
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
