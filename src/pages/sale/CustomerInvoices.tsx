import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { customerInvoiceStore } from '@/services/mockData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState<string>('all');
  const all = customerInvoiceStore.getAll();
  const filtered = all.filter(inv => {
    const okSearch = !search || (inv.customerName ?? '').toLowerCase().includes(search.toLowerCase());
    const okPay = payFilter === 'all' || inv.paymentStatus === payFilter;
    return okSearch && okPay;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Customer Invoices</h1><p className="text-muted-foreground">Invoices and payment status</p></div>

      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={payFilter} onChange={e => setPayFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All payment status</option>
              {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invoices.</TableCell></TableRow>
              ) : (
                filtered.map(inv => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/sale/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customerName ?? inv.customerId}</TableCell>
                    <TableCell>{inv.invoiceDate}</TableCell>
                    <TableCell>Rs.{inv.total.toLocaleString()}</TableCell>
                    <TableCell>Rs.{inv.paidAmount.toLocaleString()}</TableCell>
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
