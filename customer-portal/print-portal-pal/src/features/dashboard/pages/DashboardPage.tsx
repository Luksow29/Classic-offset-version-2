// src/features/dashboard/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/useToast";
import { Tables } from "@/services/supabase/types";
import { CustomerRecovery } from "@/features/auth/components/Recovery";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { 
  ShoppingBag, 
  Palette, 
  MessageSquare, 
  History, 
  Package, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Crown,
  ArrowRight,
  Sparkles,
  Bell
} from 'lucide-react';
import { supabase } from "@/services/supabase/client";
import { motion } from "framer-motion";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: User | null;
  customer: Customer | null;
}

interface Stats {
  totalOrders: number;
  totalSpent: number;
  outstandingBalance: number;
  pendingOrders: number;
  completedOrders: number;
  loyaltyPoints: number;
}

// Skeleton Components
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Hero Skeleton */}
    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Content Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Recent Orders Skeleton */}
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-5 w-16 ml-auto" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, customer } = useOutletContext<OutletContext>();
  const [showRecovery, setShowRecovery] = useState(false);
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Tables<'orders'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !customer) {
      setShowRecovery(true);
    }
  }, [user, customer]);

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    if (!customer?.id) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      // Fetch customer loyalty
      const { data: customerData } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customer.id)
        .single();

      if (orders) {
        setRecentOrders(orders.slice(0, 5));
        
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const outstandingBalance = orders.reduce((sum, o) => sum + (o.balance_amount || 0), 0);
        const pendingOrders = orders.filter(o => (o.balance_amount || 0) > 0).length;
        const completedOrders = orders.filter(o => (o.balance_amount || 0) === 0).length;
        
        setStats({
          totalOrders,
          totalSpent,
          outstandingBalance,
          pendingOrders,
          completedOrders,
          loyaltyPoints: customerData?.loyalty_points || 0
        });
      }
      
      // Simulate minimum loading time for smooth transition
      setTimeout(() => setIsLoading(false), 600);
    };

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel(`dashboard-${customer.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customer.id}`,
      }, () => fetchData())
      .subscribe();

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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const getStatusBadge = (order: Tables<'orders'>) => {
    if (order.is_deleted) {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    }
    if ((order.balance_amount || 0) > 0) {
      return { label: 'Payment Due', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    }
    return { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Spent',
      value: `₹${(stats?.totalSpent || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Pending',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Loyalty Points',
      value: stats?.loyaltyPoints || 0,
      icon: Crown,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const quickActions = [
    {
      title: 'New Order Request',
      description: 'Start a new print project',
      icon: ShoppingBag,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/customer-portal/new-request'),
    },
    {
      title: 'Browse Designs',
      description: 'Explore templates & samples',
      icon: Palette,
      color: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/customer-portal/showcase'),
    },
    {
      title: 'Contact Support',
      description: 'Get help with your orders',
      icon: MessageSquare,
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => navigate('/customer-portal/support'),
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section with Background Image */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-8"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/login-bg.png')` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/85 via-indigo-600/80 to-purple-700/85" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-300" />
                <span className="text-blue-100 text-xs md:text-sm font-medium">{getGreeting()}</span>
              </div>
              <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
                Welcome back, {customer.name?.split(' ')[0]}!
              </h1>
              <div className="text-blue-100 text-sm md:text-base flex flex-wrap items-center gap-2">
                <span>Here's an overview of your print orders and account activity.</span>
                {customer.customer_code && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    ID: {customer.customer_code}
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={() => navigate('/customer-portal/new-request')}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg w-full md:w-auto"
              size="lg"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          {/* Quick Stats in Hero - Hidden on mobile */}
          {stats && stats.outstandingBalance > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex mt-6 items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 w-fit"
            >
              <AlertCircle className="h-5 w-5 text-amber-300" />
              <span className="text-white text-sm">
                Outstanding Balance: <strong>₹{stats.outstandingBalance.toLocaleString('en-IN')}</strong>
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 h-7"
                onClick={() => navigate('/customer-portal/invoices')}
              >
                Pay Now <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl hidden md:block" />
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl hidden md:block" />
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/customer-portal/orders')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 md:p-3 rounded-xl ${stat.lightBg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
          </div>
          
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={action.onClick}
                className="w-full group"
              >
                <Card className="border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {action.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </div>

          {/* Notification Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                    <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">Stay Updated</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      Enable notifications to get order updates instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <History className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Orders
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs hover:text-primary"
              onClick={() => navigate('/customer-portal/orders')}
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {recentOrders.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentOrders.map((order, index) => {
                    const status = getStatusBadge(order);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                        onClick={() => navigate('/customer-portal/orders')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${status.color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' : status.color.includes('amber') ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                              {status.label === 'Completed' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : status.label === 'Payment Due' ? (
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors">
                                Order #{String(order.id).slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {order.order_type || 'Print Job'} • {new Date(order.created_at || '').toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${status.color} border-0 text-xs`}>
                              {status.label}
                            </Badge>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                              ₹{(order.total_amount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">No orders yet</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Start your first print project today!</p>
                  <Button onClick={() => navigate('/customer-portal/new-request')}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Create Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {stats && (stats.completedOrders > 0 || stats.totalSpent > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completedOrders}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Completed Orders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">₹{(stats.totalSpent / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Lifetime Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
