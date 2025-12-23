// src/components/loyalty/LoyaltyTiersGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Trophy, Crown, Sparkles, Check } from 'lucide-react';
import Card from '../ui/Card';

interface LoyaltyTier {
    id: string;
    tier_name: string;
    tier_level: number;
    min_points: number;
    discount_percentage: number;
    benefits: string[];
    tier_color: string;
}

interface LoyaltyTiersGridProps {
    tiers: LoyaltyTier[];
}

const LoyaltyTiersGrid: React.FC<LoyaltyTiersGridProps> = ({ tiers }) => {

    const getTierIcon = (tierLevel: number) => {
        switch (tierLevel) {
            case 1: return <Award className="w-6 h-6" />;
            case 2: return <Star className="w-6 h-6" />;
            case 3: return <Trophy className="w-6 h-6" />;
            case 4: return <Crown className="w-6 h-6" />;
            case 5: return <Sparkles className="w-6 h-6" />;
            default: return <Award className="w-6 h-6" />;
        }
    };

    const getTierGradient = (tierLevel: number) => {
        switch (tierLevel) {
            case 1: return 'from-amber-600 to-amber-800'; // Bronze
            case 2: return 'from-gray-400 to-gray-600'; // Silver
            case 3: return 'from-yellow-400 to-yellow-600'; // Gold
            case 4: return 'from-indigo-500 to-purple-600'; // Platinum
            case 5: return 'from-blue-400 to-cyan-500'; // Diamond
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const getTierBg = (tierLevel: number) => {
        switch (tierLevel) {
            case 1: return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30';
            case 2: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
            case 3: return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30';
            case 4: return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30';
            case 5: return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    Loyalty Tiers
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {tiers.map((tier, index) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`relative rounded-2xl border p-5 transition-all duration-300 shadow-sm hover:shadow-xl ${getTierBg(tier.tier_level)}`}
                    >
                        {/* Header with Icon */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl shadow-lg bg-gradient-to-br ${getTierGradient(tier.tier_level)} text-white`}>
                                {getTierIcon(tier.tier_level)}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${tier.tier_level === 5 ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500' : 'text-gray-900 dark:text-white'}`}>
                                    {tier.tier_name}
                                </h3>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {tier.min_points}+ Points
                                </p>
                            </div>
                        </div>

                        {/* Discount Badge */}
                        <div className="mb-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-gray-900/50 shadow-sm border border-gray-100 dark:border-gray-700/50`}>
                                <span className={`bg-clip-text text-transparent bg-gradient-to-r ${getTierGradient(tier.tier_level)}`}>
                                    {tier.discount_percentage}% Discount on Orders
                                </span>
                            </span>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Benefits</p>
                            <ul className="space-y-1.5">
                                {tier.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                                        <Check className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                                        <span className="leading-tight">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Shine Effect for Top Tiers */}
                        {(tier.tier_level >= 4) && (
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                            </div>
                        )}

                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default LoyaltyTiersGrid;
