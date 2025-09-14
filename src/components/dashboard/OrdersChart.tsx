import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/lib/ThemeProvider';
import { motion } from 'framer-motion';
import { Download, Package, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';

interface ChartData {
  day: string;
  order_count: number;
}

interface OrdersChartProps {
  data: ChartData[];
}

const OrdersChart: React.FC<OrdersChartProps> = ({ data = [] }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartStats = useMemo(() => {
    if (!data.length) return { total: 0, average: 0, peak: 0 };
    
    const total = data.reduce((sum, item) => sum + item.order_count, 0);
    const average = total / data.length;
    const peak = Math.max(...data.map(item => item.order_count));
    
    return { total, average, peak };
  }, [data]);

  const exportData = () => {
    const csvContent = [
      ['Day', 'Orders'],
      ...data.map(item => [item.day, item.order_count])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getBarColor = (index: number) => {
    if (selectedBar === index) return 'hsl(var(--primary))';
    if (hoveredIndex === index) return 'hsl(var(--primary) / 0.8)';
    return 'hsl(var(--primary) / 0.6)';
  };

  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
        <Package className="w-12 h-12 text-gray-300" />
        <p className="text-sm font-sans font-medium tracking-wide">No order data available for this period.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl p-4 shadow-xl"
        >
          <p className="font-display font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
            <p className="font-sans font-medium text-gray-700 dark:text-gray-300">
              Orders: <span className="font-semibold text-blue-600 dark:text-blue-400">{data.value}</span>
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Chart Stats - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-sans">Total: </span>
            <span className="font-display font-semibold text-gray-900 dark:text-white">{chartStats.total}</span>
          </div>
          <div className="text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-sans">Avg: </span>
            <span className="font-display font-semibold text-gray-900 dark:text-white">{chartStats.average.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Chart Container with mobile-optimized height */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="h-48 sm:h-64 md:h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              strokeOpacity={0.1}
              className="opacity-30"
            />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12, fontFamily: 'Inter' }} 
              axisLine={false} 
              tickLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              tick={{ fontSize: 12, fontFamily: 'Inter' }} 
              axisLine={false} 
              tickLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="order_count"
              fill="url(#orderGradient)"
              radius={[4, 4, 0, 0]}
              onMouseEnter={(data, index) => setHoveredIndex(index)}
              onClick={(data, index) => setSelectedBar(index)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(index)}
                  className="transition-all duration-200 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
      
      {/* Selected Bar Details */}
      {selectedBar !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <h4 className="font-display font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Selected: {data[selectedBar].day}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Orders: {data[selectedBar].order_count}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default OrdersChart;
