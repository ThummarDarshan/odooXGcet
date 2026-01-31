import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Eye, Search, RefreshCw } from 'lucide-react';
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
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const all = budgetStore.getAll();

  const filtered = all.filter(b => {
    const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.costCenterName ?? '').toLowerCase().includes(search.toLowerCase());

    if (showAll) return matchesSearch;
    // By default, hide Revised and Archived
    return matchesSearch && b.stage !== 'revised' && b.stage !== 'archived';
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Manage budgets by cost center and period</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAll ? "secondary" : "outline"}
            onClick={() => setShowAll(!showAll)}
            title={showAll ? "Hide History" : "Show History (Revised/Archived)"}
          >
            {showAll ? "Hide History" : "Show History"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey(k => k + 1)} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link to="/account/budgets/create">
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Link>
          </Button>
        </div>
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
                <TableHead>Stage</TableHead>
                <TableHead>Ver.</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No budgets found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(b => (
                  <TableRow
                    key={b.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${b.stage === 'archived' ? 'opacity-60 bg-muted/20' : (b.stage === 'revised' ? 'opacity-70 bg-muted/10' : '')
                      }`}
                    onClick={() => navigate(`/account/budgets/${b.id}/edit`)}
                  >
                    <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                    <TableCell>{b.costCenterName ?? b.costCenterId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                            ${b.stage === 'draft' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}
                            ${b.stage === 'confirmed' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}
                            ${b.stage === 'revised' ? 'bg-muted text-muted-foreground' : ''}
                            ${b.stage === 'archived' ? 'bg-muted text-muted-foreground opacity-70' : ''}
                        `}>
                        {b.stage.charAt(0).toUpperCase() + b.stage.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-muted-foreground text-xs font-mono bg-muted px-1.5 py-0.5 rounded">v{b.version}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.periodStart} <span className="mx-1">→</span> {b.periodEnd}</TableCell>
                    <TableCell className="font-mono text-sm">₹{b.plannedAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">₹{b.actualAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-28">
                        <Progress
                          value={Math.min(b.achievementPercentage, 100)}
                          className={`h-2 ${b.status === 'over_budget' ? '[&>*]:bg-destructive' : '[&>*]:bg-primary'}`}
                        />
                        <span className={`text-xs font-medium w-[3ch] text-right ${b.status === 'over_budget' ? 'text-destructive' : 'text-primary'}`}>
                          {b.achievementPercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(b.status)}</TableCell>
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
