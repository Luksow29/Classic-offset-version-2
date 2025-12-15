// src/components/dashboard/summary/FinancialSummary.tsx
import React from 'react';
import AnimatedCounter from '../../ui/AnimatedCounter';
import { ClipboardList, Coins, Wallet, TrendingDown, Hourglass, ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';


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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-32 sm:h-36 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl animate-pulse shadow-sm"></div>
        ))}
      </div>
    );
  }

  // If there's no data for the current month, show an informative message
  if (!data) {
    return (
      <div className="p-8 text-center bg-gray-50/80 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
        <div className="inline-flex p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
          <Info className="text-gray-400 dark:text-gray-500" size={32} />
        </div>
        <h4 className="font-display font-semibold text-lg text-gray-700 dark:text-gray-200 tracking-tight">No Financial Data</h4>
        <p className="text-sm font-sans text-gray-500 dark:text-gray-400 mt-1">There were no orders or expenses recorded for this month.</p>
      </div>
    );
  }

  // Create an array of metrics to display
  const metrics = [
    { title: "Revenue", value: data.revenue ?? 0, previousValue: previousData?.revenue, icon: <Coins className="text-yellow-500" />, isCurrency: true, gradient: "from-yellow-500/10 to-amber-500/5" },
    { title: "Received", value: data.received ?? 0, previousValue: previousData?.received, icon: <Wallet className="text-emerald-500" />, isCurrency: true, gradient: "from-emerald-500/10 to-green-500/5" },
    { title: "Expenses", value: data.expenses ?? 0, previousValue: previousData?.expenses, icon: <TrendingDown className="text-rose-500" />, isCurrency: true, trendInverted: true, gradient: "from-rose-500/10 to-red-500/5" },
    { title: "Orders", value: data.orders ?? 0, previousValue: previousData?.orders, icon: <ClipboardList className="text-blue-500" />, gradient: "from-blue-500/10 to-indigo-500/5" },
    { title: "Balance Due", value: data.balanceDue ?? 0, previousValue: previousData?.balanceDue, icon: <Hourglass className="text-orange-500" />, isCurrency: true, gradient: "from-orange-500/10 to-amber-500/5" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
      {metrics.map((metric, index) => {
        const trend = calculateTrend(metric.value, metric.previousValue ?? 0);
        // For expenses, an increase is a negative trend
        const isPositiveTrend = metric.trendInverted ? !trend.isPositive : trend.isPositive;

        const TrendIcon = trend.isNeutral ? Minus : (isPositiveTrend ? ArrowUp : ArrowDown);
        const trendColor = trend.isNeutral 
          ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' 
          : (isPositiveTrend 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300');

        return (
          <div 
            key={metric.title} 
            className={`group relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 hover:-translate-y-1 overflow-hidden`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs sm:text-sm font-sans font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{metric.title}</p>
                <div className="p-2 sm:p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                  {React.cloneElement(metric.icon, { size: 18 })}
                </div>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  {metric.isCurrency && '₹'}
                  <AnimatedCounter to={metric.value} isCurrency={metric.isCurrency} />
                </h3>
                <div className={`mt-3 flex items-center text-xs font-sans font-semibold ${trendColor} px-2.5 py-1.5 rounded-lg w-fit tracking-wide shadow-sm`}>
                  <TrendIcon size={12} className="mr-1.5" />
                  <span className="hidden sm:inline">{trend.value.toFixed(0)}% vs last month</span>
                  <span className="sm:hidden">{trend.value.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            {/* Bottom accent */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/40 transition-all duration-500" />
          </div>
        );
      })}
    </div>
  );
};

export default FinancialSummary;
