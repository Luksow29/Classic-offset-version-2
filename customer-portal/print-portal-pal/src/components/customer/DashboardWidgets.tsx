
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, Clock, CheckCircle, AlertTriangle, PackageOpen } from 'lucide-react';
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
}

const StatCard = ({ title, value, icon, onClick, formatAsCurrency = false }: { title: string, value: string | number, icon: React.ReactNode, onClick: () => void, formatAsCurrency?: boolean }) => (
  <button onClick={onClick} className="w-full text-left">
    <Card className="shadow-sm hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">
              {formatAsCurrency ? `₹${Number(value).toLocaleString('en-IN')}` : value}
          </p>
        </div>
        <div className="text-primary/70">{icon}</div>
      </CardContent>
    </Card>
  </button>
);

const WidgetSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-8 w-1/3" /></CardContent></Card>
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

      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount, balance_amount')
        .eq('customer_id', customerId);

      if (fetchError) {
        console.error("Error fetching dashboard stats:", fetchError);
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const outstandingBalance = orders.reduce((sum, order) => sum + (order.balance_amount || 0), 0);
      const completedOrders = orders.filter(order => order.balance_amount === 0).length;
      const pendingOrders = totalOrders - completedOrders;

      setStats({
        totalOrders,
        totalSpent,
        outstandingBalance,
        pendingOrders,
      });
      setTimeout(() => setIsLoading(false), 300);
    };

    fetchStats();
  }, [customerId]);

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (error) {
    return (
        <div className="mb-8 p-4 bg-destructive/10 text-destructive-foreground rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5"/>
            <div>
                <p className="font-semibold">Could not load dashboard widgets.</p>
                <p className="text-sm opacity-90">{error}</p>
            </div>
        </div>
    )
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Total Orders" value={stats.totalOrders} icon={<Package size={32}/>} onClick={() => setActiveTab('orders')} />
      <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<PackageOpen size={32}/>} onClick={() => setActiveTab('orders')} />
      <StatCard title="Outstanding Balance" value={stats.outstandingBalance} icon={<Clock size={32}/>} onClick={() => setActiveTab('invoices')} formatAsCurrency />
      <StatCard title="Lifetime Spent" value={stats.totalSpent} icon={<DollarSign size={32}/>} onClick={() => setActiveTab('profile')} formatAsCurrency />
    </div>
  );
};

export default DashboardWidgets;
