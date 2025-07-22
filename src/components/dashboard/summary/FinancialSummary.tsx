// src/components/dashboard/summary/FinancialSummary.tsx
import React from 'react';
import AnimatedCounter from '../../ui/AnimatedCounter';

// Correctly import individual icons from lucide-react
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Coins from 'lucide-react/dist/esm/icons/coins';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Hourglass from 'lucide-react/dist/esm/icons/hourglass';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Info from 'lucide-react/dist/esm/icons/info';


// Define the type for the props this component will receive
interface FinancialData {
  orders: number;
  revenue: number;
  received: number;
  expenses: number;
  balanceDue: number;
}

interface FinancialSummaryProps {
  data: FinancialData | null;
  previousData?: FinancialData | null;
  loading: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data, previousData, loading }) => {
  // A helper function to calculate the percentage trend between two numbers
  const calculateTrend = (current: number, previous: number) => {
    const currentValue = current ?? 0;
    const previousValue = previous ?? 0;
    
    if (previousValue === 0) {
      return currentValue > 0 ? { value: 100, isPositive: true } : { value: 0, isNeutral: true };
    }

    if (currentValue === previousValue) {
        return { value: 0, isNeutral: true };
    }

    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(percentageChange),
      isPositive: percentageChange > 0,
      isNeutral: false,
    };
  };

  // Show a skeleton UI while data is loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  // If there's no data for the current month, show an informative message
  if (!data) {
    return (
        <div className="col-span-1 lg:col-span-5 bg-white dark:bg-gray-800 p-8 rounded-xl text-center shadow-sm">
            <Info size={40} className="mx-auto text-gray-400 mb-4" />
            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-200">No Financial Data</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">There were no orders or expenses recorded for this month.</p>
        </div>
    );
  }

  // Create an array of metrics to display
  const metrics = [
    { title: "Revenue", value: data.revenue ?? 0, previousValue: previousData?.revenue, icon: <Coins className="text-yellow-500" />, isCurrency: true },
    { title: "Received", value: data.received ?? 0, previousValue: previousData?.received, icon: <Wallet className="text-green-500" />, isCurrency: true },
    { title: "Expenses", value: data.expenses ?? 0, previousValue: previousData?.expenses, icon: <TrendingDown className="text-red-500" />, isCurrency: true, trendInverted: true },
    { title: "Orders", value: data.orders ?? 0, previousValue: previousData?.orders, icon: <ClipboardList className="text-blue-500" /> },
    { title: "Balance Due", value: data.balanceDue ?? 0, previousValue: previousData?.balanceDue, icon: <Hourglass className="text-orange-500" />, isCurrency: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      {metrics.map(metric => {
        const trend = calculateTrend(metric.value, metric.previousValue ?? 0);
        // For expenses, an increase is a negative trend
        const isPositiveTrend = metric.trendInverted ? !trend.isPositive : trend.isPositive;

        const TrendIcon = trend.isNeutral ? Minus : (isPositiveTrend ? ArrowUp : ArrowDown);
        const trendColor = trend.isNeutral ? 'bg-gray-100 text-gray-600' : (isPositiveTrend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');
        const trendDarkColor = trend.isNeutral ? 'dark:bg-gray-600 dark:text-gray-200' : (isPositiveTrend ? 'dark:bg-green-800/30 dark:text-green-300' : 'dark:bg-red-800/30 dark:text-red-300');

        return (
          <div key={metric.title} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                {React.cloneElement(metric.icon, { size: 22 })}
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {metric.isCurrency && '₹'}
                <AnimatedCounter to={metric.value} isCurrency={metric.isCurrency} />
              </h3>
              <div className={`mt-2 flex items-center text-xs font-semibold ${trendColor} ${trendDarkColor} px-2 py-1 rounded-full w-fit`}>
                <TrendIcon size={14} className="mr-1" />
                <span>{trend.value.toFixed(0)}% vs last month</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FinancialSummary;
