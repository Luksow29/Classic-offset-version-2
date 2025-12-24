// src/components/dashboard/RevenueChart.tsx
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Download, TrendingUp, Filter } from 'lucide-react';
import Button from '../ui/Button';

interface RevenueChartProps {
  data: { date: string; value: number }[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [showDataExport, setShowDataExport] = useState(false);

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      ...item,
      date: format(parseISO(item.date), 'MMM d'),
      value: Number(item.value),
      fullDate: item.date
    }));
  }, [data]);

  const chartStats = useMemo(() => {
    if (!formattedData.length) return { total: 0, average: 0, peak: 0 };

    const total = formattedData.reduce((sum, item) => sum + item.value, 0);
    const average = total / formattedData.length;
    const peak = Math.max(...formattedData.map(item => item.value));

    return { total, average, peak };
  }, [formattedData]);

  const handleDataPointClick = (data: any) => {
    setSelectedDataPoint(data);
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Revenue'],
      ...formattedData.map(item => [item.fullDate, item.value])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
        <TrendingUp className="w-12 h-12 text-gray-300" />
        <p className="font-sans font-medium">No revenue data available for this period.</p>
      </div>
    );
  }

  const formatYAxis = (tick: any) => {
    if (tick >= 1000000) {
      return `₹${(tick / 1000000).toFixed(1)}M`;
    }
    if (tick >= 1000) {
      return `₹${(tick / 1000).toFixed(0)}K`;
    }
    return `₹${tick}`;
  };

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
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <p className="font-sans font-medium text-gray-700 dark:text-gray-300">
              Revenue: <span className="font-semibold text-blue-600 dark:text-blue-400">₹{data.value.toLocaleString()}</span>
            </p>
          </div>
          {selectedDataPoint && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Click to see details</p>
            </div>
          )}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Chart Stats - Ultra Compact on Mobile */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[10px] sm:text-sm">
          <span>
            <span className="text-gray-500 dark:text-gray-400 font-sans">Total: </span>
            <span className="font-display font-semibold text-gray-900 dark:text-white">₹{chartStats.total.toLocaleString()}</span>
          </span>
          <span>
            <span className="text-gray-500 dark:text-gray-400 font-sans">Avg: </span>
            <span className="font-display font-semibold text-gray-900 dark:text-white">₹{chartStats.average.toLocaleString()}</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportData}
          className="flex items-center gap-1 text-[10px] sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Chart Container with mobile-optimized height */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-48 sm:h-64 md:h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
            onClick={handleDataPointClick}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              strokeOpacity={0.1}
              className="opacity-30"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name="Revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: 'hsl(var(--primary))',
                strokeWidth: 2,
                stroke: '#fff'
              }}
              activeDot={{
                r: 8,
                stroke: 'hsl(var(--primary))',
                strokeWidth: 3,
                fill: '#fff'
              }}
              fill="url(#revenueGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Selected Data Point Details */}
      {selectedDataPoint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <h4 className="font-display font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Selected: {selectedDataPoint.activeLabel}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Revenue: ₹{selectedDataPoint.activePayload?.[0]?.value?.toLocaleString()}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RevenueChart;
