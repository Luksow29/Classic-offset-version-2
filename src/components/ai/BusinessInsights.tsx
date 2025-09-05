// src/components/ai/BusinessInsights.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import toast from 'react-hot-toast';

interface BusinessInsight {
  type: 'warning' | 'opportunity' | 'trend' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

const BusinessInsights: React.FC = () => {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Get business data for analysis
      console.log('Fetching dashboard metrics...');
      const { data: metrics, error: metricsError } = await supabase.rpc('get_dashboard_metrics');
      
      if (metricsError) {
        const handledError = handleSupabaseError(metricsError, { 
          operation: 'rpc_call', 
          table: 'get_dashboard_metrics' 
        }, false);
        
        if (handledError) {
          console.warn('Dashboard metrics function not available, using basic insights');
        }
      }
      
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });
      
      if (ordersError) {
        handleSupabaseError(ordersError, { 
          operation: 'select_orders', 
          table: 'orders' 
        }, false);
      }

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });
      
      if (customersError) {
        handleSupabaseError(customersError, { 
          operation: 'select_customers', 
          table: 'customers' 
        }, false);
      }

      const generatedInsights: BusinessInsight[] = [];

      // Always add at least one insight for testing
      generatedInsights.push({
        type: 'opportunity',
        title: 'Business Analytics Active',
        description: 'Your AI Business Insights system is now operational and analyzing your business data.',
        impact: 'medium',
        actionable: true,
        data: { timestamp: new Date().toISOString() }
      });

      // Revenue trend analysis
      if (metrics && metrics.length > 0 && metrics[0]) {
        const currentMetrics = metrics[0];
        console.log('Processing metrics:', currentMetrics);
        
        // Cash flow warning
        if (currentMetrics.balance_due && currentMetrics.total_paid && 
            currentMetrics.balance_due > currentMetrics.total_paid * 0.3) {
          generatedInsights.push({
            type: 'warning',
            title: 'High Outstanding Balance',
            description: `₹${currentMetrics.balance_due.toLocaleString()} is pending collection. Consider sending payment reminders.`,
            impact: 'high',
            actionable: true,
            data: { amount: currentMetrics.balance_due }
          });
        }

        // Growth opportunity
        if (currentMetrics.total_orders_count && currentMetrics.total_revenue && 
            currentMetrics.total_orders_count > 0) {
          const avgOrderValue = currentMetrics.total_revenue / currentMetrics.total_orders_count;
          generatedInsights.push({
            type: 'opportunity',
            title: 'Average Order Value Optimization',
            description: `Current AOV is ₹${avgOrderValue.toLocaleString()}. Consider upselling to increase revenue per order.`,
            impact: 'medium',
            actionable: true,
            data: { aov: avgOrderValue }
          });
        }
      } else {
        // Add fallback insight when no metrics available
        generatedInsights.push({
          type: 'trend',
          title: 'Getting Started',
          description: 'Start adding orders and customers to see detailed business insights and analytics.',
          impact: 'low',
          actionable: true,
          data: { suggestion: 'add_data' }
        });
      }

      // Customer behavior insights
      if (customers && customers.length > 0) {
        generatedInsights.push({
          type: 'trend',
          title: 'Customer Base Growth',
          description: `You have ${customers.length} customers in your database. ${customers.length > 10 ? 'Great customer base!' : 'Growing customer base - consider marketing campaigns.'}`,
          impact: customers.length > 50 ? 'high' : 'medium',
          actionable: true,
          data: { customerCount: customers.length }
        });
      }

      // Recent activity insight
      if (recentOrders && recentOrders.length > 0) {
        generatedInsights.push({
          type: 'trend',
          title: 'Recent Business Activity',
          description: `You have ${recentOrders.length} orders in the last 30 days. ${recentOrders.length > 10 ? 'Business is active!' : 'Consider promotional activities to boost orders.'}`,
          impact: 'medium',
          actionable: true,
          data: { recentOrderCount: recentOrders.length }
        });
      }

      // Seasonal predictions
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 9 && currentMonth <= 11) { // Oct-Dec
        generatedInsights.push({
          type: 'prediction',
          title: 'Festival Season Opportunity',
          description: 'Wedding and festival season approaching. Stock up on premium materials and increase marketing efforts.',
          impact: 'high',
          actionable: true,
          data: { season: 'festival' }
        });
      }

      console.log('Generated insights:', generatedInsights);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate business insights');
      // Set fallback insights even on error
      setInsights([{
        type: 'warning',
        title: 'Connection Issue',
        description: 'Unable to fetch real-time data. Please check your connection and try again.',
        impact: 'medium',
        actionable: true,
        data: { error: 'connection_failed' }
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'opportunity': return <Target className="w-5 h-5 text-blue-500" />;
      case 'trend': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'prediction': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      default: return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold">AI Business Insights</h2>
        </div>
        <Button 
          onClick={generateInsights} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-r-lg ${getImpactColor(insight.impact)}`}
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {insight.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    insight.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {insight.impact.toUpperCase()} IMPACT
                  </span>
                  {insight.actionable && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                      ACTIONABLE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No insights generated yet. Click "Refresh Insights" to analyze your business data.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BusinessInsights;
