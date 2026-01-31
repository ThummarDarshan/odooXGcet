import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSalesOrders } from '@/hooks/useData';
import { ORDER_STATUSES } from '@/lib/constants';

const statusMap = Object.fromEntries(ORDER_STATUSES.map(s => [s.value, s]));

export default function SalesOrders() {
  const navigate = useNavigate();
  const { data: salesOrders, isLoading } = useSalesOrders();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const all = salesOrders || [];
  const filtered = all.filter(so => {
    const okSearch = !search || (so.customerName ?? '').toLowerCase().includes(search.toLowerCase());
    const okStatus = statusFilter === 'all' || so.status === statusFilter;
    return okSearch && okStatus;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading sales orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Sales Orders</h1><p className="text-muted-foreground">Create and manage sales orders</p></div>
        <Button asChild><Link to="/sale/orders/create"><Plus className="h-4 w-4 mr-2" /> New Sales Order</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Sales Orders</CardTitle>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All status</option>
              {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sales orders.</TableCell></TableRow>
              ) : (
                filtered.map(so => (
                  <TableRow
                    key={so.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/sale/orders/${so.id}/edit`)}
                  >
                    <TableCell className="font-medium">{so.orderNumber}</TableCell>
                    <TableCell>{so.customerName ?? so.customerId}</TableCell>
                    <TableCell>{new Date(so.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>Rs.{so.total.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{so.status}</Badge></TableCell>
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
