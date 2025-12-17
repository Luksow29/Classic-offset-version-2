
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, Clock, CheckCircle, AlertTriangle, PackageOpen, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardWidgetsProps {
  customerId: string;
  setActiveTab: (tab: string) => void;
}

interface Stats {
  totalOrders: number;
  totalSpent: number;
  outstandingBalance: number;
  pendingOrders: number;
  loyaltyPoints: number;
  loyaltyTier: string;
}

const StatCard = ({ title, value, icon, onClick, formatAsCurrency = false, colorClass }: { title: string, value: string | number, icon: React.ReactNode, onClick: () => void, formatAsCurrency?: boolean, colorClass: string }) => (
  <button onClick={onClick} className="w-full text-left group">
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
      <CardContent className="p-6 flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatAsCurrency ? `₹${Number(value).toLocaleString('en-IN')}` : value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} transition-colors`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  </button>
);

const WidgetSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="border-0 shadow-sm"><CardContent className="p-6 space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-3/4" /></CardContent></Card>
    ))}
  </div>
);


const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ customerId, setActiveTab }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!customerId) return;

      setIsLoading(true);
      setError(null);

      // Fetch Orders Stats
      const ordersPromise = supabase
        .from('orders')
        .select('total_amount, balance_amount')
        .eq('customer_id', customerId);

      // Fetch Customer Loyalty Stats
      const customerPromise = supabase
        .from('customers')
        .select('loyalty_points, loyalty_tiers(tier_name)')
        .eq('id', customerId)
        .single();

      const [ordersResult, customerResult] = await Promise.all([ordersPromise, customerPromise]);

      const { data: orders, error: fetchError } = ordersResult;
      const { data: customerData, error: customerError } = customerResult;

      if (fetchError) {
        console.error("Error fetching dashboard stats:", fetchError);
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      // We don't error out if customerFetch fails, just default to 0
      if (customerError) {
        console.warn("Could not fetch customer loyalty data", customerError);
      }

      const totalOrders = orders ? orders.length : 0;
      const totalSpent = orders ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) : 0;
      const outstandingBalance = orders ? orders.reduce((sum, order) => sum + (order.balance_amount || 0), 0) : 0;
      // const completedOrders = orders.filter(order => order.balance_amount === 0).length; // Unused
      const pendingOrders = orders ? orders.filter(order => (order.balance_amount || 0) > 0).length : 0; // Approximate pending logic

      const loyaltyPoints = customerData?.loyalty_points || 0;
      // Handle nested loyalty_tiers. Depending on query it might be an array or object. single() implies object but relationship implies join.
      // @ts-ignore
      const loyaltyTier = customerData?.loyalty_tiers?.tier_name || 'Member';

      setStats({
        totalOrders,
        totalSpent,
        outstandingBalance,
        pendingOrders,
        loyaltyPoints,
        loyaltyTier
      });
      setTimeout(() => setIsLoading(false), 500); // Slight delay for smooth loading
    };

    fetchStats();

    const channel = supabase
      .channel(`dashboard-stats-${customerId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          console.log('[DashboardWidgets] Orders change:', payload);
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${customerId}`,
        },
        (payload) => {
          console.log('[DashboardWidgets] Customer change:', payload);
          // Refresh stats when loyalty points change
          fetchStats();
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
          console.log('[DashboardWidgets] Status log change:', payload);
          fetchStats();
        }
      )
      .subscribe((status) => {
        console.log('[DashboardWidgets] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <p className="font-semibold">Could not load dashboard widgets.</p>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Loyalty Points"
        value={stats.loyaltyPoints}
        icon={<Crown size={20} />}
        onClick={() => setActiveTab('profile')} // Assuming profile has details or creating a new tab
        colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
      />
      <StatCard
        title="Pending Orders"
        value={stats.pendingOrders}
        icon={<PackageOpen size={20} />}
        onClick={() => setActiveTab('orders')}
        colorClass="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
      />
      <StatCard
        title="Outstanding"
        value={stats.outstandingBalance}
        icon={<Clock size={20} />}
        onClick={() => setActiveTab('invoices')}
        formatAsCurrency
        colorClass="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
      />
      <StatCard
        title="Total Spent"
        value={stats.totalSpent}
        icon={<DollarSign size={20} />}
        onClick={() => setActiveTab('profile')}
        formatAsCurrency
        colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
};

export default DashboardWidgets;
