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
      if (error) throw error;
      
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

  useEffect(() => {
    // Initial load
    refreshMetrics();

    // Set up real-time subscriptions for key tables that affect metrics
    const paymentsChannel = supabase
      .channel('dashboard_payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          console.log('💰 Payment change detected, refreshing metrics...');
          refreshMetrics();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('dashboard_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('📦 Order change detected, refreshing metrics...');
          refreshMetrics();
        }
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('dashboard_expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          console.log('💸 Expense change detected, refreshing metrics...');
          refreshMetrics();
        }
      )
      .subscribe();

    setIsConnected(true);

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, []);

  return {
    metrics,
    isConnected,
    refreshMetrics
  };
};
