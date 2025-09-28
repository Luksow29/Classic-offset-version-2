// src/hooks/useRealtimeDashboard.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface DashboardMetrics {
  total_revenue: number;
  total_paid: number;
  total_expenses: number;
  balance_due: number;
  total_orders_count: number;
  orders_due_count: number;
  orders_overdue_count: number;
  last_updated: string;
}

export const useRealtimeDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const refreshMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_metrics');
      if (error) {
        console.warn('Dashboard metrics function not available:', error.message);
        // Use fallback metrics calculation
        const fallbackMetrics = await calculateFallbackMetrics();
        setMetrics({
          ...fallbackMetrics,
          last_updated: new Date().toISOString()
        });
        return;
      }
      
      if (data && data.length > 0) {
        setMetrics({
          ...data[0],
          last_updated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to refresh dashboard metrics:', error);
    }
  };

  const calculateFallbackMetrics = async () => {
    try {
      const [ordersRes, paymentsRes, expensesRes, customersRes] = await Promise.all([
        supabase.from('orders').select('total_amount, amount_received, balance_amount'),
        supabase.from('payments').select('amount_paid'),
        supabase.from('expenses').select('amount'),
        supabase.from('customers').select('id', { count: 'exact' })
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalPaid = paymentsRes.data?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
      const totalExpenses = expensesRes.data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const balanceDue = ordersRes.data?.reduce((sum, order) => sum + (order.balance_amount || 0), 0) || 0;
      const totalCustomers = customersRes.count || 0;
      const totalOrders = ordersRes.data?.length || 0;
      const ordersDue = ordersRes.data?.filter(order => (order.balance_amount || 0) > 0).length || 0;

      return {
        total_revenue: totalRevenue,
        total_paid: totalPaid,
        total_expenses: totalExpenses,
        balance_due: balanceDue,
        total_orders_count: totalOrders,
        total_customers_count: totalCustomers,
        orders_due_count: ordersDue,
        orders_overdue_count: 0, // Would need more complex calculation
        orders_fully_paid_count: totalOrders - ordersDue,
        orders_partial_count: 0, // Would need more complex calculation
        stock_alerts_count: 0 // Would need to query stock alerts
      };
    } catch (error) {
      console.error('Fallback metrics calculation failed:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial load
    refreshMetrics();

    // Debounce the refresh function to avoid race conditions and excessive calls
    let timeoutId: any;
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Debounced metrics refresh triggered.');
        refreshMetrics();
      }, 1000); // 1-second delay to allow DB transaction to complete
    };

    // Set up a single real-time channel for all dashboard-related tables
    const dashboardChannel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('💰 Payment change detected, queueing refresh...', payload);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📦 Order change detected, queueing refresh...', payload);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          console.log('💸 Expense change detected, queueing refresh...', payload);
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(dashboardChannel);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    metrics,
    isConnected,
    refreshMetrics
  };
};
