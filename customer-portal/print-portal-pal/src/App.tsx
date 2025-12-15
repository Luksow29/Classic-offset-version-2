import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, createBrowserRouter, RouterProvider, createRoutesFromElements } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CustomerAuth from "./pages/CustomerAuth";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import NotificationPermissionBanner from "./components/notifications/NotificationPermissionBanner";

const queryClient = new QueryClient();

// Lazy load components for better performance
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const CustomerOrders = lazy(() => import("./pages/CustomerOrdersPage"));
const CustomerRequests = lazy(() => import("./pages/CustomerRequestsPage"));
const CustomerInvoices = lazy(() => import("./pages/CustomerInvoicesPage"));
const CustomerSupport = lazy(() => import("./pages/CustomerSupportPage"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfilePage"));
const CustomerContact = lazy(() => import("./pages/CustomerContactPage"));
const ProductLibraryPage = lazy(() => import("./pages/ProductLibraryPage"));

const NotificationTestPage = lazy(() => import("./pages/NotificationTest"));
const NotificationPreferencesPage = lazy(() => import("./pages/NotificationPreferences"));

// Suspense wrapper component
const Suspended = (Component: React.ComponentType) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }>
    <Component />
  </Suspense>
);

// Create router with new structure
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/customer-auth" element={<CustomerAuth />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedLayout />}>
        <Route path="/customer-portal" element={Suspended(CustomerDashboard)} />
        <Route path="/customer-portal/orders" element={Suspended(CustomerOrders)} />
        <Route path="/customer-portal/requests" element={Suspended(CustomerRequests)} />
        <Route path="/customer-portal/invoices" element={Suspended(CustomerInvoices)} />
        <Route path="/customer-portal/support" element={Suspended(CustomerSupport)} />
        <Route path="/customer-portal/profile" element={Suspended(CustomerProfile)} />
        <Route path="/customer-portal/contact" element={Suspended(CustomerContact)} />
        <Route path="/customer-portal/showcase" element={Suspended(ProductLibraryPage)} />
        <Route path="/customer-portal/notifications" element={Suspended(NotificationTestPage)} />
        <Route path="/customer-portal/notification-preferences" element={Suspended(NotificationPreferencesPage)} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </>
  )
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <NotificationPermissionBanner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
