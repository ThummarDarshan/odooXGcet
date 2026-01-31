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

export default function BillPayments() {
  const [search, setSearch] = useState('');
  const { data: payments = [], isLoading } = usePayments({ type: 'OUTGOING' });

  const filtered = payments.filter((bp: any) =>
    !search || (bp.referenceId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Bill Payments</h1>
          <p className="text-muted-foreground">Record payments against vendor bills</p>
        </div>
        <Button asChild className="shrink-0 w-full sm:w-auto">
          <Link to="/purchase/payments/create"><Plus className="h-4 w-4 mr-2" /> Record Payment</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All bill payments</CardDescription>
          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by reference..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments found.</TableCell></TableRow>
              ) : (
                filtered.map((bp: any) => (
                  <TableRow key={bp.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {/* We don't have bill number easily here unless we fetch or store it */}
                      {/* Displaying '-' for now or allocation count */}
                      -
                    </TableCell>
                    <TableCell>Rs.{bp.amount.toLocaleString()}</TableCell>
                    <TableCell>{modeMap[bp.paymentMode] ?? bp.paymentMode}</TableCell>
                    <TableCell>{new Date(bp.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bp.referenceId ?? '-'}</TableCell>
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
