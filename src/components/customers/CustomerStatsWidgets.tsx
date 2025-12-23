import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, CreditCard, Wallet, TrendingUp, UserCheck } from 'lucide-react';
import { Customer } from '@/types';

interface StatsProps {
    customers: Customer[];
}

const CustomerStatsWidgets: React.FC<StatsProps> = ({ customers }) => {
    const stats = useMemo(() => {
        const totalCustomers = customers.length;

        // Calculate total balance due
        const totalBalanceDue = customers.reduce((sum, customer) => sum + (customer.balance_due || 0), 0);

        // VIP Customers: Defined as those with more than 10 orders (Loyal)
        const vipCustomers = customers.filter(c => (c.total_orders || 0) > 10).length;

        // Active Customers: Those with at least 1 order
        const activeCustomers = customers.filter(c => (c.total_orders || 0) > 0).length;

        return [
            {
                label: 'Total Customers',
                value: totalCustomers,
                icon: Users,
                color: 'from-blue-500 to-indigo-600',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                trend: '+5%', // Mock trend or could be calculated if we had previous month data
                trendUp: true
            },
            {
                label: 'VIP Clients',
                value: vipCustomers,
                icon: Star,
                color: 'from-amber-400 to-orange-500',
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                trend: 'Loyal',
                trendUp: true
            },
            {
                label: 'Active Users',
                value: activeCustomers,
                icon: UserCheck,
                color: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                trend: `${Math.round((activeCustomers / (totalCustomers || 1)) * 100)}%`,
                trendUp: true
            },
            {
                label: 'Total Receivables',
                value: `₹${totalBalanceDue.toLocaleString()}`,
                icon: Wallet,
                color: 'from-red-500 to-rose-600',
                bg: 'bg-red-50 dark:bg-red-900/20',
                trend: 'Due',
                trendUp: false
            }
        ];
    }, [customers]);

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
                            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {stat.value}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-indigo-500/20 text-white`}>
                            <stat.icon size={20} />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
                        <span className={`font-semibold ${stat.trendUp ? 'text-green-500' : 'text-amber-500'}`}>
                            {stat.trend}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">
                            {stat.label === 'Total Receivables' ? 'to be collected' : 'of total'}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default CustomerStatsWidgets;
