import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { budgetStore } from '@/services/mockData';

function getStatusBadge(status: string) {
  if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
  if (status === 'near_limit') return <Badge className="bg-yellow-500/90 text-white">Near Limit</Badge>;
  return <Badge className="bg-green-600/90 text-white">Under Budget</Badge>;
}

export default function BudgetReport() {
  const budgets = budgetStore.getAll();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budget Achievement Report</h1>
        <p className="text-muted-foreground">Planned vs actual by cost center</p>
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
                <TableHead>Planned (Rs.)</TableHead>
                <TableHead>Actual (Rs.)</TableHead>
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
                    <TableCell>{b.periodStart} - {b.periodEnd}</TableCell>
                    <TableCell>{b.plannedAmount.toLocaleString()}</TableCell>
                    <TableCell>{b.actualAmount.toLocaleString()}</TableCell>
                    <TableCell>{b.achievementPercentage}%</TableCell>
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
