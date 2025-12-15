// src/pages/ComprehensiveInsightsPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GeminiChat from '@/components/chat/GeminiChat';
import MetricCard, { MetricCardProps } from '@/components/ui/MetricCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Icons
import { 
  Brain, TrendingUp, AlertTriangle, Target, Lightbulb, RefreshCw,
  IndianRupee, Users, ShoppingCart, Loader2, Zap, Palette, Mic,
  BarChart3, DollarSign, Activity, Calendar
} from 'lucide-react';

// Interfaces
interface DashboardMetrics {
  total_revenue: number;
  total_customers_count: number;
  orders_due_count: number;
  balance_due: number;
  total_orders_count?: number;
  total_paid?: number;
}

interface BusinessInsight {
  type: 'warning' | 'opportunity' | 'trend' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

const ComprehensiveInsightsPage: React.FC = () => {
  // Existing insights page state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starterPrompt, setStarterPrompt] = useState<string>("Give me a summary of my business performance today.");
  const [chatKey, setChatKey] = useState(0);

  // AI Business insights state
  const [aiInsights, setAiInsights] = useState<BusinessInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('get_dashboard_metrics');
        if (error) throw new Error(`Database error: ${error.message}`);
        if (data && data.length > 0) {
          setMetrics(data[0]);
        } else {
          setMetrics({ total_revenue: 0, total_customers_count: 0, orders_due_count: 0, balance_due: 0 });
        }
      } catch (err: any) {
        console.error("Error fetching dashboard metrics:", err);
        setError("Failed to load key metrics. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    generateAIInsights(); // Also generate AI insights on load
  }, []);

