import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  useDashboardMetrics,
  useDashboardTrends,
  useDashboardExpenseDistribution,
  useDashboardBudgets
} from '@/hooks/useDashboard';

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(160, 84%, 35%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)'];

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`flex items-center text-xs ${changeType === 'positive' ? 'text-success' : 'text-destructive'}`}>
            {changeType === 'positive' ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {change} from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetProgressBar({ name, utilized, status }: { name: string; utilized: number; status: string }) {
  const getStatusColor = () => {
    if (status === 'over') return 'bg-destructive';
    if (status === 'warning') return 'bg-warning';
    return 'bg-success';
  };

  const getStatusText = () => {
    if (status === 'over') return 'Over Budget';
    if (status === 'warning') return 'Near Limit';
    return 'Under Budget';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${status === 'over' ? 'bg-destructive/10 text-destructive' :
            status === 'warning' ? 'bg-warning/10 text-warning' :
              'bg-success/10 text-success'
            }`}>
            {getStatusText()}
          </span>
          <span className="font-medium">{utilized}%</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getStatusColor()} transition-all`}
          style={{ width: `${Math.min(utilized, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading: loadingMetrics, error: errorMetrics } = useDashboardMetrics();
  const { data: trends, isLoading: loadingTrends, error: errorTrends } = useDashboardTrends();
  const { data: distribution, isLoading: loadingDistribution, error: errorDistribution } = useDashboardExpenseDistribution();
  const { data: budgets, isLoading: loadingBudgets, error: errorBudgets } = useDashboardBudgets();

  if (loadingMetrics || loadingTrends || loadingDistribution || loadingBudgets) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Check for errors
  const hasError = errorMetrics || errorTrends || errorDistribution || errorBudgets;
  if (hasError) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold">Failed to Load Dashboard Data</h2>
            <p className="text-muted-foreground mt-2">
              There was an error loading the dashboard. Please check your connection and try again.
            </p>
            {errorMetrics && <p className="text-sm text-destructive mt-2">Metrics: {(errorMetrics as any)?.message}</p>}
            {errorTrends && <p className="text-sm text-destructive mt-2">Trends: {(errorTrends as any)?.message}</p>}
            {errorDistribution && <p className="text-sm text-destructive mt-2">Distribution: {(errorDistribution as any)?.message}</p>}
            {errorBudgets && <p className="text-sm text-destructive mt-2">Budgets: {(errorBudgets as any)?.message}</p>}
          </div>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  const budgetVsActualData = budgets?.budgetVsActualData || [];
  const budgetUtilization = budgets?.budgetUtilization || [];
  const costCenterData = distribution || [];
  // Calculate aggregate percentages for metric cards (Not implemented in backend yet, so hiding change or using 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your business.</p>
        </div>

      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value={`₹${(metrics?.totalSales || 0).toLocaleString()}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Purchases"
          value={`₹${(metrics?.totalPurchases || 0).toLocaleString()}`}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Outstanding Receivables"
          value={`₹${(metrics?.outstandingReceivables || 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Outstanding Payables"
          value={`₹${(metrics?.outstandingPayables || 0).toLocaleString()}`}
          icon={TrendingDown}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Comparison by cost center</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetVsActualData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No budgets configured. <Link to="/account/budgets/create" className="text-primary underline">Create a budget</Link> to see comparison.</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsActualData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" name="Planned" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Center Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>By cost center</CardDescription>
          </CardHeader>
          <CardContent>
            {costCenterData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No budget data yet.</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costCenterData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      labelLine={false}
                    >
                      {costCenterData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization & Monthly Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Budget Utilization
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardTitle>
            <CardDescription>Current period progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetUtilization.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets configured. <Link to="/account/budgets/create" className="text-primary underline">Create a budget</Link> to track spending.</p>
            ) : (
              budgetUtilization.map((budget: any) => (
                <BudgetProgressBar
                  key={budget.name}
                  name={budget.name}
                  utilized={budget.utilized}
                  status={budget.status}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Revenue vs Expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/account/contacts/create">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Add Contact</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/purchase/orders/create">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm">Purchase Order</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/sale/orders/create">
                <Receipt className="h-5 w-5" />
                <span className="text-sm">Sales Order</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/reports/budget">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">View Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
