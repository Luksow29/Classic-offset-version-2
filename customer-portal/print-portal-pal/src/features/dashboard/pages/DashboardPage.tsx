// src/pages/CustomerDashboard.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/useToast";
import { Tables } from "@/services/supabase/types";
import DashboardWidgets from "@/features/dashboard/components/Widgets";
import { CustomerRecovery } from "@/features/auth/components/Recovery";
import { Button } from "@/shared/components/ui/button";
import { ShoppingBag, Palette, MessageSquare, History, Package, Zap } from 'lucide-react';
import { supabase } from "@/services/supabase/client";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: User | null;
  customer: Customer | null;
}

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, customer } = useOutletContext<OutletContext>();
  const [showRecovery, setShowRecovery] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !customer) {
      // Show recovery if user exists but no customer record
      setShowRecovery(true);
    }
  }, [user, customer]);

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const [recentOrders, setRecentOrders] = useState<Tables<'orders'>[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!customer?.id) return;

    const fetchRecentOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentOrders(data);
      setLoadingOrders(false);
    };

    fetchRecentOrders();

    // Realtime subscription for recent orders
    const channel = supabase
      .channel(`dashboard-recent-orders-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${customer.id}`,
        },
        (payload) => {
          console.log('[Dashboard] Order change detected:', payload);
          fetchRecentOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_status_log',
        },
        (payload) => {
          console.log('[Dashboard] Status change detected:', payload);
          fetchRecentOrders();
        }
      )
      .subscribe((status) => {
        console.log('[Dashboard] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer?.id]);

  if (showRecovery) {
    return <CustomerRecovery onSuccess={handleRecoverySuccess} />;
  }

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p>{t('portal.redirecting')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSetActiveTab = (tab: string) => {
    // Navigate to the appropriate route based on tab
    switch (tab) {
      case 'orders':
        navigate('/customer-portal/orders');
        break;
      case 'invoices':
        navigate('/customer-portal/invoices');
        break;
      case 'profile':
        navigate('/customer-portal/profile');
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'payment due': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner - Cleaner, Modular */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Welcome back, {customer.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl">
            Overview of your print orders and account activity.
            {customer.customer_code && <span className="ml-3 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-600 dark:text-gray-300">ID: {customer.customer_code}</span>}
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-800/50 pointer-events-none" />
      </div>

      <DashboardWidgets customerId={customer.id} setActiveTab={handleSetActiveTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Modular Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
          </div>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start space-x-4 border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
              onClick={() => navigate('/customer-portal/requests')}
            >
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                <ShoppingBag size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">New Order Request</div>
                <div className="text-xs text-muted-foreground mt-0.5">Start a new project</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start space-x-4 border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
              onClick={() => navigate('/customer-portal/showcase')}
            >
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                <Palette size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">Browse Designs</div>
                <div className="text-xs text-muted-foreground mt-0.5">View templates</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start space-x-4 border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
              onClick={() => navigate('/customer-portal/support')}
            >
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                <MessageSquare size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">Contact Support</div>
                <div className="text-xs text-muted-foreground mt-0.5">Get help</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Activity - Modular Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                <History className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs hover:bg-transparent hover:text-primary transition-colors" onClick={() => navigate('/customer-portal/orders')}>View All Orders</Button>
          </div>
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {loadingOrders ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm">Loading activity...</p>
                  </div>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const status = order.is_deleted ? 'cancelled' : (order.balance_amount && order.balance_amount > 0 ? 'payment due' : 'completed');
                    return (
                      <div key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group cursor-pointer border-l-2 border-transparent hover:border-l-primary" onClick={() => navigate('/customer-portal/orders')}>
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${getStatusColor(status)} bg-opacity-10 dark:bg-opacity-20`}>
                            <Package size={18} strokeWidth={2} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Order #{order.id}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{order.order_type || 'Print Job'} • {new Date(order.created_at || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">₹{order.total_amount?.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium">No recent orders</p>
                    <p className="text-sm text-gray-400 mb-4">Start your first project today</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/customer-portal/requests')}>Create Request</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
