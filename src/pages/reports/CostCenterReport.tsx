import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { reportService } from '@/services/reportData';
import { exportToCSV } from '@/lib/utils';
import { Budget } from '@/types';
import { Download } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

export default function CostCenterReport() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await reportService.getBudgets();
        setBudgets(data);
      } catch (error) {
        console.error("Failed to fetch budgets", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalActual = budgets.reduce((s, b) => s + Number(b.actualAmount), 0);

  const handleExport = () => {
    const data = budgets.map(b => ({
      CostCenter: b.costCenterName || b.costCenterId,
      ActualAmount: b.actualAmount,
      PercentageOfTotal: totalActual > 0 ? Math.round((Number(b.actualAmount) / totalActual) * 100) + '%' : '0%'
    }));
    exportToCSV(data, 'cost_center_report');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[350px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => (
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cost Center Performance Report</h1>
          <p className="text-muted-foreground">Expense breakdown by cost center</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Expense by Cost Center</CardTitle><CardDescription>Actual spend and percentage</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cost Center</TableHead><TableHead>Actual (Rs.)</TableHead><TableHead>% of Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No data.</TableCell></TableRow>
              ) : (
                budgets.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.costCenterName ?? b.costCenterId}</TableCell>
                    <TableCell>{Number(b.actualAmount).toLocaleString()}</TableCell>
                    <TableCell>{totalActual > 0 ? Math.round((Number(b.actualAmount) / totalActual) * 100) : 0}%</TableCell>
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