  // Generate AI Business Insights
  const generateAIInsights = async () => {
    setInsightsLoading(true);
    try {
      // Get business data for analysis
      const { data: metricsData } = await supabase.rpc('get_dashboard_metrics');
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      const generatedInsights: BusinessInsight[] = [];

      // System status insight
      generatedInsights.push({
        type: 'opportunity',
        title: '🚀 AI Analytics Active',
        description: 'Your comprehensive business intelligence system is analyzing real-time data and generating actionable insights.',
        impact: 'medium',
        actionable: true,
        data: { timestamp: new Date().toISOString() }
      });

      // Revenue analysis
      if (metricsData && metricsData.length > 0 && metricsData[0]) {
        const currentMetrics = metricsData[0];
        
        // Cash flow warning
        if (currentMetrics.balance_due && currentMetrics.total_paid && 
            currentMetrics.balance_due > currentMetrics.total_paid * 0.3) {
          generatedInsights.push({
            type: 'warning',
            title: '⚠️ High Outstanding Balance Alert',
            description: `₹${currentMetrics.balance_due.toLocaleString()} is pending collection (${Math.round((currentMetrics.balance_due / (currentMetrics.total_paid || 1)) * 100)}% of total payments). Consider payment follow-ups.`,
            impact: 'high',
            actionable: true,
            data: { amount: currentMetrics.balance_due, percentage: Math.round((currentMetrics.balance_due / (currentMetrics.total_paid || 1)) * 100) }
          });
        }

        // Growth opportunity
        if (currentMetrics.total_orders_count && currentMetrics.total_revenue && 
            currentMetrics.total_orders_count > 0) {
          const avgOrderValue = currentMetrics.total_revenue / currentMetrics.total_orders_count;
          generatedInsights.push({
            type: 'opportunity',
            title: '📈 Revenue Optimization Opportunity',
            description: `Current Average Order Value is ₹${avgOrderValue.toLocaleString()}. ${avgOrderValue < 10000 ? 'Consider upselling premium services' : 'Excellent order values - maintain quality service'}.`,
            impact: avgOrderValue < 5000 ? 'high' : 'medium',
            actionable: true,
            data: { aov: avgOrderValue }
          });
        }
      }

      // Customer insights
      if (customers && customers.length > 0) {
        const recentCustomers = customers.filter(c => 
          new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        generatedInsights.push({
          type: 'trend',
          title: '👥 Customer Base Analysis',
          description: `You have ${customers.length} total customers with ${recentCustomers} new customers this month. ${recentCustomers > 5 ? 'Great customer acquisition!' : 'Consider marketing campaigns to attract more customers.'}`,
          impact: recentCustomers > 10 ? 'high' : 'medium',
          actionable: true,
          data: { totalCustomers: customers.length, newCustomers: recentCustomers }
        });
      }

      // Activity insights
      if (recentOrders && recentOrders.length > 0) {
        const totalOrderValue = recentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        generatedInsights.push({
          type: 'trend',
          title: '📊 Recent Business Activity',
          description: `${recentOrders.length} orders worth ₹${totalOrderValue.toLocaleString()} in the last 30 days. ${recentOrders.length > 15 ? 'Excellent business momentum!' : 'Consider promotional activities to boost orders.'}`,
          impact: recentOrders.length > 15 ? 'high' : 'medium',
          actionable: true,
          data: { orderCount: recentOrders.length, totalValue: totalOrderValue }
        });
      }

      // Seasonal insights
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 9 && currentMonth <= 11) { // Oct-Dec
        generatedInsights.push({
          type: 'prediction',
          title: '🎊 Festival Season Strategy',
          description: 'Peak wedding and festival season! This is typically 40-60% of annual revenue. Ensure adequate inventory and staff.',
          impact: 'high',
          actionable: true,
          data: { season: 'festival', expectedGrowth: '40-60%' }
        });
      } else if (currentMonth >= 1 && currentMonth <= 3) { // Feb-Apr
        generatedInsights.push({
          type: 'prediction',
          title: '🌸 Wedding Season Preparation',
          description: 'Wedding season approaching! Start marketing premium packages and book key dates early.',
          impact: 'high',
          actionable: true,
          data: { season: 'wedding', preparation: 'advance_booking' }
        });
      }

      setAiInsights(generatedInsights);
      setLastUpdated(new Date().toLocaleString());
      toast.success(`Generated ${generatedInsights.length} business insights!`);

    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast.error('Failed to generate AI insights');
      setAiInsights([{
        type: 'warning',
        title: '⚠️ Data Connection Issue',
        description: 'Unable to fetch real-time data for AI analysis. Please check your connection and try again.',
        impact: 'medium',
        actionable: true,
        data: { error: 'connection_failed' }
      }]);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleCardClick = (prompt: string) => {
    setStarterPrompt(prompt);
    setChatKey(prevKey => prevKey + 1);
  };

  const metricCards = metrics ? [
    { title: "Total Revenue", icon: <IndianRupee size={28} />, value: metrics.total_revenue, colorClass: 'bg-gradient-to-br from-green-500 to-green-700', onClick: () => handleCardClick("Give me a detailed breakdown of this month's revenue and suggest ways to increase it.") },
    { title: "Total Customers", icon: <Users size={28} />, value: metrics.total_customers_count, colorClass: 'bg-gradient-to-br from-blue-500 to-blue-700', onClick: () => handleCardClick("Show me customer analytics and retention strategies.") },
    { title: 'Due Orders', icon: <ShoppingCart size={28} />, value: metrics.orders_due_count, colorClass: 'bg-gradient-to-br from-amber-500 to-amber-700', onClick: () => handleCardClick("Which orders have pending payments and how can I improve collection?") },
    { title: 'Outstanding Amount', icon: <AlertTriangle size={28} />, value: metrics.balance_due, colorClass: 'bg-gradient-to-br from-red-500 to-red-700', onClick: () => handleCardClick("List all customers with outstanding balances and suggest collection strategies.") },
  ] : [];

  const announcements = [
    { icon: <Brain size={20} className="text-purple-400"/>, text: "AI Business Insights: Get automated analysis and actionable recommendations based on your data."},
    { icon: <Zap size={20} className="text-yellow-400"/>, text: "Gemini AI Integration: Ask complex questions in Tamil or English for professional reports."},
    { icon: <Mic size={20} className="text-red-400"/>, text: "Voice Input: Use the microphone icon to ask questions with your voice."},
    { icon: <BarChart3 size={20} className="text-blue-400"/>, text: "Interactive Analytics: Click on any metric card for detailed AI analysis."}
  ];

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-500" />
          Comprehensive Business Intelligence 🧠
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Real-time metrics, AI-powered insights, and intelligent business analysis
        </p>
      </motion.div>
      
      {/* Announcements Section */}
      <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-blur-sm border border-purple-700 p-6 rounded-xl">
        <h3 className="font-semibold text-xl text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          🚀 Advanced Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1}}
              className="flex items-center gap-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
            >
              {item.icon}
              <span className="text-gray-200 text-sm">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-center">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => (
            <MetricCard {...metric} key={index} />
          ))}
        </div>
      )}

      {/* AI Business Insights Section */}
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
            onClick={generateAIInsights} 
            variant="outline" 
            size="sm"
            disabled={insightsLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`} />
            {insightsLoading ? 'Analyzing...' : 'Refresh Insights'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {aiInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-l-4 p-4 rounded-r-lg ${getImpactColor(insight.impact)}`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCardClick(`Analyze this insight: ${insight.title}. ${insight.description} What specific actions should I take?`)}
                      className="ml-auto text-xs"
                    >
                      Ask AI
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {aiInsights.length === 0 && !insightsLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No AI Insights Generated</h3>
            <p className="mb-4">Click "Refresh Insights" to analyze your business data.</p>
            <Button onClick={generateAIInsights} variant="outline">
              Generate AI Insights
            </Button>
          </div>
        )}
      </Card>

      {/* Enhanced Chat Section */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Mic className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold">AI Business Analyst Chat</h2>
        </div>
        <div className="h-[65vh] sm:h-[600px] bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <GeminiChat key={chatKey} starterPrompt={starterPrompt} />
        </div>
      </Card>
    </div>
  );
};

export default ComprehensiveInsightsPage;
