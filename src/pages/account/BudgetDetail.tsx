import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, History, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
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
import { budgetStore, purchaseOrderStore, vendorBillStore } from '@/services/mockData';

function getStatusBadge(status: string) {
  if (status === 'over_budget') return <Badge variant="destructive">Over Budget</Badge>;
  if (status === 'near_limit') return <Badge className="bg-yellow-500/90 text-white">Near Limit</Badge>;
  return <Badge className="bg-green-600/90 text-white">Under Budget</Badge>;
}

export default function BudgetDetail() {
  const { id } = useParams();
  const budget = id ? budgetStore.getById(id) : undefined;
  const revisions = id ? budgetStore.getRevisions(id) : [];

  // Get recent transactions affecting this budget
  const recentTransactions = [
    // Purchase orders
    ...purchaseOrderStore.getAll()
      .filter(po => po.status === 'posted' && po.lineItems.some(li => li.costCenterId === budget?.costCenterId))
      .map(po => ({
        id: po.id,
        type: 'purchase_order',
        reference: po.orderNumber,
        date: po.orderDate,
        amount: po.lineItems
          .filter(li => li.costCenterId === budget?.costCenterId)
          .reduce((sum, li) => sum + li.amount, 0),
        vendor: po.vendorName,
        link: `/purchase/orders/${po.id}`,
        icon: TrendingUp,
        color: 'text-blue-600'
      })),
    // Vendor bills
    ...vendorBillStore.getAll()
      .filter(vb => vb.lineItems.some(li => li.costCenterId === budget?.costCenterId))
      .map(vb => ({
        id: vb.id,
        type: 'vendor_bill',
        reference: vb.billNumber,
        date: vb.billDate,
        amount: vb.lineItems
          .filter(li => li.costCenterId === budget?.costCenterId)
          .reduce((sum, li) => sum + li.amount, 0),
        vendor: vb.vendorName,
        link: `/purchase/bills/${vb.id}`,
        icon: Receipt,
        color: 'text-orange-600'
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10); // Show last 10 transactions

  if (!budget) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Budget not found.</p>
        <Button asChild variant="link"><Link to="/account/budgets">Back to Budgets</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/account/budgets" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Budgets
            </Link>
          </Button>
          <h1 className="text-2xl font-bold mt-2">{budget.name}</h1>
          <p className="text-muted-foreground">{budget.costCenterName} - {budget.periodStart} to {budget.periodEnd}</p>
        </div>
        <Button asChild>
          <Link to={`/account/budgets/${budget.id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Budget
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Planned vs actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Planned Amount</span>
              <span className="font-medium">Rs.{budget.plannedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual Amount</span>
              <span className="font-medium">Rs.{budget.actualAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining Balance</span>
              <span className={budget.remainingBalance < 0 ? 'font-medium text-destructive' : 'font-medium'}>
                Rs.{budget.remainingBalance.toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Achievement</span>
                <span>{budget.achievementPercentage}%</span>
              </div>
              <Progress value={Math.min(budget.achievementPercentage, 100)} className="h-2" />
            </div>
            <div>{getStatusBadge(budget.status)}</div>
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
              <p className="text-sm text-muted-foreground">No revisions yet.</p>
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
                  {revisions.map(rev => (
                    <TableRow key={rev.id}>
                      <TableCell>{rev.revisedAt.slice(0, 10)}</TableCell>
                      <TableCell>Rs.{rev.previousAmount.toLocaleString()}</TableCell>
                      <TableCell>Rs.{rev.newAmount.toLocaleString()}</TableCell>
                      <TableCell>{rev.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Purchase orders and vendor bills affecting this budget</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map(tx => {
                  const Icon = tx.icon;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${tx.color}`} />
                          <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tx.reference}</TableCell>
                      <TableCell>{tx.vendor}</TableCell>
                      <TableCell className="text-right font-medium">
                        Rs.{tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={tx.link}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
