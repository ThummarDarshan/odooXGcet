import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportService } from '@/services/reportData';
import { exportToCSV } from '@/lib/utils';
import { Budget, SalesOrder } from '@/types';
import { Download } from 'lucide-react';

function getStatusBadge(status: string) {
  if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
  if (status === 'near_limit') return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Near Limit</Badge>;
  return <Badge className="bg-green-600 hover:bg-green-700 text-white">Under Budget</Badge>;
}

export default function BudgetReport() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [budgetsData, salesData] = await Promise.all([
          reportService.getBudgets(),
          reportService.getSalesOrders()
        ]);
        setBudgets(budgetsData);
        setSalesOrders(salesData);
      } catch (error) {
        console.error("Failed to fetch report data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExport = () => {
    const data = budgets.map(b => ({
      Name: b.name,
      CostCenter: b.costCenterName || b.costCenterId,
      Type: b.type,
      StartDate: new Date(b.periodStart).toLocaleDateString(),
      EndDate: new Date(b.periodEnd).toLocaleDateString(),
      Planned: b.plannedAmount,
      Actual: b.actualAmount,
      Reserved: b.reservedAmount,
      Remaining: b.remainingBalance,
      Achievement: `${b.achievementPercentage}%`,
      Status: b.status
    }));
    exportToCSV(data, 'budget_report');
  };

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.plannedAmount), 0);
  const totalActual = budgets.reduce((sum, b) => sum + Number(b.actualAmount), 0);

  // Calculate Total Sales (only posted)
  const totalSales = salesOrders
    .filter(so => so.status === 'posted')
    .reduce((sum, so) => sum + Number(so.total), 0);

  if (loading) return <div>Loading report...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budget Achievement Report</h1>
          <p className="text-muted-foreground">Planned vs actual by cost center</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>

          {/* Sales Summary Box */}
          <Card className="min-w-[200px]">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total Sales (Posted)</span>
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
                  <span>Total Actual:</span>
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
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No budgets found.</TableCell></TableRow>
              ) : (
                budgets.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.costCenterName ?? b.costCenterId}</TableCell>
                    <TableCell>{new Date(b.periodStart).toLocaleDateString()} <span className="mx-1">→</span> {new Date(b.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">₹{Number(b.plannedAmount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-mono">₹{Number(b.actualAmount).toLocaleString('en-IN')}</TableCell>
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
