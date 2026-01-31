import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePurchaseOrders } from '@/hooks/useData';
import { ORDER_STATUSES } from '@/lib/constants';

const statusMap = Object.fromEntries(ORDER_STATUSES.map(s => [s.value, s]));

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { data: purchaseOrders, isLoading } = usePurchaseOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const all = purchaseOrders || [];
  const filtered = all.filter(po => {
    const matchSearch = !search || po.orderNumber.toLowerCase().includes(search.toLowerCase()) || (po.vendorName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading purchase orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Create and manage purchase orders</p>
        </div>
        <Button asChild>
          <Link to="/purchase/orders/create">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
          <CardDescription>Filter by status</CardDescription>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by order number or vendor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total (Rs.)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No purchase orders found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(po => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/purchase/orders/${po.id}/edit`)}
                  >
                    <TableCell className="font-medium">{po.orderNumber}</TableCell>
                    <TableCell>{po.vendorName ?? po.vendorId}</TableCell>
                    <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>{po.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[po.status]?.color === 'destructive' ? 'destructive' : statusMap[po.status]?.color === 'success' ? 'default' : 'secondary'}>
                        {po.status}
                      </Badge>
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
