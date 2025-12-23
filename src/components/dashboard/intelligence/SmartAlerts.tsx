import React from 'react';
// import { Card } from '@/components/ui/Card'; // Unused
import { TrendingUp, TrendingDown, AlertCircle, Zap, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { BusinessInsight } from '@/hooks/useBusinessIntelligence';

interface SmartAlertsProps {
    insights: BusinessInsight[];
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ insights }) => {
    if (!insights || insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                <Zap className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No anomalies detected. Business is running smoothly.</p>
            </div>
        );
    }

    const getIcon = (type: BusinessInsight['type']) => {
        switch (type) {
            case 'trend': return <TrendingUp size={14} />;
            case 'warning': return <AlertTriangle size={14} />;
            case 'opportunity': return <Target size={14} />;
            case 'prediction': return <Lightbulb size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const getColorClass = (type: BusinessInsight['type']) => {
        switch (type) {
            case 'trend': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
            case 'warning': return 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400';
            case 'opportunity': return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400';
            case 'prediction': return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
            default: return 'bg-gray-500/10 border-gray-500/20 text-gray-700';
        }
    };

    const getIconBg = (type: BusinessInsight['type']) => {
        switch (type) {
            case 'trend': return 'bg-emerald-500/20';
            case 'warning': return 'bg-rose-500/20';
            case 'opportunity': return 'bg-blue-500/20';
            case 'prediction': return 'bg-amber-500/20';
            default: return 'bg-gray-500/20';
        }
    }

    return (
        <div className="space-y-4">
            {insights.map((insight, index) => (
                <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${getColorClass(insight.type)}`}
                >
                    <div className={`mt-0.5 p-1 rounded-full ${getIconBg(insight.type)}`}>
                        {getIcon(insight.type)}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase opacity-70 mb-0.5">{insight.title}</p>
                        <p className="text-sm font-medium leading-snug">{insight.description}</p>
                    </div>
                </div>
            ))}

            {/* Decorative pulse */}
            <div className="relative mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    AI is monitoring business pulse...
                </div>
            </div>
        </div>
    );
};

export default SmartAlerts;
