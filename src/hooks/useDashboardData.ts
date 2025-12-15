import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Type definitions for dashboard data
interface DailyOrderCount {
  day: string;
  order_count: number;
}

interface PendingOrder {
  id: number;
  order_id: string;
  customer_name: string;
  total_amount: number;
  balance_amount: number;
  delivery_date: string;
  date: string;
  status: string;
}

interface FinancialSummaryData {
  orders: number;
  revenue: number;
  received: number;
  expenses: number;
  balanceDue: number;
}

interface ConsolidatedMetrics {
  total_revenue: number;
  total_paid: number;
  total_expenses: number;
  balance_due: number;
  total_orders_count: number;
  total_customers_count: number;
  orders_fully_paid_count: number;
  orders_partial_count: number;
  orders_due_count: number;
  orders_overdue_count: number;
  stock_alerts_count: number;
}

interface OrderRevenueData {
  amount_received: number | null;
  date: string;
}

interface FinancialSummaryRaw {
  orders?: number;
  revenue?: number;
  received?: number;
  expenses?: number;
  balancedue?: number;
}

export interface DashboardData {
  dailyOrdersChartData: DailyOrderCount[];
  pendingOrders: PendingOrder[];
  financialSummaryData: FinancialSummaryData | null;
  previousFinancialSummaryData: FinancialSummaryData | null;
  revenueChartData: { date: string; value: number }[];
  consolidatedMetrics: ConsolidatedMetrics | null;
}

export function useDashboardData(userId: string | undefined, month: string) {
  return useQuery({
    queryKey: ['dashboardData', userId, month],
    queryFn: async (): Promise<DashboardData> => {
      if (!userId) throw new Error('User ID is required');

      const previousMonthDate = new Date(month);
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const previousMonth = previousMonthDate.toISOString().slice(0, 7);

      const [
        pendingOrdersResponse,
        dailyOrdersResponse,
        currentMonthSummaryResponse,
        previousMonthSummaryResponse,
        revenueResponse,
        consolidatedMetricsResponse,
      ] = await Promise.all([
        supabase.rpc('get_recent_pending_orders'),
        supabase.rpc('get_daily_order_counts', { days_to_check: 7 }),
        supabase.rpc('get_financial_summary', { p_user_id: userId, p_month: month }),
        supabase.rpc('get_financial_summary', { p_user_id: userId, p_month: previousMonth }),
        supabase.from('orders')
          .select('amount_received, date')
          .gte('date', `${month}-01`)
          .eq('is_deleted', false),
        supabase.rpc('get_dashboard_metrics_table'),
      ]);

      // Check for errors
      if (pendingOrdersResponse.error) throw pendingOrdersResponse.error;
      if (dailyOrdersResponse.error) throw dailyOrdersResponse.error;
      if (currentMonthSummaryResponse.error) throw currentMonthSummaryResponse.error;
      if (previousMonthSummaryResponse.error) throw previousMonthSummaryResponse.error;
      if (revenueResponse.error) throw revenueResponse.error;
      if (consolidatedMetricsResponse.error) throw consolidatedMetricsResponse.error;

      // Process Revenue Data
      const revenueByDate = (revenueResponse.data as OrderRevenueData[] || []).reduce((acc: Record<string, number>, order: OrderRevenueData) => {
        const date = new Date(order.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (order.amount_received || 0);
        return acc;
      }, {});

      const revenueChartData = Object.entries(revenueByDate)
        .map(([date, value]) => ({ date, value: value as number }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Map SQL function response (lowercase) to component expected format (camelCase)
      const mapFinancialData = (data: FinancialSummaryRaw | null | undefined): FinancialSummaryData | null => {
        if (!data) return null;
        return {
          orders: data.orders ?? 0,
          revenue: data.revenue ?? 0,
          received: data.received ?? 0,
          expenses: data.expenses ?? 0,
          balanceDue: data.balancedue ?? 0, // SQL returns 'balancedue', component expects 'balanceDue'
        };
      };

      return {
        dailyOrdersChartData: (dailyOrdersResponse.data as DailyOrderCount[]) || [],
        pendingOrders: (pendingOrdersResponse.data as PendingOrder[]) || [],
        financialSummaryData: mapFinancialData(currentMonthSummaryResponse.data?.[0] as FinancialSummaryRaw | undefined),
        previousFinancialSummaryData: mapFinancialData(previousMonthSummaryResponse.data?.[0] as FinancialSummaryRaw | undefined),
        revenueChartData,
        consolidatedMetrics: (consolidatedMetricsResponse.data?.[0] as ConsolidatedMetrics) || null,
      };
    },
    enabled: !!userId, // Only run if userId is available
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, 
  });
}
