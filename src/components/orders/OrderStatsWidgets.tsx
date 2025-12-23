import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { OrdersTableOrder } from '@/types';

interface OrderStatsProps {
    orders: OrdersTableOrder[];
}

const OrderStatsWidgets: React.FC<OrderStatsProps> = ({ orders }) => {
    // Calculate specific stats
    const stats = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        const todayOrders = orders.filter(o => o.date.startsWith(today)).length;
        const pending = orders.filter(o => ['Pending', 'pending'].includes(o.status)).length;
        const processing = orders.filter(o => ['Design', 'Correction', 'Printing', 'in_progress', 'confirmed'].includes(o.status)).length;
        const completed = orders.filter(o => ['Delivered', 'completed', 'delivered'].includes(o.status)).length;

        return [
            {
                label: "Today's Orders",
                value: todayOrders,
                icon: TrendingUp,
                color: 'from-blue-500 to-indigo-600',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                trend: '+12%', // Mock trend for now
                trendUp: true
            },
            {
                label: 'Pending Action',
                value: pending,
                icon: AlertCircle,
                color: 'from-amber-500 to-orange-600',
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                percentage: orders.length ? Math.round((pending / orders.length) * 100) + '%' : '0%'
            },
            {
                label: 'In Production',
                value: processing,
                icon: Clock,
                color: 'from-purple-500 to-pink-600',
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                percentage: orders.length ? Math.round((processing / orders.length) * 100) + '%' : '0%'
            },
            {
                label: 'Completed',
                value: completed,
                icon: CheckCircle,
                color: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                percentage: orders.length ? Math.round((completed / orders.length) * 100) + '%' : '0%'
            }
        ];
    }, [orders]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="relative overflow-hidden bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700/50 cursor-default group"
                >
                    {/* Background Decorative Blob */}
                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-xl group-hover:scale-150 transition-transform duration-500`} />

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {stat.label}
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {stat.value}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-indigo-500/20 text-white`}>
                            <stat.icon size={20} />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
                        {stat.trend ? (
                            <span className={`font-semibold ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.trend}
                            </span>
                        ) : (
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                                {stat.percentage}
                            </span>
                        )}
                        <span className="text-gray-400 dark:text-gray-500">
                            {stat.trend ? 'vs last week' : 'of total orders'}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default OrderStatsWidgets;
