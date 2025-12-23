import React from 'react';
import Card from '@/components/ui/Card';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { useUser } from '@/context/UserContext';
import ForecastingChart from '@/components/dashboard/intelligence/ForecastingChart';
import SmartAlerts from '@/components/dashboard/intelligence/SmartAlerts';
import ReportDrilldownModal from '@/components/dashboard/ReportDrilldownModal';
import { Sparkles, TrendingUp, TrendingDown, Activity, Calendar, BarChart2, PieChart, ArrowUpRight, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const ComprehensiveInsightsPage: React.FC = () => {
  const { userProfile } = useUser();
  const { data, isLoading } = useBusinessIntelligence(userProfile?.id);

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="h-12 w-64 bg-muted animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[500px] bg-muted animate-pulse rounded-3xl"></div>
          <div className="lg:col-span-1 h-[500px] bg-muted animate-pulse rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const { revenueForecast, insights } = data;
  const currentTrend = revenueForecast.trend;
  const isPositive = currentTrend === 'up';

  const [drilldownOpen, setDrilldownOpen] = React.useState(false);
  const [drilldownType, setDrilldownType] = React.useState('profit_loss');
  const [drilldownFilters, setDrilldownFilters] = React.useState<Record<string, any>>({});

  const handleCardClick = (type: string, filters: Record<string, any> = {}) => {
    setDrilldownType(type);
    setDrilldownFilters(filters);
    setDrilldownOpen(true);
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Business Intelligence
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            AI-powered forecasting and real-time anomaly detection.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border/60 rounded-full shadow-sm">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Last 12 Months Analysis</span>
        </div>
      </motion.div>

      {/* Hero Layout: Chart + Key Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Main Chart Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-3"
        >
          <Card className="h-full bg-card/50 backdrop-blur-xl border border-border/60 overflow-hidden shadow-xl rounded-[2rem]">
            <div className="p-8 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Revenue Forecast</h2>
                    <p className="text-sm text-muted-foreground">Historical performance vs. AI Prediction</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isPositive ? 'Growth Trajectory' : 'Correction Phase'}
                </div>
              </div>

              <div className="flex-1 w-full min-h-[400px]">
                <ForecastingChart
                  historical={revenueForecast.historical}
                  forecast={revenueForecast.forecast}
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">12-Month Revenue</p>
                  <p className="text-2xl font-display font-bold">
                    ₹{revenueForecast.totalHistoricalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Growth Rate</p>
                  <p className={`text-2xl font-display font-bold ${revenueForecast.growthRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {revenueForecast.growthRate > 0 ? '+' : ''}{revenueForecast.growthRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Prediction Confidence</p>
                  <p className="text-2xl font-display font-bold text-primary">High</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sidebar: Smart Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-1 h-full"
        >
          <Card className="h-full bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl border border-border/60 shadow-xl rounded-[2rem] flex flex-col">
            <div className="p-6 border-b border-border/40">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20 text-primary-foreground">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-lg font-bold">Smart Insights</h3>
              </div>
              <p className="text-xs text-muted-foreground pl-11">
                Automated anomaly detection
              </p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <SmartAlerts insights={insights} />
            </div>
            <div className="p-6 bg-gradient-to-t from-background/50 to-transparent border-t border-border/40">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Activity size={14} className="animate-pulse text-primary" />
                System analyzing live data...
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Metrics / More Details (Placeholder for future expansion) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          onClick={() => handleCardClick('profit_loss')}
          className="p-6 bg-card/30 border border-border/40 hover:bg-card/50 transition-colors cursor-pointer group rounded-2xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <PieChart size={24} />
            </div>
            <ArrowUpRight size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-bold text-lg mb-1">Category Distribution</h3>
          <p className="text-sm text-muted-foreground">Top selling product categories</p>
        </Card>

        <Card
          onClick={() => handleCardClick('customers_list', { sinceDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0] })}
          className="p-6 bg-card/30 border border-border/40 hover:bg-card/50 transition-colors cursor-pointer group rounded-2xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <ArrowUpRight size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-bold text-lg mb-1">Customer Retention</h3>
          <p className="text-sm text-muted-foreground">Repeat purchase analysis</p>
        </Card>

        <Card
          onClick={() => handleCardClick('orders_list', { orderStatus: 'Pending' })}
          className="p-6 bg-card/30 border border-border/40 hover:bg-card/50 transition-colors cursor-pointer group rounded-2xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Activity size={24} />
            </div>
            <ArrowUpRight size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-bold text-lg mb-1">Operational Efficiency</h3>
          <p className="text-sm text-muted-foreground">Order processing timestamps</p>
        </Card>
      </div>

      <ReportDrilldownModal
        isOpen={drilldownOpen}
        onClose={() => setDrilldownOpen(false)}
        reportType={drilldownType}
        filters={drilldownFilters}
      />

    </div>
  );
};

export default ComprehensiveInsightsPage;
