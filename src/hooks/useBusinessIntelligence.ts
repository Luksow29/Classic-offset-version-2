import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';
import { calculateForecast, DataPoint } from '@/lib/forecastingUtils';

export interface BusinessInsight {
  type: 'warning' | 'opportunity' | 'trend' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metric?: string;
  data?: any; // For drill-downs
}

export interface OperationalMetrics {
  avgTurnaroundHours: number;
  bottleneckCount: number;
  throughputWeekly: number;
  activeOrders: number;
}

export interface BusinessIntelligenceData {
  revenueForecast: {
    historical: DataPoint[];
    forecast: DataPoint[];
    trend: 'up' | 'down' | 'stable';
    growthRate: number;
    totalHistoricalRevenue: number;
  };
  insights: BusinessInsight[];
  operations: OperationalMetrics;
}

export function useBusinessIntelligence(userId: string | undefined) {
  return useQuery({
    queryKey: ['businessIntelligence', userId],
    queryFn: async (): Promise<BusinessIntelligenceData> => {
      if (!userId) throw new Error('User ID is required');

      // 1. Fetch Orders with timestamps and status for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentOrders, error } = await supabase
        .from('orders')
        .select('id, created_at, updated_at, status, total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_deleted', false);

      if (error) throw error;

      // 2. Fetch Dashboard Metrics (Reuse existing RPC)
      const { data: metrics, error: metricsError } = await supabase.rpc('get_dashboard_metrics');
      if (metricsError) console.error('Error fetching dashboard metrics:', metricsError);

      // --- Operational Metrics Calculation ---
      let totalTurnaroundTime = 0;
      let completedOrdersCount = 0;
      let throughputWeekly = 0;
      let bottleneckCount = 0;
      let activeOrders = 0;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      recentOrders?.forEach(order => {
        const createdAt = new Date(order.created_at);
        const updatedAt = order.updated_at ? new Date(order.updated_at) : new Date();
        const isCompleted = ['Completed', 'Delivered', 'Cancelled'].includes(order.status);
        
        // Active Orders
        if (!isCompleted) activeOrders++;

        // Turnaround Time (for completed orders)
        if (isCompleted && order.updated_at) {
           const durationHours = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
           if (durationHours > 0 && durationHours < 1000) { // Filter outliers
               totalTurnaroundTime += durationHours;
               completedOrdersCount++;
           }
        }

        // Weekly Throughput
        if (isCompleted && updatedAt > oneWeekAgo) {
            throughputWeekly++;
        }

        // Bottlenecks (Active orders older than 48 hours)
        const ageHours = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (!isCompleted && ageHours > 48) {
            bottleneckCount++;
        }
      });

      const avgTurnaroundHours = completedOrdersCount > 0 ? Math.round(totalTurnaroundTime / completedOrdersCount) : 0;

      // --- Revenue Data for Chart (Keeping existing logic for compatibility) ---
      // We need 12 months for the chart, but fetched only 30 days above. 
      // Optimized: Let's do a separate lightweight query for just the sums if needed, 
      // BUT for now, to save RPC calls, we will reuse the 30 days for trend if possible, 
      // or if user wants full 12 month chart we keep the separate query.
      // Let's keep the original logic for chart data to ensure 12-month view logic remains intact.
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      
      const { data: chartOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      const monthlyRevenue: Record<string, number> = {};
      for (let i = 0; i < 12; i++) {
        const d = new Date(twelveMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const monthKey = d.toISOString().slice(0, 7); 
        monthlyRevenue[monthKey] = 0;
      }
      chartOrders?.forEach(order => {
        const monthKey = order.created_at.slice(0, 7);
        if (monthlyRevenue[monthKey] !== undefined) {
            monthlyRevenue[monthKey] += order.total_amount || 0;
        }
      });
      const historicalData: DataPoint[] = Object.entries(monthlyRevenue)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const forecastResult = calculateForecast(historicalData, 3);
      const totalHistoricalRevenue = historicalData.reduce((sum, item) => sum + item.value, 0);


      // --- Insight Generation (Updated for Operations) ---
      const insights: BusinessInsight[] = [];

      // 1. Throughput Insight
      if (throughputWeekly > 0) {
          insights.push({
              type: 'trend',
              title: 'Weekly Throughput',
              description: `${throughputWeekly} orders completed this week. ${throughputWeekly > 10 ? 'Team is on fire! 🔥' : 'Keep pushing.'}`,
              impact: 'medium',
              actionable: false,
              metric: 'Speed'
          });
      }

      // 2. Bottleneck Warning
      if (bottleneckCount > 0) {
          insights.push({
              type: 'warning',
              title: 'Bottleneck Alert',
              description: `${bottleneckCount} orders have been active for over 48 hours. Check "In Progress" list.`,
              impact: 'high',
              actionable: true,
              metric: 'Delays',
              data: { filter: 'stuck_orders' } // Drilldown context
          });
      }

      // 3. Efficiency/Turnaround
      if (avgTurnaroundHours > 0) {
           insights.push({
              type: 'opportunity',
              title: 'Turnaround Time',
              description: `Average completion time is ${avgTurnaroundHours} hours. Aim for under 24 hours to delight customers.`,
              impact: avgTurnaroundHours > 24 ? 'medium' : 'low',
              actionable: true,
              metric: 'Efficiency'
          });
      }

      // 4. Financial (Keep one financial insight)
      if (forecastResult.trend === 'down') {
         insights.push({
            type: 'warning',
            title: 'Revenue Dip',
            description: 'Recent revenue trend is down. Operations might be slowing down sales?',
            impact: 'high',
            actionable: true,
            metric: 'Revenue'
         });
      }

      return {
        revenueForecast: { ...forecastResult, totalHistoricalRevenue },
        insights,
        operations: {
            avgTurnaroundHours,
            bottleneckCount,
            throughputWeekly,
            activeOrders
        }
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, 
  });
}

export function useRealtimeBusinessIntelligence(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { data, ...rest } = useBusinessIntelligence(userId);

  React.useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('business-intelligence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          console.log('Realtime update: Orders changed, refreshing insights...');
          queryClient.invalidateQueries({ queryKey: ['businessIntelligence'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { data, ...rest };
}
