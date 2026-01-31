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
import { Progress } from '@/components/ui/progress';
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

// Mock data for charts
const budgetVsActualData = [
  { name: 'Manufacturing', planned: 50000, actual: 42000 },
  { name: 'Marketing', planned: 25000, actual: 28000 },
  { name: 'Operations', planned: 30000, actual: 26000 },
  { name: 'Logistics', planned: 20000, actual: 18500 },
  { name: 'Admin', planned: 15000, actual: 14200 },
];

const costCenterData = [
  { name: 'Manufacturing', value: 42000, percentage: 33 },
  { name: 'Marketing', value: 28000, percentage: 22 },
  { name: 'Operations', value: 26000, percentage: 20 },
  { name: 'Logistics', value: 18500, percentage: 14 },
  { name: 'Admin', value: 14200, percentage: 11 },
];

const monthlyTrendData = [
  { month: 'Jan', revenue: 125000, expenses: 95000 },
  { month: 'Feb', revenue: 142000, expenses: 98000 },
  { month: 'Mar', revenue: 138000, expenses: 102000 },
  { month: 'Apr', revenue: 155000, expenses: 108000 },
  { month: 'May', revenue: 168000, expenses: 112000 },
  { month: 'Jun', revenue: 175000, expenses: 118000 },
];

const budgetUtilization = [
  { name: 'Manufacturing', utilized: 84, planned: 50000, actual: 42000, status: 'under' },
  { name: 'Marketing', utilized: 112, planned: 25000, actual: 28000, status: 'over' },
  { name: 'Operations', utilized: 87, planned: 30000, actual: 26000, status: 'under' },
  { name: 'Logistics', utilized: 93, planned: 20000, actual: 18500, status: 'warning' },
  { name: 'Admin', utilized: 95, planned: 15000, actual: 14200, status: 'warning' },
];

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  change: string; 
  changeType: 'positive' | 'negative'; 
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
        <div className={`flex items-center text-xs ${changeType === 'positive' ? 'text-success' : 'text-destructive'}`}>
          {changeType === 'positive' ? (
            <ArrowUpRight className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 mr-1" />
          )}
          {change} from last month
        </div>
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
          <span className={`text-xs px-2 py-0.5 rounded ${
            status === 'over' ? 'bg-destructive/10 text-destructive' :
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
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your business.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/sale/invoices/create">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/sale/payments/create">
              <Receipt className="h-4 w-4 mr-2" />
              Record Payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value="₹9,03,000"
          change="+12.5%"
          changeType="positive"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Purchases"
          value="₹5,28,700"
          change="+8.2%"
          changeType="positive"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Outstanding Receivables"
          value="₹1,45,200"
          change="-5.3%"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Outstanding Payables"
          value="₹87,400"
          change="+3.1%"
          changeType="negative"
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
          </CardContent>
        </Card>

        {/* Cost Center Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>By cost center</CardDescription>
          </CardHeader>
          <CardContent>
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
            {budgetUtilization.map((budget) => (
              <BudgetProgressBar 
                key={budget.name}
                name={budget.name}
                utilized={budget.utilized}
                status={budget.status}
              />
            ))}
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
                <LineChart data={monthlyTrendData}>
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
