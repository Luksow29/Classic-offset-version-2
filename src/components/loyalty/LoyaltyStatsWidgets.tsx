// src/components/loyalty/LoyaltyStatsWidgets.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Trophy, Target, Gift } from 'lucide-react';
import { formatCurrency } from '@classic-offset/shared';

interface LoyaltyAnalytics {
    totalMembers: number;
    activeRedemptions: number;
    pointsAwarded: number;
    rewardsClaimed: number;
    averagePointsPerCustomer: number;
    topTierCustomers: number;
    monthlyGrowth: number;
    engagementRate: number;
}

interface LoyaltyStatsWidgetsProps {
    analytics: LoyaltyAnalytics | null;
}

const LoyaltyStatsWidgets: React.FC<LoyaltyStatsWidgetsProps> = ({ analytics }) => {
    const stats = [
        {
            label: 'Total Members',
            value: analytics?.totalMembers || 0,
            icon: Users,
            color: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            subtext: 'Active Program Members'
        },
        {
            label: 'Points Awarded',
            value: (analytics?.pointsAwarded || 0).toLocaleString(),
            icon: TrendingUp,
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            subtext: 'Lifetime Points'
        },
        {
            label: 'VIP Customers',
            value: analytics?.topTierCustomers || 0,
            icon: Trophy,
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            subtext: 'Gold & Platinum Tier'
        },
        {
            label: 'Avg Points/Member',
            value: analytics?.averagePointsPerCustomer || 0,
            icon: Target,
            color: 'from-purple-500 to-violet-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            subtext: 'Per Active Customer'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                            {stat.subtext}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default LoyaltyStatsWidgets;
