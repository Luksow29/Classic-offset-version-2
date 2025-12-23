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
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl"></div>
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
      className={`p-6 relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute top-0 right-0 p-3 opacity-10 ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`p-2 w-fit rounded-xl mb-3 ${colorClass.replace('text-', 'bg-').replace('500', '500/10')} text-${colorClass.split('-')[1]}-500`}>
          <Icon size={20} />
        </div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold mt-1 font-display">{value}</h3>
        <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
      </div>
      {onClick && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
          <MousePointerClick size={16} />
        </div>
      )}
    </Card>
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Activity size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Operations Control Center</h1>
          </div>
          <p className="text-muted-foreground ml-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Updates Active
            </span>
            <span className="mx-2 text-border">|</span>
            Monitor speed, throughput, and identify bottlenecks.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Updating...' : 'Refresh'}
        </Button>
      </div>

      {/* Hero Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            title="Weekly Throughput"
            value={operations.throughputWeekly}
            subtext="Orders completed this week"
            icon={CheckCircle2}
            colorClass="text-emerald-500"
            onClick={() => navigate('/orders?status=Completed')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <MetricCard
            title="Active Bottlenecks"
            value={operations.bottleneckCount}
            subtext="Orders stuck > 48h"
            icon={AlertOctagon}
            colorClass={operations.bottleneckCount > 0 ? "text-rose-500" : "text-gray-400"}
            onClick={handleBottleneckClick}
          />
        </motion.div>
      </div>

      {/* Insights / Action List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Recent Alerts (Now Interactive) */}
        <Card className="p-6 border-border/60">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Operational Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {insights.filter(i => i.metric !== 'Growth').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No critical alerts. Operations running smoothly.</p>
            ) : (
              insights.filter(i => i.metric !== 'Growth').map((insight, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAlertClick(insight)}
                  className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className={`mt-1 p-2 rounded-full h-fit transition-transform group-hover:scale-110 ${insight.impact === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                    <AlertOctagon size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      {insight.title}
                      {insight.actionable && <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />}
                    </h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Bottleneck Breaker */}
        <Card className="p-6 border-border/60 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-primary" />
              Bottleneck Breaker
            </h3>
          </div>

          {operations.bottleneckCount > 0 ? (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 text-center">
              <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-rose-700 dark:text-rose-400">Action Required</h4>
              <p className="text-rose-600/80 dark:text-rose-300/80 mb-4">
                You have {operations.bottleneckCount} orders that are delayed.
              </p>
              <Button
                onClick={handleBottleneckClick}
                className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white border-0"
              >
                View Stuck Orders <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-bold">All Clear!</h4>
              <p className="text-muted-foreground">No orders are currently stuck. Great job!</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default BusinessInsights;
