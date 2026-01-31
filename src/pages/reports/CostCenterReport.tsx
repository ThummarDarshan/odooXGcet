import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { budgetStore } from '@/services/mockData';

export default function CostCenterReport() {
  const budgets = budgetStore.getAll();
  const totalActual = budgets.reduce((s, b) => s + b.actualAmount, 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Cost Center Performance Report</h1><p className="text-muted-foreground">Expense breakdown by cost center</p></div>
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
                    <TableCell>{b.actualAmount.toLocaleString()}</TableCell>
                    <TableCell>{totalActual > 0 ? Math.round((b.actualAmount / totalActual) * 100) : 0}%</TableCell>
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
