// src/components/ai/BusinessInsights.tsx
import React from 'react';
import { useRealtimeBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { useUser } from '@/context/UserContext';
import {
  Activity, Clock, AlertOctagon, CheckCircle2,
  RefreshCw, Zap, AlignLeft, ArrowRight, MousePointerClick
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BusinessInsights: React.FC = () => {
  const { userProfile } = useUser();
  const navigate = useNavigate();
  // Use the new Realtime hook
  const { data, isLoading, refetch, isRefetching } = useRealtimeBusinessIntelligence(userProfile?.id);

  if (isLoading || !data) {
    return (
      <div className="p-2 sm:p-6 space-y-4 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex justify-between items-center gap-2">
          <div className="h-8 sm:h-10 w-48 sm:w-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-8 sm:h-10 w-20 sm:w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 sm:h-32 bg-muted animate-pulse rounded-xl sm:rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for missing operations
  const operations = data.operations || {
    avgTurnaroundHours: 0,
    bottleneckCount: 0,
    throughputWeekly: 0,
    activeOrders: 0
  };
  const insights = data.insights || [];

  const handleAlertClick = (insight: any) => {
    if (insight.metric === 'Delays' || insight.data?.filter === 'stuck_orders') {
      navigate('/orders?status=In%20Progress&sort=oldest');
    } else if (insight.metric === 'Speed') {
      navigate('/reports?type=efficiency'); // Hypothetical report
    } else if (insight.metric === 'Revenue') {
      navigate('/insights'); // Go to main insights chart
    }
  };

  const handleBottleneckClick = () => {
    navigate('/orders?status=In%20Progress&sort=oldest'); // Simple redirect to active orders
  };

  const MetricCard = ({ title, value, subtext, icon: Icon, colorClass, onClick }: any) => (
    <Card
      onClick={onClick}
      className={`p-2 sm:p-4 lg:p-6 relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 group rounded-xl sm:rounded-2xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute top-0 right-0 p-1 sm:p-3 opacity-10 ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={40} className="sm:w-20 sm:h-20" />
      </div>
      <div className="relative z-10">
        <div className={`p-1.5 sm:p-2 w-fit rounded-lg sm:rounded-xl mb-1 sm:mb-3 ${colorClass.replace('text-', 'bg-').replace('500', '500/10')} text-${colorClass.split('-')[1]}-500`}>
          <Icon size={14} className="sm:w-5 sm:h-5" />
        </div>
        <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
        <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mt-0.5 sm:mt-1 font-display">{value}</h3>
        <p className="text-[8px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-2 hidden sm:block">{subtext}</p>
      </div>
      {onClick && (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
          <MousePointerClick size={12} className="sm:w-4 sm:h-4" />
        </div>
      )}
    </Card>
  );

  return (
    <div className="p-2 sm:p-6 lg:p-10 space-y-4 sm:space-y-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">

      {/* Header - Compact on Mobile */}
      <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl text-primary">
            <Activity size={18} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-foreground">Operations Control</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] sm:text-xs font-medium border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
                Live
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isRefetching}
          className="gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
          size="sm"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefetching ? 'Updating...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Hero Metrics Grid - 3 columns on all screens */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <MetricCard
            title="Avg. Turnaround"
            value={`${operations.avgTurnaroundHours}h`}
            subtext="Target: < 24h"
            icon={Clock}
            colorClass="text-blue-500"
            onClick={() => navigate('/orders?status=Completed')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <MetricCard
            title="Weekly Done"
            value={operations.throughputWeekly}
            subtext="Completed this week"
            icon={CheckCircle2}
            colorClass="text-emerald-500"
            onClick={() => navigate('/orders?status=Completed')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <MetricCard
            title="Bottlenecks"
            value={operations.bottleneckCount}
            subtext="Stuck > 48h"
            icon={AlertOctagon}
            colorClass={operations.bottleneckCount > 0 ? "text-rose-500" : "text-gray-400"}
            onClick={handleBottleneckClick}
          />
        </motion.div>
      </div>

      {/* Insights / Action List - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 lg:gap-8">

        {/* Recent Alerts (Now Interactive) */}
        <Card className="p-3 sm:p-6 border-border/60 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              Operational Alerts
            </h3>
          </div>
          <div className="space-y-2 sm:space-y-4">
            {insights.filter(i => i.metric !== 'Growth').length === 0 ? (
              <p className="text-muted-foreground text-center py-6 sm:py-8 text-xs sm:text-base">No critical alerts. Operations running smoothly.</p>
            ) : (
              insights.filter(i => i.metric !== 'Growth').map((insight, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAlertClick(insight)}
                  className="flex gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className={`mt-0.5 p-1.5 sm:p-2 rounded-full h-fit transition-transform group-hover:scale-110 ${insight.impact === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                    <AlertOctagon size={14} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-base font-semibold flex items-center gap-1 sm:gap-2 truncate">
                      {insight.title}
                      {insight.actionable && <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />}
                    </h4>
                    <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">{insight.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Bottleneck Breaker */}
        <Card className="p-3 sm:p-6 border-border/60 bg-gradient-to-br from-card to-muted/20 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h3 className="text-sm sm:text-lg font-bold flex items-center gap-2">
              <AlignLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Bottleneck Breaker
            </h3>
          </div>

          {operations.bottleneckCount > 0 ? (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg sm:rounded-xl p-3 sm:p-6 text-center">
              <AlertOctagon className="w-8 h-8 sm:w-12 sm:h-12 text-rose-500 mx-auto mb-2 sm:mb-3" />
              <h4 className="text-sm sm:text-xl font-bold text-rose-700 dark:text-rose-400">Action Required</h4>
              <p className="text-rose-600/80 dark:text-rose-300/80 mb-3 sm:mb-4 text-xs sm:text-base">
                {operations.bottleneckCount} orders delayed.
              </p>
              <Button
                onClick={handleBottleneckClick}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white border-0 text-xs sm:text-sm"
                size="sm"
              >
                View Stuck Orders <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <CheckCircle2 size={24} className="sm:w-8 sm:h-8" />
              </div>
              <h4 className="font-bold text-sm sm:text-base">All Clear!</h4>
              <p className="text-muted-foreground text-xs sm:text-base">No orders stuck.</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default BusinessInsights;
