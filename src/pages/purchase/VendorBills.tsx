import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { vendorBillStore, purchaseOrderStore } from '@/services/mockData';
import { PAYMENT_STATUSES } from '@/lib/constants';

const payMap = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

export default function VendorBills() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState<string>('all');
  const all = vendorBillStore.getAll();
  const filtered = all.filter(vb => {
    const okSearch = !search || (vb.vendorName ?? '').toLowerCase().includes(search.toLowerCase());
    const okPay = payFilter === 'all' || vb.paymentStatus === payFilter;
    return okSearch && okPay;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendor Bills</h1>
          <p className="text-muted-foreground">Bills from vendors</p>
        </div>

      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Vendor Bills</CardTitle>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vendor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No bills.</TableCell></TableRow>
              ) : (
                filtered.map(vb => {
                  const po = vb.purchaseOrderId ? purchaseOrderStore.getById(vb.purchaseOrderId) : null;
                  return (
                    <TableRow
                      key={vb.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/purchase/bills/${vb.id}/edit`)}
                    >
                      <TableCell className="font-medium">{vb.billNumber}</TableCell>
                      <TableCell>
                        {po ? (
                          <Link
                            to={`/purchase/orders/${po.id}`}
                            className="text-blue-600 hover:underline relative z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {po.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{vb.vendorName ?? vb.vendorId}</TableCell>
                      <TableCell>{vb.billDate}</TableCell>
                      <TableCell>Rs.{vb.total.toLocaleString()}</TableCell>
                      <TableCell>Rs.{vb.paidAmount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={payMap[vb.paymentStatus]?.color === 'destructive' ? 'destructive' : 'secondary'}>{vb.paymentStatus.replace('_', ' ')}</Badge></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
