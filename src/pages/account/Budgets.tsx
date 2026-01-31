import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { budgetStore } from '@/services/mockData';

function getStatusBadge(status: string) {
  if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
  if (status === 'near_limit') return <Badge className="bg-yellow-500/90 text-white">Near Limit</Badge>;
  return <Badge className="bg-green-600/90 text-white">Under Budget</Badge>;
}

export default function Budgets() {
  const [search, setSearch] = useState('');
  const all = budgetStore.getAll();
  const filtered = all.filter(b => {
    const nameMatch = !search || b.name.toLowerCase().includes(search.toLowerCase());
    const ccMatch = !search || (b.costCenterName ?? '').toLowerCase().includes(search.toLowerCase());
    return nameMatch || ccMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Manage budgets by cost center and period</p>
        </div>
        <Button asChild>
          <Link to="/account/budgets/create">
            <Plus className="h-4 w-4 mr-2" />
            New Budget
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Budgets</CardTitle>
          <CardDescription>Planned vs actual with status indicators</CardDescription>
          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No budgets found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.costCenterName ?? b.costCenterId}</TableCell>
                    <TableCell>{b.periodStart} - {b.periodEnd}</TableCell>
                    <TableCell>Rs.{b.plannedAmount.toLocaleString()}</TableCell>
                    <TableCell>Rs.{b.actualAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-24">
                        <Progress value={Math.min(b.achievementPercentage, 100)} className="h-2" />
                        <span className="text-xs">{b.achievementPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(b.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/account/budgets/${b.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/account/budgets/${b.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
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
