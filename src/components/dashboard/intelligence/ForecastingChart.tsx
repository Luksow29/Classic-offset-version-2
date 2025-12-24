import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { DataPoint } from '@/lib/forecastingUtils';
import { format, parseISO } from 'date-fns';

interface ForecastingChartProps {
    historical: DataPoint[];
    forecast: DataPoint[];
}

const ForecastingChart: React.FC<ForecastingChartProps> = ({ historical, forecast }) => {
    // Combine data for the chart, ensuring a continuous line
    // The last historical point should be the starting point for forecast visualization if possible,
    // but for simplicity we'll just plot them.

    // Tag data points to distinguish history vs forecast
    const chartData = [
        ...historical.map(d => ({ ...d, type: 'Historical', predicted: null as number | null, actual: d.value })),
        ...forecast.map(d => ({ ...d, type: 'Forecast', predicted: d.value, actual: null as number | null }))
    ];

    /* 
       To make the lines connect, we need the last historical point to also have a 'predicted' value 
       equal to its actual value, OR add a valid 'predicted' start point.
       Let's clean this up:
    */
    const connectedData = [...chartData];
    if (historical.length > 0 && forecast.length > 0) {
        // Add the last historical point to the forecast line so they connect visually
        const lastHist = historical[historical.length - 1];
        // We manually insert a point that has both 'actual' (to end the blue line) 
        // and 'predicted' (to start the dashed line)
        // Actually, Recharts is tricky with unconnected lines. 
        // Standard trick: use two Area/Lines.
    }

    // Simplified approach: Render Actual and Predicted as separate areas
    // For the 'Predicted' area to start where 'Actual' ends, we need to share the middle point.
    const refinedData: { name: string; actual: number | null; predicted: number | null }[] = [
        ...historical.map((d): { name: string; actual: number | null; predicted: number | null } => ({ name: d.date, actual: d.value, predicted: null })),
        // Bridge point: The last historical point is also the start of the prediction line (visually)
        ...(historical.length > 0 ? [{
            name: historical[historical.length - 1].date,
            actual: historical[historical.length - 1].value,
            predicted: historical[historical.length - 1].value
        }] : []),
        ...forecast.map((d): { name: string; actual: number | null; predicted: number | null } => ({ name: d.date, actual: null, predicted: d.value }))
    ];

    // Remove duplicates based on date (name) just in case
    const uniqueData = Array.from(new Map(refinedData.map(item => [item.name, item])).values())
        .sort((a, b) => a.name.localeCompare(b.name));


    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
        return `₹${value}`;
    };

    const formatXAxis = (dateStr: string) => {
        try {
            return format(parseISO(dateStr + '-01'), 'MMM');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={uniqueData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis
                        dataKey="name"
                        tickFormatter={formatXAxis}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => [
                            `₹${value.toLocaleString()}`,
                            name === 'actual' ? 'Actual Revenue' : 'Projected Revenue'
                        ]}
                        labelFormatter={(label) => formatXAxis(label as string)}
                    />
                    <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorActual)"
                        name="Actual"
                    />
                    <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorPredicted)"
                        name="Predicted"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ForecastingChart;
