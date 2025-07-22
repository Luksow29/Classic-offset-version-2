// src/components/dashboard/RevenueChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface RevenueChartProps {
  data: { date: string; value: number }[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No revenue data available for this period.</div>;
  }

  const formattedData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM d'),
    value: Number(item.value)
  }));

  const formatYAxis = (tick: any) => {
    if (tick >= 1000) {
      return `${tick / 1000}k`;
    }
    return tick;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          axisLine={false} 
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          axisLine={false} 
          tickLine={false}
          tickFormatter={formatYAxis}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(25, 28, 36, 0.8)', 
            border: '1px solid #4A5568', 
            borderRadius: '0.5rem',
            color: '#CBD5E0' 
          }}
          labelStyle={{ fontWeight: 'bold' }}
          formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Line 
          type="monotone" 
          dataKey="value"
          name="Revenue" 
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4, fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 8 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
