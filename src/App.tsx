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

// Account
import Contacts from "@/pages/account/Contacts";
import ContactForm from "@/pages/account/ContactForm";
import Products from "@/pages/account/Products";
import ProductForm from "@/pages/account/ProductForm";
import CostCenters from "@/pages/account/CostCenters";
import CostCenterForm from "@/pages/account/CostCenterForm";
import Budgets from "@/pages/account/Budgets";
import BudgetForm from "@/pages/account/BudgetForm";
import BudgetDetail from "@/pages/account/BudgetDetail";
import AnalyticalModels from "@/pages/account/AnalyticalModels";
import AnalyticalModelForm from "@/pages/account/AnalyticalModelForm";

// Purchase
import PurchaseOrders from "@/pages/purchase/PurchaseOrders";
import PurchaseOrderForm from "@/pages/purchase/PurchaseOrderForm";
import VendorBills from "@/pages/purchase/VendorBills";
import VendorBillForm from "@/pages/purchase/VendorBillForm";
import BillPayments from "@/pages/purchase/BillPayments";
import BillPaymentForm from "@/pages/purchase/BillPaymentForm";

// Sale
import SalesOrders from "@/pages/sale/SalesOrders";
import SalesOrderForm from "@/pages/sale/SalesOrderForm";
import CustomerInvoices from "@/pages/sale/CustomerInvoices";
import CustomerInvoiceForm from "@/pages/sale/CustomerInvoiceForm";
import InvoiceDetail from "@/pages/sale/InvoiceDetail";
import InvoicePayments from "@/pages/sale/InvoicePayments";
import InvoicePaymentForm from "@/pages/sale/InvoicePaymentForm";

// Reports
import BudgetReport from "@/pages/reports/BudgetReport";
import CostCenterReport from "@/pages/reports/CostCenterReport";
import PaymentReport from "@/pages/reports/PaymentReport";

// Customer Portal
import CustomerDashboard from "@/pages/portal/CustomerDashboard";
import PortalInvoices from "@/pages/portal/CustomerInvoices";
import PortalPay from "@/pages/portal/PortalPay";

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
              <AuthGuard requiredRole="admin">
                <AppLayout />
              </AuthGuard>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/account/contacts" element={<Contacts />} />
              <Route path="/account/contacts/create" element={<ContactForm />} />
              <Route path="/account/contacts/:id/edit" element={<ContactForm />} />
              <Route path="/account/products" element={<Products />} />
              <Route path="/account/products/create" element={<ProductForm />} />
              <Route path="/account/products/:id/edit" element={<ProductForm />} />
              <Route path="/account/cost-centers" element={<CostCenters />} />
              <Route path="/account/cost-centers/create" element={<CostCenterForm />} />
              <Route path="/account/cost-centers/:id/edit" element={<CostCenterForm />} />
              <Route path="/account/budgets" element={<Budgets />} />
              <Route path="/account/budgets/create" element={<BudgetForm />} />
              <Route path="/account/budgets/:id/edit" element={<BudgetForm />} />
              <Route path="/account/budgets/:id" element={<BudgetDetail />} />
              <Route path="/account/analytical-models" element={<AnalyticalModels />} />
              <Route path="/account/analytical-models/create" element={<AnalyticalModelForm />} />
              <Route path="/account/analytical-models/:id/edit" element={<AnalyticalModelForm />} />
              <Route path="/purchase/orders" element={<PurchaseOrders />} />
              <Route path="/purchase/orders/create" element={<PurchaseOrderForm />} />
              <Route path="/purchase/orders/:id/edit" element={<PurchaseOrderForm />} />
              <Route path="/purchase/orders/:id" element={<PurchaseOrderForm />} />
              <Route path="/purchase/bills" element={<VendorBills />} />
              <Route path="/purchase/bills/create" element={<VendorBillForm />} />
              <Route path="/purchase/bills/:id/edit" element={<VendorBillForm />} />
              <Route path="/purchase/bills/:id" element={<VendorBillForm />} />
              <Route path="/purchase/payments" element={<BillPayments />} />
              <Route path="/purchase/payments/create" element={<BillPaymentForm />} />
              <Route path="/sale/orders" element={<SalesOrders />} />
              <Route path="/sale/orders/create" element={<SalesOrderForm />} />
              <Route path="/sale/orders/:id/edit" element={<SalesOrderForm />} />
              <Route path="/sale/orders/:id" element={<SalesOrderForm />} />
              <Route path="/sale/invoices" element={<CustomerInvoices />} />
              <Route path="/sale/invoices/create" element={<CustomerInvoiceForm />} />
              <Route path="/sale/invoices/:id" element={<CustomerInvoiceForm />} />
              <Route path="/sale/invoices/:id/edit" element={<CustomerInvoiceForm />} />
              <Route path="/sale/payments" element={<InvoicePayments />} />
              <Route path="/sale/payments/create" element={<InvoicePaymentForm />} />
              <Route path="/reports/budget" element={<BudgetReport />} />
              <Route path="/reports/cost-centers" element={<CostCenterReport />} />
              <Route path="/reports/payments" element={<PaymentReport />} />
            </Route>

            {/* Customer Portal Routes */}
            <Route element={
              <AuthGuard requiredRole="customer">
                <AppLayout />
              </AuthGuard>
            }>
              <Route path="/portal/dashboard" element={<CustomerDashboard />} />
              <Route path="/portal/invoices" element={<PortalInvoices />} />
              <Route path="/portal/invoices/:id" element={<CustomerInvoiceForm />} />
              <Route path="/portal/pay" element={<PortalPay />} />
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

export default App;
