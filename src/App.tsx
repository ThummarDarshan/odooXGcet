import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard, GuestGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";

// Auth Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";

// Main Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            } />
            <Route path="/signup" element={
              <GuestGuard>
                <Signup />
              </GuestGuard>
            } />

            {/* Protected Routes with Layout */}
            <Route element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Account Module Placeholder Routes */}
              <Route path="/account/contacts" element={<PlaceholderPage title="Contacts" />} />
              <Route path="/account/products" element={<PlaceholderPage title="Products" />} />
              <Route path="/account/cost-centers" element={<PlaceholderPage title="Cost Centers" />} />
              <Route path="/account/budgets" element={<PlaceholderPage title="Budgets" />} />
              <Route path="/account/analytical-models" element={<PlaceholderPage title="Auto Analytical Models" />} />
              
              {/* Purchase Module Placeholder Routes */}
              <Route path="/purchase/orders" element={<PlaceholderPage title="Purchase Orders" />} />
              <Route path="/purchase/bills" element={<PlaceholderPage title="Vendor Bills" />} />
              <Route path="/purchase/payments" element={<PlaceholderPage title="Bill Payments" />} />
              
              {/* Sale Module Placeholder Routes */}
              <Route path="/sale/orders" element={<PlaceholderPage title="Sales Orders" />} />
              <Route path="/sale/invoices" element={<PlaceholderPage title="Customer Invoices" />} />
              <Route path="/sale/payments" element={<PlaceholderPage title="Invoice Payments" />} />
              
              {/* Reports Placeholder Routes */}
              <Route path="/reports/budget" element={<PlaceholderPage title="Budget Report" />} />
              <Route path="/reports/cost-centers" element={<PlaceholderPage title="Cost Center Report" />} />
              <Route path="/reports/payments" element={<PlaceholderPage title="Payment Status Report" />} />
            </Route>

            {/* Customer Portal Routes */}
            <Route element={
              <AuthGuard requiredRole="customer">
                <AppLayout />
              </AuthGuard>
            }>
              <Route path="/portal/dashboard" element={<PlaceholderPage title="Customer Dashboard" />} />
              <Route path="/portal/invoices" element={<PlaceholderPage title="My Invoices" />} />
              <Route path="/portal/payments" element={<PlaceholderPage title="Payment History" />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">This page is coming soon.</p>
    </div>
  );
}

export default App;
