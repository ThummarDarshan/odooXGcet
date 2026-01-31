import { Link } from 'react-router-dom';
import { DollarSign, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerInvoices } from '@/hooks/useData';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data: invoices = [], isLoading } = useCustomerInvoices();

  const outstanding = invoices
    .filter(inv => inv.paymentStatus !== 'paid')
    .reduce((s, inv) => s + (inv.total - inv.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user?.name}. View your invoices and pay online.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
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
            <CardContent>
              <Button asChild><Link to="/portal/invoices"><FileText className="h-4 w-4 mr-2" /> My Invoices</Link></Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
