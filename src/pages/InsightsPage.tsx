// src/pages/InsightsPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GeminiChat from '@/components/chat/GeminiChat';
import MetricCard, { MetricCardProps } from '@/components/ui/MetricCard';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import { motion } from 'framer-motion';

// Correctly import individual icons from lucide-react to enable tree-shaking
import IndianRupee from 'lucide-react/dist/esm/icons/indian-rupee';
import Users from 'lucide-react/dist/esm/icons/users';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Mic from 'lucide-react/dist/esm/icons/mic';


// Define the structure for the dashboard metrics
interface DashboardMetrics {
  total_revenue: number;
  total_customers_count: number;
  orders_due_count: number;
  balance_due: number;
}

const InsightsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starterPrompt, setStarterPrompt] = useState<string>("Give me a summary of my business performance today.");
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('get_dashboard_metrics');
        if (error) {
          const handledError = handleSupabaseError(error, { 
            operation: 'rpc_call', 
            table: 'get_dashboard_metrics' 
          }, false);
          
          if (handledError) {
            console.warn('Dashboard metrics function not available, using fallback');
            // Use fallback metrics
            setMetrics({ total_revenue: 0, total_customers_count: 0, orders_due_count: 0, balance_due: 0 });
            return;
          }
        }
        
        if (data && data.length > 0) {
            setMetrics(data[0]);
        } else {
            setMetrics({ total_revenue: 0, total_customers_count: 0, orders_due_count: 0, balance_due: 0 });
        }
      } catch (err: any) {
        console.error("Error fetching dashboard metrics:", err);
        setError("Some metrics may be unavailable. Core functionality is still working.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const handleCardClick = (prompt: string) => {
    setStarterPrompt(prompt);
    setChatKey(prevKey => prevKey + 1);
  };

  const metricCards = metrics ? [
    { title: "Total Revenue", icon: <IndianRupee size={28} />, value: metrics.total_revenue, colorClass: 'bg-gradient-to-br from-green-500 to-green-700', onClick: () => handleCardClick("Give me a detailed breakdown of this month's revenue.") },
    { title: "Total Customers", icon: <Users size={28} />, value: metrics.total_customers_count, colorClass: 'bg-gradient-to-br from-blue-500 to-blue-700', onClick: () => handleCardClick("Show me the newest customers.") },
    { title: 'Due Orders', icon: <ShoppingCart size={28} />, value: metrics.orders_due_count, colorClass: 'bg-gradient-to-br from-amber-500 to-amber-700', onClick: () => handleCardClick("Which orders have pending payments?") },
    { title: 'Total Due Amount', icon: <AlertTriangle size={28} />, value: metrics.balance_due, colorClass: 'bg-gradient-to-br from-red-500 to-red-700', onClick: () => handleCardClick("List all customers with outstanding balances.") },
  ] : [];

  const announcements = [
      { icon: <Zap size={20} className="text-yellow-400"/>, text: "Gemini AI Integration: Ask complex questions in Tamil or English and get professional reports."},
      { icon: <Mic size={20} className="text-red-400"/>, text: "Voice Input Enabled: Use the microphone icon in the chatbox to ask questions with your voice."},
      { icon: <Palette size={20} className="text-blue-400"/>, text: "Interactive Cards: Click on any metric card above to get a detailed analysis of that metric."}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">AI Business Insights 🧠</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get real-time metrics and chat with your intelligent business analyst.
        </p>
      </motion.div>
      
      {/* Announcements Section */}
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-4 rounded-xl">
          <h3 className="font-semibold text-lg text-white mb-3">🚀 What's New?</h3>
          <div className="space-y-3">
              {announcements.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1}}
                    className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
                  >
                      {item.icon}
                      <span className="text-gray-300 text-sm">{item.text}</span>
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

      {/* Chat Section */}
      <div className="h-[600px] bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg">
        <GeminiChat key={chatKey} starterPrompt={starterPrompt} />
      </div>
    </div>
  );
};

export default InsightsPage;
