// src/components/dashboard/DashboardMetrics.tsx
import React from 'react';
import { metricsDrilldownMap } from './metricsDrilldownMap';
import MetricCard from '../ui/MetricCard';
import AnimatedCounter from '../ui/AnimatedCounter';

// Correctly import individual icons from lucide-react
import Coins from 'lucide-react/dist/esm/icons/coins';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Landmark from 'lucide-react/dist/esm/icons/landmark';
import Hourglass from 'lucide-react/dist/esm/icons/hourglass';
import Percent from 'lucide-react/dist/esm/icons/percent';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Users from 'lucide-react/dist/esm/icons/users';
import Package from 'lucide-react/dist/esm/icons/package';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';


interface Metric {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

interface ConsolidatedMetricsData {
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

interface DashboardMetricsProps {
    metricsData: ConsolidatedMetricsData | null;
    loading: boolean;
    error?: string | null;
    onDrilldown?: (type: string, filters?: Record<string, any>) => void;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metricsData, loading, error, onDrilldown }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 animate-pulse">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-24 sm:h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3 col-span-full">
        <AlertTriangle />
        <span className="font-sans font-medium">{error}</span>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="p-4 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg flex items-center gap-3 col-span-full">
        <AlertTriangle />
        <span className="font-sans font-medium">No metrics data available for this period.</span>
      </div>
    );
  }

  const result = metricsData;
  const netProfit = (result.total_paid || 0) - (result.total_expenses || 0);
  const profitMargin = result.total_revenue > 0 ? (netProfit / result.total_revenue) * 100 : 0;

  const formattedMetrics: Metric[] = [
    { title: "Total Revenue", value: <AnimatedCounter to={result.total_revenue || 0} prefix="₹" isCurrency={true} duration={2} />, icon: <Coins size={24} className="text-yellow-500" /> },
    { title: "Amount Received", value: <AnimatedCounter to={result.total_paid || 0} prefix="₹" isCurrency={true} duration={2.2} />, icon: <Wallet size={24} className="text-green-500" /> },
    { title: "Outstanding Balance", value: <AnimatedCounter to={result.balance_due || 0} prefix="₹" isCurrency={true} duration={2.4} />, icon: <Hourglass size={24} className="text-orange-500" /> },
    { title: "Total Expenses", value: <AnimatedCounter to={result.total_expenses || 0} prefix="₹" isCurrency={true} duration={2.6} />, icon: <TrendingDown size={24} className="text-red-500" /> },
    { title: "Net Profit", value: <AnimatedCounter to={netProfit} prefix="₹" isCurrency={true} duration={2.8} />, icon: <Landmark size={24} className="text-indigo-500" /> },
    { title: "Profit Margin", value: <AnimatedCounter to={profitMargin} postfix="%" decimals={1} duration={3} />, icon: <Percent size={24} className="text-sky-500" /> },
    { title: "Total Orders", value: <AnimatedCounter to={result.total_orders_count || 0} duration={3.2} />, icon: <ClipboardList size={24} className="text-purple-500" /> },
    { title: "Total Customers", value: <AnimatedCounter to={result.total_customers_count || 0} duration={3.4} />, icon: <Users size={24} className="text-blue-500" /> },
    { title: "Stock Alerts", value: <AnimatedCounter to={result.stock_alerts_count || 0} duration={3.6} />, icon: <AlertTriangle size={24} className="text-amber-500" /> }
  ];
    
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
      {formattedMetrics.map((metric) => {
        const reportType = metricsDrilldownMap[metric.title as string];
        return (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            onClick={reportType && onDrilldown ? () => {
              console.log('[DashboardMetrics] Metric clicked:', metric.title, reportType);
              onDrilldown(reportType, {/* Optionally pass filters here */});
            } : undefined}
          />
        );
      })}
    </div>
  );
};

// Memoize the component to prevent re-renders if props haven't changed.
export default React.memo(DashboardMetrics);
