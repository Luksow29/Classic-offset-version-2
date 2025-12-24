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
    const isMobile = window.innerWidth < 640; // Simple mobile check or use hook
    const [isExpanded, setIsExpanded] = React.useState(!isMobile);

    // Update expansion state when screen size changes
    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 640;
            if (!mobile && !isExpanded) setIsExpanded(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded]);

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
        <Card className="bg-card/90 backdrop-blur-xl border border-border/60 overflow-hidden transition-all duration-300">
            <div className="p-3 sm:p-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                <div
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-0 sm:mb-6 cursor-pointer sm:cursor-default"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20 text-primary-foreground">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                                    Dashboard Intelligence
                                    <span className="sm:hidden text-muted-foreground">
                                        {isExpanded ? '−' : '+'}
                                    </span>
                                </h3>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">AI-Powered Forecasting & Insights</p>
                            </div>
                        </div>
                        {data.revenueForecast.trend !== 'stable' && (
                            <div className={`sm:hidden px-2 py-0.5 rounded-full text-[10px] font-bold border ${data.revenueForecast.trend === 'up'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}>
                                {data.revenueForecast.trend === 'up' ? '↗ Growth' : '↘ Correction'}
                            </div>
                        )}
                    </div>

                    {data.revenueForecast.trend !== 'stable' && (
                        <div className={`hidden sm:block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border self-start sm:self-auto ${data.revenueForecast.trend === 'up'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                            {data.revenueForecast.trend === 'up' ? '↗ Growth Trajectory' : '↘ Correction Mode'}
                        </div>
                    )}
                </div>

                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-h-[1000px] mt-4 sm:mt-0' : 'opacity-0 max-h-0'}`}>
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
