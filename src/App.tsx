import React, { Suspense, lazy } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeProvider';
import { UserProvider } from './context/UserContext';
import { SettingsProvider } from './context/SettingsContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';

// Layout and Loading components
import ProtectedLayout from './components/layout/ProtectedLayout';
import RequireRoles from './components/layout/RequireRoles';
import Login from './components/dashboard/auth/Login';

// A simple loading fallback component for suspense
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-full bg-background text-foreground">
    <div className="text-lg font-semibold">Loading...</div>
  </div>
);

// Lazy load all page components
// Lazy load all page components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Orders = lazy(() => import('./components/orders/Orders'));
const Expenses = lazy(() => import('./components/expenses/Expenses'));
const Materials = lazy(() => import('./components/materials/MaterialsPage'));
const Staff = lazy(() => import('./components/staff/Staff'));
const CustomersPage = lazy(() => import('./components/customers'));
const Payments = lazy(() => import('./components/payments/Payments'));
const DueSummary = lazy(() => import('./components/due/DueSummary'));
const ProductMaster = lazy(() => import('./components/products/ProductMaster'));
const StatusOverview = lazy(() => import('./components/orders/StatusOverview'));
const InvoiceList = lazy(() => import('./components/invoices/InvoiceList'));
const InvoicePage = lazy(() => import('./components/invoices/InvoicePage'));
const UserManagement = lazy(() => import('./components/users/UserManagement'));
const StockPage = lazy(() => import('./components/stock/StockPage'));
const ShowcasePage = lazy(() => import('./components/showcase/ShowcasePage'));
const WhatsAppDashboard = lazy(() => import('./components/WhatsAppDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));
const TeamChatPage = lazy(() => import('./pages/TeamChatPage'));
const AdminContentManagement = lazy(() => import('@/pages/AdminContentManagement'));
const LocalAgentPage = lazy(() => import('./pages/LocalAgentPage'));
const AIAgentPage = lazy(() => import('./pages/AIAgentPage'));
const InsightsPage = lazy(() => import('./pages/ComprehensiveInsightsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BusinessInsights = lazy(() => import('./components/ai/BusinessInsights'));
const WeeklyProgress = lazy(() => import('./components/enhancements/WeeklyProgress'));

const LoyaltyProgram = lazy(() => import('./components/loyalty/LoyaltyProgram'));
const CustomerSupportPage = lazy(() => import('./components/admin/CustomerSupportPage'));
const OrderChatAdminPage = lazy(() => import('./components/admin/OrderChatAdminPage'));
const JobCreationWizard = lazy(() => import('./components/jobs/JobCreationWizard'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CommunicationPage = lazy(() => import('./pages/CommunicationPage'));

// Helper function to wrap routes with Suspense and ErrorBoundary
const Suspended = (element: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
  </ErrorBoundary>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={Suspended(<ForgotPasswordPage />)} />
      <Route path="/reset-password" element={Suspended(<ResetPasswordPage />)} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={Suspended(<Dashboard />)} />
        <Route path="/orders" element={Suspended(<Orders />)} />
        <Route path="/expenses" element={Suspended(<Expenses />)} />
        <Route path="/materials" element={Suspended(<Materials />)} />
        <Route path="/staff" element={Suspended(<Staff />)} />
        <Route path="/customers" element={Suspended(<CustomersPage />)} />
        <Route path="/payments" element={Suspended(<Payments />)} />
        <Route path="/due-summary" element={Suspended(<DueSummary />)} />
        <Route path="/products" element={Suspended(<ProductMaster />)} />
        <Route path="/status-overview" element={Suspended(<StatusOverview />)} />
        <Route path="/invoices" element={Suspended(<InvoiceList />)} />
        <Route path="/invoices/:id" element={Suspended(<InvoicePage />)} />
        <Route
          path="/users"
          element={Suspended(
            <RequireRoles allowed={['owner']}>
              <UserManagement />
            </RequireRoles>
          )}
        />
        <Route path="/stock" element={Suspended(<StockPage />)} />
        <Route path="/showcase" element={Suspended(<ShowcasePage />)} />

        // Unified Communication Hub

        <Route path="/showcase" element={Suspended(<ShowcasePage />)} />
        {/* Unified Communication Hub */}
        <Route path="/communication" element={Suspended(<CommunicationPage />)} />

        {/* Legacy redirects can be handled by the new page or simple redirects, 
            but for now we route them to the hub with the correct tab if needed, 
            or just replace them. For simplicity, we point them to the new page. */}
        <Route path="/whatsapp" element={Suspended(<CommunicationPage />)} />
        <Route path="/team-chat" element={Suspended(<CommunicationPage />)} />
        <Route path="/customer-support" element={Suspended(<CommunicationPage />)} />
        <Route path="/order-chat-admin" element={Suspended(<CommunicationPage />)} />

        <Route path="/settings" element={Suspended(<SettingsPage />)} />
        {/* Job Creation Wizard */}
        <Route
          path="/jobs/new"
          element={Suspended(
            <RequireRoles allowed={['owner', 'manager', 'office']}>
              <JobCreationWizard />
            </RequireRoles>
          )}
        />
        <Route path="/notifications" element={Suspended(<NotificationsPage />)} />
      </Route>

      {/* 404 page */}
      <Route path="*" element={Suspended(<NotFoundPage />)} />
    </>
  )
);

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SettingsProvider>
          <RealtimeProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                success: {
                  duration: 3000,
                  style: {
                    background: 'hsl(var(--success))',
                    color: 'hsl(var(--success-foreground))'
                  },
                  iconTheme: {
                    primary: 'hsl(var(--success-foreground))',
                    secondary: 'hsl(var(--success))',
                  }
                },
                error: {
                  duration: 5000,
                  style: {
                    background: 'hsl(var(--destructive))',
                    color: 'hsl(var(--destructive-foreground))'
                  },
                  iconTheme: {
                    primary: 'hsl(var(--destructive-foreground))',
                    secondary: 'hsl(var(--destructive))',
                  }
                },
                style: {
                  fontSize: '14px',
                  maxWidth: '400px',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius)',
                },
              }}
            />
            <RouterProvider router={router} />
            <PWAInstallPrompt />
          </RealtimeProvider>
        </SettingsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
