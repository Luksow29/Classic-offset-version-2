import React from 'react';
import Card from '@/components/ui/Card';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { useUser } from '@/context/UserContext';
import ForecastingChart from '@/components/dashboard/intelligence/ForecastingChart';
import SmartAlerts from '@/components/dashboard/intelligence/SmartAlerts';
import ReportDrilldownModal from '@/components/dashboard/ReportDrilldownModal';
import { Sparkles, TrendingUp, TrendingDown, Activity, BarChart2, PieChart, ArrowUpRight, Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ComprehensiveInsightsPage: React.FC = () => {
  const { userProfile } = useUser();
  const { data, isLoading } = useBusinessIntelligence(userProfile?.id);

  // All hooks must be called at the top, before any conditional returns
  const [drilldownOpen, setDrilldownOpen] = React.useState(false);
  const [drilldownType, setDrilldownType] = React.useState('profit_loss');
  const [drilldownFilters, setDrilldownFilters] = React.useState<Record<string, any>>({});
  const [insightsExpanded, setInsightsExpanded] = React.useState(false);

  const handleCardClick = (type: string, filters: Record<string, any> = {}) => {
    setDrilldownType(type);
    setDrilldownFilters(filters);
    setDrilldownOpen(true);
  };

  if (isLoading || !data) {
    return (
      <div className="p-3 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
        <div className="h-8 sm:h-12 w-48 sm:w-64 bg-muted animate-pulse rounded-lg mb-4 sm:mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-3 h-[300px] sm:h-[500px] bg-muted animate-pulse rounded-2xl sm:rounded-3xl"></div>
          <div className="lg:col-span-1 h-[200px] sm:h-[500px] bg-muted animate-pulse rounded-2xl sm:rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const { revenueForecast, insights } = data;
  const currentTrend = revenueForecast.trend;
  const isPositive = currentTrend === 'up';

  return (
    <div className="p-2 sm:p-6 lg:p-10 space-y-4 sm:space-y-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">

      {/* Page Header - Compact on Mobile */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:gap-4 px-1 sm:px-0"
      >
        <div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            Business Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-base lg:text-lg">
            AI-powered forecasting & anomaly detection
          </p>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">

        {/* Main Chart Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-3"
        >
          <Card className="bg-card/50 backdrop-blur-xl border border-border/60 overflow-hidden shadow-lg rounded-2xl sm:rounded-[2rem]">
            <div className="p-3 sm:p-6 lg:p-8">
              {/* Chart Header - Compact on Mobile */}
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl text-primary">
                    <BarChart2 size={18} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-foreground">Revenue Forecast</h2>
                    <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">Historical vs. AI Prediction</p>
                  </div>
                </div>
                <div className={`px-2 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-bold border flex items-center gap-1 ${isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                  {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span className="hidden sm:inline">{isPositive ? 'Growth' : 'Correction'}</span>
                </div>
              </div>

              {/* Chart Container - Much smaller on mobile */}
              <div className="w-full h-[160px] sm:h-[280px] lg:h-[350px] mb-2">
                <ForecastingChart
                  historical={revenueForecast.historical}
                  forecast={revenueForecast.forecast}
                />
              </div>

              {/* Stats Grid - Below Chart */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold mb-0.5 sm:mb-1">12M Revenue</p>
                  <p className="text-sm sm:text-xl lg:text-2xl font-display font-bold">
                    ₹{(revenueForecast.totalHistoricalRevenue / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold mb-0.5 sm:mb-1">Growth</p>
                  <p className={`text-sm sm:text-xl lg:text-2xl font-display font-bold ${revenueForecast.growthRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {revenueForecast.growthRate > 0 ? '+' : ''}{revenueForecast.growthRate.toFixed(0)}%
                  </p>
                </div>
                <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold mb-0.5 sm:mb-1">Confidence</p>
                  <p className="text-sm sm:text-xl lg:text-2xl font-display font-bold text-primary">High</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sidebar: Smart Insights - Collapsible on Mobile */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-1"
        >
          <Card className="bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl border border-border/60 shadow-lg rounded-2xl sm:rounded-[2rem] overflow-hidden">
            {/* Header - Clickable on mobile */}
            <div
              className="p-3 sm:p-6 border-b border-border/40 cursor-pointer xl:cursor-default"
              onClick={() => setInsightsExpanded(!insightsExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20 text-primary-foreground">
                    <Sparkles size={14} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-bold">Smart Insights</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {insights.length} alerts detected
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`xl:hidden text-muted-foreground transition-transform duration-200 ${insightsExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Content - Collapsible on mobile, always visible on desktop */}
            <AnimatePresence>
              <motion.div
                initial={false}
                animate={{
                  height: insightsExpanded ? 'auto' : (typeof window !== 'undefined' && window.innerWidth >= 1280 ? 'auto' : 0),
                  opacity: insightsExpanded ? 1 : (typeof window !== 'undefined' && window.innerWidth >= 1280 ? 1 : 0)
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden xl:!h-auto xl:!opacity-100"
              >
                <div className="p-3 sm:p-6 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                  <SmartAlerts insights={insights} />
                </div>
                <div className="p-3 sm:p-6 bg-gradient-to-t from-background/50 to-transparent border-t border-border/40">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <Activity size={12} className="animate-pulse text-primary" />
                    Monitoring live data...
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>

      {/* Quick Action Cards - Compact on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        <Card
          onClick={() => handleCardClick('profit_loss')}
          className="p-3 sm:p-6 bg-card/30 border border-border/40 hover:bg-card/50 transition-colors cursor-pointer group rounded-xl sm:rounded-2xl"
        >
          <div className="flex items-center gap-3 sm:block">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors sm:mb-4">
              <PieChart size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-lg">Category Distribution</h3>
                <ArrowUpRight size={16} className="text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Top selling products</p>
            </div>
          </div>
        </Card>

        <Card
          onClick={() => handleCardClick('customers_list', { sinceDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0] })}
          className="p-3 sm:p-6 bg-card/30 border border-border/40 hover:bg-card/50 transition-colors cursor-pointer group rounded-xl sm:rounded-2xl"
        >
          <div className="flex items-center gap-3 sm:block">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors sm:mb-4">
              <Users size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-lg">Customer Retention</h3>
                <ArrowUpRight size={16} className="text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Repeat purchase analysis</p>
            </div>
          </div>
        </Card>

        <Card
          onClick={() => handleCardClick('orders_list', { orderStatus: 'Pending' })}
          className="p-3 sm:p-6 bg-card/30 border border-border/40 hover:bg-card/50 transition-colors cursor-pointer group rounded-xl sm:rounded-2xl sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-3 sm:block">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors sm:mb-4">
              <Activity size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-lg">Operational Efficiency</h3>
                <ArrowUpRight size={16} className="text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Order processing times</p>
            </div>
          </div>
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
