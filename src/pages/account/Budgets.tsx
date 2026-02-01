import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBudgets } from '@/hooks/useData';
import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

export default function Budgets() {
  const navigate = useNavigate();
  const { data: budgets = [], isLoading, refetch, isRefetching } = useBudgets();
  const [search, setSearch] = useState('');

  const filtered = budgets.filter(b =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.costCenterName || '').toLowerCase().includes(search.toLowerCase())
  );

  // Simple aggregation for metrics
  const totalPlanned = filtered.reduce((sum, b) => sum + b.plannedAmount, 0);
  const totalActual = filtered.reduce((sum, b) => sum + b.actualAmount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-72" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Manage financial budgets and track actuals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isRefetching}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/account/budgets/create">
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics - Simple Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPlanned.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalActual.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search budgets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget Name</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="w-[200px]">Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No budgets found.</TableCell></TableRow>
              ) : (
                filtered.map(b => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/account/budgets/${b.id}/edit`)}>
                    <TableCell className="font-medium">{b.name} <span className="text-xs text-muted-foreground ml-1">v{b.version}</span></TableCell>
                    <TableCell>{b.costCenterName}</TableCell>
                    <TableCell className="text-xs">{new Date(b.periodStart).toLocaleDateString()} - {new Date(b.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">₹{b.plannedAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span>₹{b.actualAmount.toLocaleString()}</span>
                        {(b.reservedAmount ?? 0) > 0 && (
                          <span className="text-xs text-amber-600 font-medium" title="Includes unposted drafts">+₹{b.reservedAmount?.toLocaleString()} (Reserved)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(b.achievementPercentage, 100)}
                          className={cn(
                            "h-2 w-full",
                            b.status === "over_budget" ? "[&>*]:bg-red-500" : "[&>*]:bg-primary"
                          )}
                        />
                        <span className="text-xs font-medium w-10 text-right">{b.achievementPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.stage === 'confirmed' ? 'default' : 'secondary'}>
                        {b.stage}
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
