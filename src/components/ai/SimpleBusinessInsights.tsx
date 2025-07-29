// src/components/ai/SimpleBusinessInsights.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface SimpleInsight {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  color: string;
}

const SimpleBusinessInsights: React.FC = () => {
  const [insights, setInsights] = useState<SimpleInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const generateSimpleInsights = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting simple insights generation...');
      
      // Get basic counts
      const [ordersResult, customersResult, paymentsResult] = await Promise.all([
        supabase.from('orders').select('id, total_amount, date', { count: 'exact' }),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount_paid', { count: 'exact' })
      ]);

      console.log('📊 Data fetched:', {
        orders: ordersResult.data?.length || 0,
        customers: customersResult.data?.length || 0,
        payments: paymentsResult.data?.length || 0
      });

      const newInsights: SimpleInsight[] = [];

      // Always add welcome insight
      newInsights.push({
        id: 1,
        icon: <Brain className="w-5 h-5" />,
        title: '🚀 AI Insights System Active',
        description: `Your business intelligence system is now operational! Last updated: ${new Date().toLocaleTimeString()}`,
        impact: 'medium',
        color: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
      });

      // Order insights
      const orderCount = ordersResult.data?.length || 0;
      if (orderCount > 0) {
        const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        newInsights.push({
          id: 2,
          icon: <TrendingUp className="w-5 h-5" />,
          title: '📈 Business Performance',
          description: `You have ${orderCount} orders generating ₹${totalRevenue.toLocaleString()} in total revenue. ${orderCount > 10 ? 'Great business activity!' : 'Growing steadily!'}`,
          impact: orderCount > 20 ? 'high' : 'medium',
          color: 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
        });
      } else {
        newInsights.push({
          id: 2,
          icon: <Target className="w-5 h-5" />,
          title: '🎯 Getting Started',
          description: 'Start adding orders to see detailed business analytics and revenue insights.',
          impact: 'low',
          color: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
        });
      }

      // Customer insights
      const customerCount = customersResult.data?.length || 0;
      if (customerCount > 0) {
        newInsights.push({
          id: 3,
          icon: <Lightbulb className="w-5 h-5" />,
          title: '👥 Customer Base',
          description: `You have ${customerCount} customers in your database. ${customerCount > 50 ? 'Excellent customer base!' : customerCount > 10 ? 'Growing customer network!' : 'Building your customer community!'}`,
          impact: customerCount > 50 ? 'high' : 'medium',
          color: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20'
        });
      }

      // Payment insights
      const paymentCount = paymentsResult.data?.length || 0;
      if (paymentCount > 0) {
        const totalPaid = paymentsResult.data?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
        newInsights.push({
          id: 4,
          icon: <TrendingUp className="w-5 h-5" />,
          title: '💰 Payment Analysis',
          description: `₹${totalPaid.toLocaleString()} collected across ${paymentCount} payments. ${paymentCount > orderCount * 0.8 ? 'Excellent payment collection!' : 'Focus on payment follow-ups.'}`,
          impact: 'high',
          color: 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
        });
      }

      // Seasonal insight
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 9 && currentMonth <= 11) {
        newInsights.push({
          id: 5,
          icon: <AlertTriangle className="w-5 h-5" />,
          title: '🎊 Festival Season Alert',
          description: 'Peak wedding and festival season! Consider increasing inventory and marketing efforts.',
          impact: 'high',
          color: 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
        });
      }

      console.log('✅ Generated insights:', newInsights);
      setInsights(newInsights);
      setLastUpdated(new Date().toLocaleString());
      toast.success(`Generated ${newInsights.length} business insights!`);

    } catch (error) {
      console.error('❌ Error generating insights:', error);
      toast.error('Failed to generate insights');
      
      // Fallback insight
      setInsights([{
        id: 1,
        icon: <AlertTriangle className="w-5 h-5" />,
        title: '⚠️ Connection Issue',
        description: 'Unable to fetch live data. Please check your database connection and try again.',
        impact: 'medium',
        color: 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSimpleInsights();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold">AI Business Insights</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
            )}
          </div>
        </div>
        <Button 
          onClick={generateSimpleInsights} 
          variant="outline" 
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`border-l-4 p-4 rounded-r-lg ${insight.color}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-gray-700 dark:text-gray-300">
                {insight.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {insight.description}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  insight.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {insight.impact.toUpperCase()} IMPACT
                </span>
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Insights Generated</h3>
            <p className="mb-4">Click "Refresh Insights" to analyze your business data.</p>
            <Button onClick={generateSimpleInsights} variant="outline">
              Generate Insights
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SimpleBusinessInsights;
