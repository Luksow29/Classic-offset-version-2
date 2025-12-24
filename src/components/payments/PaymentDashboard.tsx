// src/components/dashboard/PaymentDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import {
  DollarSign, TrendingUp, TrendingDown, Clock,
  Users, CreditCard, AlertTriangle, CheckCircle,
  Calendar, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface PaymentMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  averageOrderValue: number;
  ordersByStatus: {
    paid: number;
    partial: number;
    due: number;
    overdue: number;
  };
  recentPayments: number;
  paymentMethods: Record<string, number>;
  revenueTrend: { date: string; amount: number }[];
}

interface RecentPayment {
  id: string;
  customer_name: string;
  amount_paid: number;
  status: string;
  created_at: string;
  payment_method?: string;
  order_id?: number;
}

const PaymentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const days = parseInt(selectedPeriod);
      const daysAgo = startOfDay(subDays(new Date(), days));

      // Get both order data and detailed payment entries
      const { data: summaryOrders, error: summaryOrdersError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          total_amount,
          amount_received,
          balance_amount,
          date,
          delivery_date,
          is_deleted
        `)
        .gte('date', daysAgo.toISOString())
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (summaryOrdersError) throw summaryOrdersError;

      // Get detailed payment entries from payments table
      const { data: detailedPayments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          order_id,
          amount_paid,
          payment_method,
          payment_date,
          created_at
        `)
        .gte('payment_date', daysAgo.toISOString())
        .order('payment_date', { ascending: true });

      if (paymentsError) throw paymentsError;

      // --- Processing Metrics ---

      const totalOrders = summaryOrders?.length || 0;
      const totalRevenue = summaryOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalReceived = detailedPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
      const pendingAmount = summaryOrders?.reduce((sum, o) => sum + (o.balance_amount || 0), 0) || 0;

      // Overdue amount
      const overdueAmount = summaryOrders?.reduce((sum, o) => {
        const isOverdue = new Date(o.delivery_date) < new Date() && (o.balance_amount || 0) > 0;
        return sum + (isOverdue ? (o.balance_amount || 0) : 0);
      }, 0) || 0;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Order Status Counts
      const ordersByStatus = summaryOrders?.reduce((acc, o) => {
        const balance = o.balance_amount || 0;
        const received = o.amount_received || 0;
        const isOverdue = new Date(o.delivery_date) < new Date();

        if (balance <= 0) acc.paid += 1;
        else if (isOverdue && balance > 0) acc.overdue += 1;
        else if (received > 0) acc.partial += 1;
        else acc.due += 1;
        return acc;
      }, { paid: 0, partial: 0, due: 0, overdue: 0 }) || { paid: 0, partial: 0, due: 0, overdue: 0 };

      // Payment Methods
      const paymentMethods = detailedPayments?.reduce((acc, p) => {
        const method = p.payment_method || 'Other';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Revenue Trend (Daily grouping)
      const trendMap = new Map<string, number>();

      // Initialize all days with 0
      for (let i = 0; i <= days; i++) {
        const date = subDays(new Date(), i);
        trendMap.set(format(date, 'MMM dd'), 0);
      }

      detailedPayments?.forEach(p => {
        const dateStr = format(new Date(p.payment_date || p.created_at), 'MMM dd');
        const current = trendMap.get(dateStr) || 0;
        trendMap.set(dateStr, current + (p.amount_paid || 0));
      });

      // Sort chronological
      const revenueTrend = Array.from(trendMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => {
          // Simple parse back to compare sort, or reliance on map keys insertion order if careful (but safer to sort)
          // Since we populated map backwards, let's just reverse or rely on data. 
          // Actually, standard Map preserves insertion order. We inserted Today -> Past. 
          // We want Past -> Today for chart.
          return 0; // We'll reverse after mapping
        })
        .reverse();


      // Recent Payments List
      const recentList = detailedPayments
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(p => {
          const order = summaryOrders?.find(o => o.id === p.order_id);
          return {
            id: p.id.toString(),
            customer_name: order?.customer_name || 'Unknown Log',
            amount_paid: p.amount_paid,
            status: 'Paid',
            created_at: p.payment_date || p.created_at,
            payment_method: p.payment_method,
            order_id: p.order_id
          };
        }) || [];

      setMetrics({
        totalOrders,
        totalRevenue,
        totalReceived,
        pendingAmount,
        overdueAmount,
        averageOrderValue,
        ordersByStatus,
        recentPayments: detailedPayments?.length || 0,
        paymentMethods,
        revenueTrend
      });

      setRecentPayments(recentList);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header - Compact on Mobile */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-2xl font-bold tracking-tight text-foreground">Financial</h2>
          <p className="text-muted-foreground text-[10px] sm:text-sm hidden sm:block">Track revenue, pending payments, and cash flow.</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-2 py-1 sm:px-4 sm:py-2 bg-card border border-border rounded-lg text-[10px] sm:text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
        >
          <option value="7">7 Days</option>
          <option value="30">30 Days</option>
          <option value="90">90 Days</option>
          <option value="365">Year</option>
        </select>
      </div>

      {/* Stats Grid - 3 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-emerald-500 bg-gradient-to-br from-card to-emerald-500/5 rounded-xl">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-muted-foreground uppercase">Collected</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-foreground mt-0.5">₹{(metrics.totalReceived / 1000).toFixed(0)}k</h3>
            <div className="hidden sm:flex items-center mt-1 text-[10px] sm:text-xs text-emerald-600">
              <TrendingUp size={10} className="mr-0.5" />
              <span>+12.5%</span>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-amber-500/5 rounded-xl">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-muted-foreground uppercase">Pending</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-foreground mt-0.5">₹{(metrics.pendingAmount / 1000).toFixed(0)}k</h3>
            <p className="hidden sm:block text-[10px] sm:text-xs text-amber-600 mt-1">
              {metrics.ordersByStatus.due + metrics.ordersByStatus.partial} orders
            </p>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-rose-500 bg-gradient-to-br from-card to-rose-500/5 rounded-xl">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-muted-foreground uppercase">Overdue</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-rose-600 mt-0.5">₹{(metrics.overdueAmount / 1000).toFixed(0)}k</h3>
            <p className="hidden sm:block text-[10px] sm:text-xs text-rose-600 mt-1">
              {metrics.ordersByStatus.overdue} orders
            </p>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-500/5 rounded-xl hidden lg:block">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-muted-foreground uppercase">Avg. Order</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-foreground mt-0.5">₹{Math.round(metrics.averageOrderValue / 1000).toFixed(0)}k</h3>
            <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
              {metrics.totalOrders} orders
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Section - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Main Chart: Revenue Trend */}
        <Card className="lg:col-span-2 p-3 sm:p-6 flex flex-col h-[200px] sm:h-[400px]">
          <div className="flex items-center justify-between mb-2 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-foreground">Revenue</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">Daily payment collections</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-sm text-muted-foreground">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full"></div><span className="hidden sm:inline">Revenue</span>
            </div>
          </div>
          <div className="w-full flex-1 min-h-[120px] sm:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Secondary: Payment Status Distribution */}
        <Card className="p-6 h-[400px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Payment Status</h3>
            <p className="text-sm text-muted-foreground">Distribution of order payments</p>
          </div>
          <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: metrics.ordersByStatus.paid },
                    { name: 'Partial', value: metrics.ordersByStatus.partial },
                    { name: 'Due', value: metrics.ordersByStatus.due },
                    { name: 'Overdue', value: metrics.ordersByStatus.overdue },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value, entry: any) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-muted/30 rounded">
              <span className="block text-xs text-muted-foreground">Collection Rate</span>
              <span className="font-bold text-emerald-600">
                {Math.round((metrics.ordersByStatus.paid / metrics.totalOrders) * 100) || 0}%
              </span>
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <span className="block text-xs text-muted-foreground">Overdue Rate</span>
              <span className="font-bold text-rose-600">
                {Math.round((metrics.ordersByStatus.overdue / metrics.totalOrders) * 100) || 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions & Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground">Latest 5 payments received</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Activity size={20} />
            </div>
          </div>

          <div className="space-y-4">
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent transactions found</div>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {payment.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payment.customer_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{payment.payment_method || 'Cash'}</span>
                        {payment.order_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono">#{payment.order_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">₹{payment.amount_paid.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1 text-xs text-emerald-600">
                      <CheckCircle size={10} />
                      <span>Paid</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Payment Methods</h3>
          <div className="space-y-4">
            {Object.entries(metrics.paymentMethods)
              .sort(([, a], [, b]) => b - a)
              .map(([method, count], index) => (
                <div key={method} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{method}</span>
                    <span className="text-muted-foreground">{count} txns</span>
                  </div>
                  <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / metrics.recentPayments) * 100}%`, opacity: 1 - (index * 0.15) }}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(metrics.paymentMethods).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default PaymentDashboard;
