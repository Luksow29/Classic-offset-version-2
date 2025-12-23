// src/components/loyalty/LoyaltyProgram.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Gift, Users, TrendingUp, Star, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import LoyaltyDashboard from './LoyaltyDashboard';
import RewardsManagement from './RewardsManagement';
import CustomerLoyalty from './CustomerLoyalty';
import ReferralProgram from './ReferralProgram';
import LoyaltyStatsWidgets from './LoyaltyStatsWidgets';
import LoyaltyTiersGrid from './LoyaltyTiersGrid';

interface LoyaltyTier {
  id: string;
  tier_name: string;
  tier_level: number;
  min_points: number;
  discount_percentage: number;
  benefits: string[];
  tier_color: string;
}

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

const LoyaltyProgram: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<LoyaltyAnalytics | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rewards' | 'customers' | 'referrals'>('dashboard');

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [tierDistribution, setTierDistribution] = useState<{ id: string; count: number; percentage: number }[]>([]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      // 1. Fetch loyalty tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('tier_level');

      if (tiersError) throw tiersError;
      setTiers(tiersData || []);

      // 2. Fetch customers for analytics and tier distribution
      // Note: In a real large-scale app, we would use a DB view or RPC for this aggregation
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          loyalty_points,
          total_points_earned,
          loyalty_tier_id,
          created_at,
          loyalty_tiers!inner(tier_level)
        `);

      if (customersError) throw customersError;

      // 3. Fetch Redemptions (Active & Claimed)
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('loyalty_redemptions')
        .select('id, status');

      if (redemptionsError) throw redemptionsError;

      const activeRedemptions = redemptionsData?.filter(r => r.status === 'pending').length || 0;
      const rewardsClaimed = redemptionsData?.filter(r => r.status === 'completed' || r.status === 'approved').length || 0;

      // 4. Fetch Recent Transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          customers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactionsData || []);

      // Analytics Calculations
      const totalMembers = customersData?.length || 0;
      const totalPointsEarned = customersData?.reduce((sum, c) => sum + (c.total_points_earned || 0), 0) || 0;
      const averagePointsPerCustomer = totalMembers > 0 ? Math.round(totalPointsEarned / totalMembers) : 0;

      // Calculate top tier customers (Level 4 & 5)
      const topTierCustomers = customersData?.filter(c =>
        Array.isArray(c.loyalty_tiers) ? c.loyalty_tiers.some((lt: any) => lt.tier_level >= 4) :
          (c.loyalty_tiers as any)?.tier_level >= 4
      ).length || 0;

      // Calculate monthly growth
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyGrowth = customersData?.filter(c =>
        new Date(c.created_at || '') >= thisMonth
      ).length || 0;

      // Calculate Tier Distribution
      const distribution = (tiersData || []).map(tier => {
        const count = customersData?.filter(c => c.loyalty_tier_id === tier.id).length || 0;
        return {
          id: tier.id,
          count,
          percentage: totalMembers > 0 ? (count / totalMembers) * 100 : 0
        };
      });
      setTierDistribution(distribution);

      const analyticsData: LoyaltyAnalytics = {
        totalMembers,
        activeRedemptions,
        pointsAwarded: totalPointsEarned,
        rewardsClaimed,
        averagePointsPerCustomer,
        topTierCustomers,
        monthlyGrowth,
        engagementRate: totalMembers > 0 ? Math.round((topTierCustomers / totalMembers) * 100) : 0
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast.error('Failed to fetch loyalty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'referrals', label: 'Referrals', icon: Star },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Loyalty Program</h1>
              <p className="text-indigo-100 font-medium max-w-xl">
                Reward your best customers, boost retention, and drive growth with our tiered rewards system.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full text-emerald-100 font-semibold text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              System Active
            </div>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <LoyaltyStatsWidgets analytics={analytics} />

      {/* Loyalty Tiers */}
      <LoyaltyTiersGrid tiers={tiers} />

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[600px]">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative py-4 px-2 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap outline-none ${activeTab === tab.id
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5px]' : ''} />
                <span className={activeTab === tab.id ? 'font-bold' : ''}>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabLoyalty"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Panels */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[400px]"
            >
              {activeTab === 'dashboard' && (
                <LoyaltyDashboard
                  analytics={analytics}
                  tiers={tiers}
                  transactions={recentTransactions}
                  tierDistribution={tierDistribution}
                />
              )}
              {activeTab === 'rewards' && <RewardsManagement onUpdate={fetchLoyaltyData} />}
              {activeTab === 'customers' && <CustomerLoyalty onUpdate={fetchLoyaltyData} />}
              {activeTab === 'referrals' && <ReferralProgram onUpdate={fetchLoyaltyData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgram;

