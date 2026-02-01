import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, History, Receipt, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import { useBudget } from '@/hooks/useData';

function getStatusBadge(status: string) {
  if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
  if (status === 'near_limit') return <Badge className="bg-yellow-500/90 text-white">Near Limit</Badge>;
  return <Badge className="bg-green-600/90 text-white">Under Budget</Badge>;
}

import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [refreshKey, setRefreshKey] = useState(0); // Actually useQuery refetch handles this, but forcing re-render/refetch if needed

  const { data: budget, isLoading, refetch } = useBudget(id);

  // Revisions logic: currently simplistic in useBudget (nextVersionId/revisionOfId). 
  // If we want full history, backend needs to provide it or we traverse. 
  // For now, let's just show what we have or placeholder if revisions list is not yet in API.
  // The 'revisions' relation exists in Prisma, so we COULD fetch it. 
  // For this step, I'll focus on the main requirement: "Types" and "Transactions".
  // I will leave Revisions as empty for now or simplistic until backend specifically returns revision history list.

  const revisions: any[] = [];

  const recentTransactions = budget?.transactions || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Budget not found.</p>
        <Button asChild variant="link"><Link to="/account/budgets">Back to Budgets</Link></Button>
      </div>
    );
  }

  return (
    <DocumentLayout
      title={budget.name}
      subtitle={`${budget.costCenterName || 'Unknown Cost Center'} • ${new Date(budget.periodStart).toLocaleDateString()} → ${new Date(budget.periodEnd).toLocaleDateString()}`}
      backTo="/account/budgets"
      status={budget.stage}
      statusOptions={['Draft', 'Confirmed', 'Revised', 'Archived']}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {budget.stage !== 'archived' && (
            <Button asChild>
              <Link to={`/account/budgets/${budget.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Budget
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Planned vs actual ({budget.type})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Planned Amount</span>
              <span className="font-medium font-mono text-lg">₹{budget.plannedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Actual Amount</span>
              <span className="font-medium font-mono text-lg">₹{budget.actualAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Remaining Balance</span>
              <span className={`font-mono text-lg ${budget.remainingBalance < 0 ? 'font-bold text-destructive' : 'font-medium text-green-600'}`}>
                ₹{budget.remainingBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Achievement</span>
                <span className={`font-bold ${budget.status === 'over_budget' ? 'text-destructive' : 'text-primary'}`}>
                  {budget.achievementPercentage}%
                </span>
              </div>
              <Progress
                value={Math.min(budget.achievementPercentage, 100)}
                className={`h-2 ${budget.status === 'over_budget' ? '[&>*]:bg-destructive' : '[&>*]:bg-primary'}`}
              />
            </div>
            <div className="pt-2">{getStatusBadge(budget.status)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Revision History
            </CardTitle>
            <CardDescription>Changes to planned amount</CardDescription>
          </CardHeader>
          <CardContent>
            {revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No revisions recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revisions.map((rev: any) => (
                    <TableRow key={rev.id}>
                      <TableCell className="text-xs">{rev.revisedAt.slice(0, 10)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">₹{rev.previousAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-mono text-xs font-medium">₹{rev.newAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs">{rev.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            {(budget.type === 'INCOME' ? 'Customer Invoices' : 'Vendor Bills')} affecting this budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">No transactions affecting this budget yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx: any) => (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {budget.type === 'INCOME' ? <Receipt className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-orange-600" />}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{tx.reference}</TableCell>
                    <TableCell>{tx.partner}</TableCell>
                    <TableCell className="text-right font-medium font-mono">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DocumentLayout>
  );
}
