import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  account: 'Account',
  contacts: 'Contacts',
  products: 'Products',
  'cost-centers': 'Cost Centers',
  budgets: 'Budgets',
  'analytical-models': 'Auto Analytical Models',
  purchase: 'Purchase',
  orders: 'Orders',
  bills: 'Bills',
  payments: 'Payments',
  sale: 'Sale',
  invoices: 'Invoices',
  reports: 'Reports',
  budget: 'Budget Report',
  'payment-status': 'Payment Status',
  portal: 'Customer Portal',
  pay: 'Pay Now',
  create: 'Create New',
  edit: 'Edit',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, path };
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground py-2 px-4 lg:px-6 border-b bg-card/50">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
