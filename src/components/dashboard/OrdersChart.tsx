import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@/lib/ThemeProvider';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Frown from 'lucide-react/dist/esm/icons/frown';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
        <Frown className="w-10 h-10 mb-2" />
        <p className="text-sm">No order data available for this period.</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.day),
    datasets: [{
      label: 'Orders',
      data: data.map(d => d.order_count),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : '#fff',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: isDarkMode ? '#9ca3af' : '#6b7280' },
        grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        ticks: { color: isDarkMode ? '#9ca3af' : '#6b7280' },
        grid: { display: false },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default OrdersChart;
