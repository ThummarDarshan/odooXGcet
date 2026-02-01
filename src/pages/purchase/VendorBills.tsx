import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVendorBills } from '@/hooks/useData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

import { Skeleton } from '@/components/ui/skeleton';

export default function VendorBills() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState<string>('all');

  const { data: bills = [], isLoading } = useVendorBills();

  const filtered = bills.filter((vb: any) => {
    const okSearch = !search || (vb.vendorName ?? '').toLowerCase().includes(search.toLowerCase()) || (vb.billNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const okPay = payFilter === 'all' || vb.paymentStatus === payFilter;
    if (payFilter === 'unpaid') {
      return okSearch && (vb.paymentStatus === 'NOT_PAID' || vb.paymentStatus === 'PARTIALLY_PAID');
    }
    return okSearch && okPay;
  });

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
              <Skeleton className="h-6 w-[200px]" />
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[150px]" />
              </div>
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
        <div>
          <h1 className="text-2xl font-bold">Vendor Bills</h1>
          <p className="text-muted-foreground">Bills from vendors</p>
        </div>
        <Button asChild>
          <Link to="/purchase/bills/create">
            <Plus className="h-4 w-4 mr-2" />
            New Bill
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Vendor Bills</CardTitle>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vendor or bill #..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={payFilter} onChange={e => setPayFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All</option>
              {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Purchase Order</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Total (Incl. GST)</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No bills found.</TableCell></TableRow>
              ) : (
                filtered.map((vb: any) => (
                  <TableRow
                    key={vb.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/purchase/bills/${vb.id}/edit`)}
                  >
                    <TableCell className="font-medium">{vb.billNumber}</TableCell>
                    <TableCell>
                      {vb.purchaseOrderNumber ? (
                        <Link
                          to={`/purchase/orders/${vb.purchaseOrderId}`}
                          className="text-blue-600 hover:underline relative z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {vb.purchaseOrderNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{vb.vendorName ?? vb.vendorId}</TableCell>
                    <TableCell>{new Date(vb.date).toLocaleDateString()}</TableCell>
                    <TableCell>Rs.{vb.total.toLocaleString()}</TableCell>
                    <TableCell>Rs.{vb.paidAmount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={payMap[vb.paymentStatus]?.color === 'destructive' ? 'destructive' : 'secondary'}>{vb.paymentStatus.replace('_', ' ')}</Badge></TableCell>
                  </TableRow>
                )
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
