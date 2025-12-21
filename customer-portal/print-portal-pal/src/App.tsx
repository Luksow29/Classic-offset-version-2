import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { ThemeProvider } from "@/shared/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, createBrowserRouter, RouterProvider, createRoutesFromElements } from "react-router-dom";
import { lazy, Suspense } from "react";
import LandingPage from "./pages/LandingPage";
import NotFound from "./shared/components/common/NotFound";
import AuthPage from "./features/auth/pages/AuthPage";
import ProtectedLayout from "./shared/components/layout/ProtectedLayout";
import PWAInstallPrompt from "./shared/components/common/PWAInstallPrompt";
import NotificationPermissionBanner from "./features/notifications/components/NotificationPermissionBanner";

const queryClient = new QueryClient();

// Lazy load feature pages for better performance
const DashboardPage = lazy(() => import("./features/dashboard/pages/DashboardPage"));
const OrdersPage = lazy(() => import("./features/orders/pages/OrdersPage"));
const RequestsPage = lazy(() => import("./features/requests/pages/RequestsPage"));
const NewRequestPage = lazy(() => import("./features/requests/pages/NewRequestPage"));
const InvoicesPage = lazy(() => import("./features/invoices/pages/InvoicesPage"));
const SupportPage = lazy(() => import("./features/support/pages/SupportPage"));
const ProfilePage = lazy(() => import("./features/profile/pages/ProfilePage"));
const ContactPage = lazy(() => import("./features/support/pages/ContactPage"));
const LibraryPage = lazy(() => import("./features/products/pages/LibraryPage"));

const NotificationsPage = lazy(() => import("./features/notifications/pages/NotificationsPage"));
const PreferencesPage = lazy(() => import("./features/notifications/pages/PreferencesPage"));
const NotificationTestPage = lazy(() => import("./features/notifications/pages/NotificationTestPage"));

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
      <Route path="/" element={<LandingPage />} />
      <Route path="/customer-auth" element={<AuthPage />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedLayout />}>
        <Route path="/customer-portal" element={Suspended(DashboardPage)} />
        <Route path="/customer-portal/orders" element={Suspended(OrdersPage)} />
        <Route path="/customer-portal/requests" element={Suspended(RequestsPage)} />
        <Route path="/customer-portal/new-request" element={Suspended(NewRequestPage)} />
        <Route path="/customer-portal/invoices" element={Suspended(InvoicesPage)} />
        <Route path="/customer-portal/support" element={Suspended(SupportPage)} />
        <Route path="/customer-portal/profile" element={Suspended(ProfilePage)} />
        <Route path="/customer-portal/contact" element={Suspended(ContactPage)} />
        <Route path="/customer-portal/showcase" element={Suspended(LibraryPage)} />
        <Route path="/customer-portal/notifications" element={Suspended(NotificationsPage)} />
        <Route path="/customer-portal/notification-preferences" element={Suspended(PreferencesPage)} />
        <Route path="/customer-portal/notification-test" element={Suspended(NotificationTestPage)} />
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
