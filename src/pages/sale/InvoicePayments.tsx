import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments } from '@/hooks/useData';
import { PAYMENT_MODES } from '@/lib/constants';

const modeMap = Object.fromEntries(PAYMENT_MODES.map(m => [m.value, m.label]));

import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicePayments() {
  const [search, setSearch] = useState('');
  const { data: payments = [], isLoading } = usePayments({ type: 'INCOMING' });

  const filtered = payments.filter((ip: any) =>
    !search || (ip.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase()) || (ip.referenceId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-10 w-full max-w-sm" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Invoice Payments</h1><p className="text-muted-foreground">Record payments against customer invoices</p></div>
        <Button asChild><Link to="/sale/payments/create"><Plus className="h-4 w-4 mr-2" /> Record Payment</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All invoice payments</CardDescription>
          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by invoice #..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments.</TableCell></TableRow>
              ) : (
                filtered.map((ip: any) => (
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
