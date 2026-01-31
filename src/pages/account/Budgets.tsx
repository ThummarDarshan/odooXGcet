import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Search, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBudgets } from '@/hooks/useData';
import { cn } from '@/lib/utils';

export default function Budgets() {
  const navigate = useNavigate();
  const { data: budgetsData, isLoading, refetch } = useBudgets();

  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');

  const all = budgetsData || [];

  const filtered = all.filter(b => {
    const matchesSearch = !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.costCenterName ?? '').toLowerCase().includes(search.toLowerCase());

    if (showAll) return matchesSearch;
    return matchesSearch && b.stage !== 'revised' && b.stage !== 'archived';
  });

  const incomeTotal = all.filter(b => b.type === 'INCOME').reduce((acc, b) => acc + b.plannedAmount, 0);
  const expenseTotal = all.filter(b => b.type === 'EXPENSE').reduce((acc, b) => acc + b.plannedAmount, 0);
  const overBudgetCnt = all.filter(b => b.status === 'over_budget' && b.stage === 'confirmed').length;

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading budgets...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Monitor spending and revenue across cost centers</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Card className="min-w-[180px] bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-100 shadow-sm overflow-hidden relative group">
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                <p className="text-[11px] uppercase font-bold text-blue-600/70 tracking-widest">Planned Expense</p>
              </div>
              <p className="text-2xl font-black text-blue-900 leading-none">₹{(expenseTotal / 100000).toFixed(1)}L</p>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
              <TrendingDown className="h-20 w-20 text-blue-600" />
            </div>
          </Card>

          <Card className="min-w-[180px] bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-100 shadow-sm overflow-hidden relative group">
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] uppercase font-bold text-emerald-600/70 tracking-widest">Planned Income</p>
              </div>
              <p className="text-2xl font-black text-emerald-900 leading-none">₹{(incomeTotal / 100000).toFixed(1)}L</p>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-20 w-20 text-emerald-600" />
            </div>
          </Card>

          <Card className="min-w-[150px] bg-gradient-to-br from-rose-50/50 to-orange-50/50 border-rose-100 shadow-sm overflow-hidden relative group">
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <p className="text-[11px] uppercase font-bold text-rose-600/70 tracking-widest">Over Budget</p>
              </div>
              <p className="text-2xl font-black text-rose-900 leading-none">{overBudgetCnt}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/50 p-2 rounded-xl border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Search by name or cost center..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 bg-background border-none shadow-inner focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className={cn(
              "h-10 px-4 text-xs font-semibold rounded-lg transition-all",
              showAll ? "bg-secondary text-secondary-foreground shadow-sm" : "hover:bg-muted"
            )}
          >
            {showAll ? "Hide History" : "Show History"}
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg hover:border-primary/30 transition-colors" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />
          <Button asChild size="sm" className="h-10 px-5 gap-2 rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Link to="/account/budgets/create">
              <Plus className="h-4 w-4 stroke-[3px]" />
              <span className="font-bold">New Budget</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-xl shadow-black/5 overflow-hidden bg-card/30 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 pl-6 w-[300px] text-xs uppercase font-extrabold tracking-widest text-muted-foreground/80">Description</TableHead>
                <TableHead className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground/80">Entity</TableHead>
                <TableHead className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground/80">Classification</TableHead>
                <TableHead className="text-right text-xs uppercase font-extrabold tracking-widest text-muted-foreground/80">Planned</TableHead>
                <TableHead className="text-right text-xs uppercase font-extrabold tracking-widest text-muted-foreground/80">Actual</TableHead>
                <TableHead className="w-[220px] text-xs uppercase font-extrabold tracking-widest text-muted-foreground/80">Utilization</TableHead>
                <TableHead className="text-right pr-6 w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted rounded-full">
                        <Search className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">No results matched your filter</p>
                      <Button variant="link" onClick={() => setSearch('')}>Clear Search</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(b => (
                  <TableRow
                    key={b.id}
                    className={cn(
                      "cursor-pointer group hover:bg-white/60 dark:hover:bg-white/5 transition-all border-b border-border/40 last:border-0",
                      (b.stage === 'archived' || b.stage === 'revised') && "opacity-60 bg-muted/10"
                    )}
                    onClick={() => navigate(`/account/budgets/${b.id}/edit`)}
                  >
                    <TableCell className="py-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                          b.type === 'INCOME' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {b.type === 'INCOME' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[15px] group-hover:text-primary transition-colors leading-tight">
                            {b.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded leading-none border border-border/50">
                              V{b.version}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground/70">
                              {new Date(b.periodStart).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-foreground/80">{b.costCenterName ?? 'Unassigned'}</span>
                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">Analytical Account</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge variant="outline" className={cn(
                          "w-fit text-[10px] font-black uppercase tracking-wider h-5 px-2 rounded-md transition-all group-hover:shadow-sm",
                          b.type === 'INCOME' ? "border-emerald-500/30 text-emerald-700 bg-emerald-50/50" : "border-amber-500/30 text-amber-700 bg-amber-50/50"
                        )}>
                          {b.type}
                        </Badge>
                        <div className="flex items-center gap-1.5 ml-0.5">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            b.stage === 'confirmed' ? "bg-emerald-500 ring-2 ring-emerald-500/20" :
                              (b.stage === 'draft' ? "bg-amber-400 ring-2 ring-amber-400/20" : "bg-zinc-400")
                          )} />
                          <span className="text-[11px] font-bold text-muted-foreground capitalize">{b.stage}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <p className="font-black text-[15px] text-foreground tracking-tight">
                        ₹{b.plannedAmount.toLocaleString('en-IN')}
                      </p>
                    </TableCell>

                    <TableCell className="text-right">
                      <p className="font-bold text-[14px] text-muted-foreground">
                        ₹{b.actualAmount.toLocaleString('en-IN')}
                      </p>
                    </TableCell>

                    <TableCell className="pr-10">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className={cn(
                            "text-xs font-black tabular-nums leading-none",
                            b.status === 'over_budget' ? "text-rose-600 animate-pulse" : "text-primary"
                          )}>
                            {b.achievementPercentage}%
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 leading-none">
                            {b.status === 'over_budget' ? 'Limit Broken' : 'Consumption'}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(b.achievementPercentage, 100)}
                          className={cn(
                            "h-2 rounded-full bg-muted shadow-inner",
                            b.status === 'over_budget' ? "[&>*]:bg-rose-500" : "[&>*]:bg-primary"
                          )}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/5 hover:text-primary">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legend / Info */}
      <div className="flex items-center gap-6 px-4 py-2 bg-muted/30 rounded-lg text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" /> Draft
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-zinc-400" /> Revised/Archived
        </div>
      </div>
    </div>
  );
}
