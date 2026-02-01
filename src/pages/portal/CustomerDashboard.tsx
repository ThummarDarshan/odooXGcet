import { Link } from 'react-router-dom';
import { DollarSign, FileText, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerInvoices } from '@/hooks/useData';

import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data: invoices = [], isLoading } = useCustomerInvoices();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array(2).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px] mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[120px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const outstanding = invoices
    .filter(inv => inv.paymentStatus !== 'paid')
    .reduce((s, inv) => s + (inv.total - inv.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user?.name}. View your invoices and pay online.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs.{outstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Amount due on invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <Button variant="link" className="p-0 h-auto" asChild><Link to="/portal/invoices">View all</Link></Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>View your invoices and pay with UPI, card, net banking, or wallet</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild><Link to="/portal/invoices"><FileText className="h-4 w-4 mr-2" /> My Invoices</Link></Button>
          <Button variant="outline" asChild><Link to="/portal/payments"><CreditCard className="h-4 w-4 mr-2" /> Payment History</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
