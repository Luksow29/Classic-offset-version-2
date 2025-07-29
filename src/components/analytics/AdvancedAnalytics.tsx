// src/components/analytics/AdvancedAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart3, PieChart, LineChart, TrendingUp, Users, Calendar, Download } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

interface AnalyticsData {
  revenueByMonth: any[];
  customerSegments: any[];
  productPerformance: any[];
  paymentTrends: any[];
  regionalData: any[];
}

const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m'); // 3m, 6m, 12m
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '12m':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Revenue by month
      const { data: monthlyRevenue } = await supabase
        .from('orders')
        .select('date, total_amount')
        .gte('date', startDate.toISOString())
        .order('date');

      // Customer segments by spending
      const { data: customerData } = await supabase
        .from('customers')
        .select(`
          id, name,
          orders(total_amount, date)
        `);

      // Product performance
      const { data: productData } = await supabase
        .from('orders')
        .select('order_type, total_amount, quantity')
        .gte('date', startDate.toISOString());

      // Payment trends
      const { data: paymentData } = await supabase
        .from('payments')
        .select('payment_date, amount_paid, payment_method')
        .gte('payment_date', startDate.toISOString());

      // Process revenue by month
      const revenueByMonth = monthlyRevenue?.reduce((acc: any[], order) => {
        const month = new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.revenue += order.total_amount;
        } else {
          acc.push({ month, revenue: order.total_amount });
        }
        return acc;
      }, []) || [];

      // Process customer segments
      const customerSegments = customerData?.map((customer: any) => {
        const totalSpent = customer.orders?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0;
        let segment = 'Bronze';
        if (totalSpent > 100000) segment = 'Platinum';
        else if (totalSpent > 50000) segment = 'Gold';
        else if (totalSpent > 20000) segment = 'Silver';
        
        return { ...customer, totalSpent, segment };
      }).reduce((acc: any[], customer) => {
        const existing = acc.find(item => item.segment === customer.segment);
        if (existing) {
          existing.count += 1;
          existing.totalRevenue += customer.totalSpent;
        } else {
          acc.push({ 
            segment: customer.segment, 
            count: 1, 
            totalRevenue: customer.totalSpent 
          });
        }
        return acc;
      }, []) || [];

      // Process product performance
      const productPerformance = productData?.reduce((acc: any[], order) => {
        const existing = acc.find(item => item.type === order.order_type);
        if (existing) {
          existing.orders += 1;
          existing.revenue += order.total_amount;
          existing.quantity += order.quantity;
        } else {
          acc.push({
            type: order.order_type,
            orders: 1,
            revenue: order.total_amount,
            quantity: order.quantity
          });
        }
        return acc;
      }, []) || [];

      // Process payment trends
      const paymentTrends = paymentData?.reduce((acc: any[], payment) => {
        const month = new Date(payment.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.amount += payment.amount_paid;
          existing.transactions += 1;
        } else {
          acc.push({
            month,
            amount: payment.amount_paid,
            transactions: 1
          });
        }
        return acc;
      }, []) || [];

      setData({
        revenueByMonth,
        customerSegments,
        productPerformance,
        paymentTrends,
        regionalData: [] // Add regional analysis if location data available
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const revenueChartData = {
    labels: data?.revenueByMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenueByMonth.map(item => item.revenue) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const customerSegmentData = {
    labels: data?.customerSegments.map(seg => seg.segment) || [],
    datasets: [
      {
        data: data?.customerSegments.map(seg => seg.count) || [],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const productPerformanceData = {
    labels: data?.productPerformance.map(product => product.type) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.productPerformance.map(product => product.revenue) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
    ],
  };

  const exportToCSV = () => {
    if (!data) return;

    const csvData = [
      ['Month', 'Revenue', 'Payments'],
      ...data.revenueByMonth.map(item => [
        item.month,
        item.revenue,
        data.paymentTrends.find(p => p.month === item.month)?.amount || 0
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Advanced Analytics
          </h1>
          <div className="flex items-center gap-3">
            <Select
              id="time-range"
              label=""
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={[
                { value: '3m', label: 'Last 3 Months' },
                { value: '6m', label: 'Last 6 Months' },
                { value: '12m', label: 'Last 12 Months' }
              ]}
            />
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">
                ₹{data?.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">
                {data?.customerSegments.reduce((sum, seg) => sum + seg.count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold">
                ₹{data?.revenueByMonth.length > 0 ? 
                  Math.round(data.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0) / 
                  data.productPerformance.reduce((sum, product) => sum + product.orders, 0)).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="text-2xl font-bold text-green-600">+12.5%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-500" />
            Revenue Trend
          </h3>
          <div style={{ height: '300px' }}>
            <Line 
              data={revenueChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }} 
            />
          </div>
        </Card>

        {/* Customer Segments */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            Customer Segments
          </h3>
          <div style={{ height: '300px' }}>
            <Pie 
              data={customerSegmentData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false
              }} 
            />
          </div>
        </Card>

        {/* Product Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Product Performance
          </h3>
          <div style={{ height: '300px' }}>
            <Bar 
              data={productPerformanceData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }} 
            />
          </div>
        </Card>

        {/* Payment Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Analysis</h3>
          <div className="space-y-4">
            {data?.paymentTrends.slice(0, 6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{trend.month}</p>
                  <p className="text-sm text-gray-500">{trend.transactions} transactions</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  ₹{trend.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
