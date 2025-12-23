import React from 'react';
import Card from '../../ui/Card';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { useUser } from '@/context/UserContext';
import ForecastingChart from './ForecastingChart';
import SmartAlerts from './SmartAlerts';
import { Sparkles, BarChart2 } from 'lucide-react';

const DashboardIntelligence: React.FC = () => {
    const { userProfile } = useUser();
    const { data, isLoading } = useBusinessIntelligence(userProfile?.id);

    if (isLoading || !data) {
        return (
            <Card className="bg-card/90 backdrop-blur-xl border border-border/60 p-6 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 bg-muted rounded-xl"></div>
                    <div className="lg:col-span-1 h-64 bg-muted rounded-xl"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-card/90 backdrop-blur-xl border border-border/60 overflow-hidden">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20 text-primary-foreground">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg text-foreground">Dashboard Intelligence</h3>
                            <p className="text-xs text-muted-foreground">AI-Powered Forecasting & Insights</p>
                        </div>
                    </div>
                    {data.revenueForecast.trend !== 'stable' && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${data.revenueForecast.trend === 'up'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                            {data.revenueForecast.trend === 'up' ? '↗ Growth Trajectory' : '↘ Correction Mode'}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 space-y-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <BarChart2 size={14} /> Revenue Forecast (Next 3 Months)
                            </span>
                        </div>
                        <div className="bg-background/50 rounded-xl border border-border/50 p-2">
                            <ForecastingChart
                                historical={data.revenueForecast.historical}
                                forecast={data.revenueForecast.forecast}
                            />
                        </div>
                    </div>

                    {/* Insights Section */}
                    <div className="lg:col-span-1">
                        <div className="h-full flex flex-col">
                            <div className="mb-4 px-2">
                                <span className="text-sm font-medium text-muted-foreground">Smart Insights</span>
                            </div>
                            <div className="flex-1 bg-background/50 rounded-xl border border-border/50 p-4">
                                <SmartAlerts insights={data.insights} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DashboardIntelligence;
