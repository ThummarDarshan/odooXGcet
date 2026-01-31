import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { budgetStore, salesOrderStore } from '@/services/mockData';

// function getStatusBadge(status: string) {
//   if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
//   if (status === 'near_limit') return <Badge className="bg-yellow-500/90 text-white">Near Limit</Badge>;
//   return <Badge className="bg-green-600/90 text-white">Under Budget</Badge>;
// }

function getStatusBadge(status: string) {
  if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
  if (status === 'near_limit') return <Badge variant="warning">Near Limit</Badge>;
  return <Badge variant="success">Under Budget</Badge>;
}

export default function BudgetReport() {
  const budgets = budgetStore.getAll();
  const salesOrders = salesOrderStore.getAll();

  const totalBudget = budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
  const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0);

  // Calculate Total Sales (only posted)
  const totalSales = salesOrders
    .filter(so => so.status === 'posted')
    .reduce((sum, so) => sum + so.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budget Achievement Report</h1>
          <p className="text-muted-foreground">Planned vs actual by cost center</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Sales Summary Box */}
          <Card className="min-w-[200px]">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total Sales</span>
                <span className="text-2xl font-bold font-mono text-blue-700">₹{totalSales.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Expense Summary Box */}
          <Card className="min-w-[300px]">
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Budget:</span>
                  <span className="font-medium font-mono">₹{totalBudget.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Actual Expense:</span>
                  <span className="font-mono text-primary">
                    ₹{totalActual.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>All budgets with achievement percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget Name</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Planned (₹)</TableHead>
                <TableHead>Actual (₹)</TableHead>
                <TableHead>Achievement %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No budgets.</TableCell></TableRow>
              ) : (
                budgets.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.costCenterName ?? b.costCenterId}</TableCell>
                    <TableCell>{b.periodStart} <span className="mx-1">→</span> {b.periodEnd}</TableCell>
                    <TableCell className="font-mono">₹{b.plannedAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-mono">₹{b.actualAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${b.achievementPercentage > 100 ? 'text-destructive' : 'text-primary'}`}>
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
