// src/components/dashboard/PaymentDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, 
  Users, CreditCard, AlertTriangle, CheckCircle,
  Calendar, BarChart3, PieChart, Activity
} from 'lucide-react';

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
}

interface RecentPayment {
  id: string;
  customer_name: string;
  amount_paid: number;
  status: string;
  created_at: string;
}

// ✅ மாற்றம்: due_status-ஐ interface-ல் சேர்க்கவும்
interface SummaryOrderData {
  order_id: number;
  customer_name: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  date: string;
  delivery_date?: string;
  due_status: 'Paid' | 'Overdue' | 'Due Soon'; // due_status-ஐப் பெறவும்
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
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      // ✅ மாற்றம்: due_status பத்தியையும் select செய்யவும்
      const { data: summaryOrders, error: summaryOrdersError } = await supabase
        .from('order_summary_with_dues')
        .select(`
          order_id,
          customer_name,
          total_amount,
          amount_paid,
          balance_due,
          date,
          delivery_date,
          due_status 
        `)
        .gte('date', daysAgo.toISOString())
        .order('date', { ascending: false });

      if (summaryOrdersError) throw summaryOrdersError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          payment_method,
          created_at,
          customers (name)
        `)
        .gte('created_at', daysAgo.toISOString());

      if (paymentsError) throw paymentsError;

      const totalOrders = summaryOrders?.length || 0;
      const totalRevenue = summaryOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalReceived = summaryOrders?.reduce((sum, o) => sum + (o.amount_paid || 0), 0) || 0;
      const pendingAmount = summaryOrders?.reduce((sum, o) => sum + (o.balance_due || 0), 0) || 0;

      // ✅ சரி செய்யப்பட்டது: Overdue Amount-ஐ நேரடியாக due_status-லிருந்து கணக்கிடவும்
      const overdueAmount = summaryOrders?.reduce((sum, o) => {
        return sum + (o.due_status === 'Overdue' ? (o.balance_due || 0) : 0);
      }, 0) || 0;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // ✅ சரி செய்யப்பட்டது: Order Status-ஐ நேரடியாக due_status-லிருந்து கணக்கிடவும்
      const ordersByStatus = summaryOrders?.reduce((acc, o) => {
        if ((o.balance_due || 0) <= 0) {
          acc.paid += 1;
        } else if (o.due_status === 'Overdue') {
          acc.overdue += 1;
        } else if (o.due_status === 'Due Soon') {
          if ((o.amount_paid || 0) > 0) {
            acc.partial += 1;
          } else {
            acc.due += 1;
          }
        }
        return acc;
      }, { paid: 0, partial: 0, due: 0, overdue: 0 }) || { paid: 0, partial: 0, due: 0, overdue: 0 };
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentPaymentsCount = payments?.filter(p => new Date(p.created_at) > weekAgo).length || 0;

      const paymentMethods = payments?.reduce((acc, p) => {
        const method = p.payment_method || 'Unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setMetrics({
        totalOrders,
        totalRevenue,
        totalReceived,
        pendingAmount,
        overdueAmount,
        averageOrderValue,
        ordersByStatus,
        recentPayments: recentPaymentsCount,
        paymentMethods
      });

      const recent = payments
        ?.map(p => ({
          id: p.id,
          customer_name: (p.customers as any)?.name || 'Unknown',
          amount_paid: p.amount_paid,
          status: 'Paid',
          created_at: p.created_at
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || [];

      setRecentPayments(recent);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-green-600 dark:text-green-400';
      case 'Partial': return 'text-yellow-600 dark:text-yellow-400';
      case 'Overdue': return 'text-red-600 dark:text-red-400';
      case 'Due': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6 text-center bg-white dark:bg-gray-800">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <p className="text-gray-500 dark:text-gray-400">Failed to load payment metrics</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Payment Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.totalReceived.toLocaleString()}</p>
              <p className="text-xs text-green-600 dark:text-green-400">from {metrics.totalOrders} orders</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.pendingAmount.toLocaleString()}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">{metrics.ordersByStatus.due + metrics.ordersByStatus.partial} orders pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.overdueAmount.toLocaleString()}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{metrics.ordersByStatus.overdue} overdue orders</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.averageOrderValue.toLocaleString()}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{metrics.recentPayments} payments this week</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><PieChart className="w-5 h-5" />Order Payment Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /><span className="text-sm text-gray-700 dark:text-gray-300">Fully Paid</span></div><span className="font-bold text-green-600 dark:text-green-400">{metrics.ordersByStatus.paid}</span></div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /><span className="text-sm text-gray-700 dark:text-gray-300">Partially Paid</span></div><span className="font-bold text-yellow-600 dark:text-yellow-400">{metrics.ordersByStatus.partial}</span></div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /><span className="text-sm text-gray-700 dark:text-gray-300">Payment Due</span></div><span className="font-bold text-blue-600 dark:text-blue-400">{metrics.ordersByStatus.due}</span></div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /><span className="text-sm text-gray-700 dark:text-gray-300">Overdue</span></div><span className="font-bold text-red-600 dark:text-red-400">{metrics.ordersByStatus.overdue}</span></div>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Activity className="w-5 h-5" />Recent Payment Transactions</h3>
          <div className="space-y-3">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{payment.customer_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">₹{payment.amount_paid.toLocaleString()}</p>
                    <p className={`text-xs font-medium ${getStatusColor(payment.status)}`}>{payment.status}</p>
                  </div>
                </div>
              ))
            ) : <div className="text-center py-8 text-gray-500 dark:text-gray-400"><DollarSign className="w-8 h-8 mx-auto" /><p>No recent payment transactions</p></div>}
          </div>
        </Card>
      </div>

      {Object.keys(metrics.paymentMethods).length > 0 && (
        <Card className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><CreditCard className="w-5 h-5" />Payment Methods Used</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.paymentMethods).map(([method, count]) => (
              <div key={method} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="font-bold text-lg text-gray-900 dark:text-white">{count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{method}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentDashboard;
