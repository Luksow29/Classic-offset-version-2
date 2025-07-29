// src/components/loyalty/LoyaltyProgram.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Gift, Star, Users, Trophy, TrendingUp, Award, 
  Crown, Target, Calendar, ArrowRight, Sparkles
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LoyaltyDashboard from './LoyaltyDashboard';
import RewardsManagement from './RewardsManagement';
import CustomerLoyalty from './CustomerLoyalty';
import ReferralProgram from './ReferralProgram';

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

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      // Fetch loyalty tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('tier_level');

      if (tiersError) {
        console.error('Error fetching tiers:', tiersError);
        toast.error('Failed to fetch loyalty tiers');
        return;
      }

      setTiers(tiersData || []);

      // Fetch analytics data
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

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        toast.error('Failed to fetch customer data');
        return;
      }

      // Calculate analytics
      const totalMembers = customersData?.length || 0;
      const totalPointsEarned = customersData?.reduce((sum, c) => sum + (c.total_points_earned || 0), 0) || 0;
      const averagePointsPerCustomer = totalMembers > 0 ? Math.round(totalPointsEarned / totalMembers) : 0;
      
      // Calculate top tier customers (Platinum and Diamond)
      const topTierCustomers = customersData?.filter(c => 
        Array.isArray(c.loyalty_tiers) && c.loyalty_tiers.some((lt: any) => lt.tier_level >= 4)
      ).length || 0;

      // Calculate monthly growth (customers joined this month)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyGrowth = customersData?.filter(c => 
        new Date(c.created_at || '') >= thisMonth
      ).length || 0;

      const analyticsData: LoyaltyAnalytics = {
        totalMembers,
        activeRedemptions: 0, // TODO: Calculate from redemptions table
        pointsAwarded: totalPointsEarned,
        rewardsClaimed: 0, // TODO: Calculate from redemptions table
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

  const getTierIcon = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return <Award className="w-5 h-5" />;
      case 2: return <Star className="w-5 h-5" />;
      case 3: return <Trophy className="w-5 h-5" />;
      case 4: return <Crown className="w-5 h-5" />;
      case 5: return <Sparkles className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTierColor = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 2: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
      case 3: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 4: return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 5: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold">Customer Loyalty Program</h1>
              <p className="text-gray-500">Reward your best customers and increase retention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold">{analytics?.totalMembers || 0}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Points Awarded</p>
                <p className="text-2xl font-bold">{(analytics?.pointsAwarded || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">VIP Customers</p>
                <p className="text-2xl font-bold">{analytics?.topTierCustomers || 0}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Avg Points/Customer</p>
                <p className="text-2xl font-bold">{analytics?.averagePointsPerCustomer || 0}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Tier Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Loyalty Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${getTierColor(tier.tier_level)}`}>
                  {getTierIcon(tier.tier_level)}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: tier.tier_color }}>
                    {tier.tier_name}
                  </h3>
                  <p className="text-xs text-gray-500">{tier.min_points}+ points</p>
                </div>
              </div>
              <p className="text-sm text-green-600 font-medium">
                {tier.discount_percentage}% Discount
              </p>
              <div className="mt-2">
                <p className="text-xs text-gray-500">Benefits:</p>
                <ul className="text-xs text-gray-600 mt-1">
                  {tier.benefits.slice(0, 2).map((benefit, index) => (
                    <li key={index}>• {benefit}</li>
                  ))}
                  {tier.benefits.length > 2 && (
                    <li className="text-gray-400">+ {tier.benefits.length - 2} more</li>
                  )}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { key: 'rewards', label: 'Rewards', icon: Gift },
            { key: 'customers', label: 'Customers', icon: Users },
            { key: 'referrals', label: 'Referrals', icon: Star }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <LoyaltyDashboard analytics={analytics} tiers={tiers} />}
        {activeTab === 'rewards' && <RewardsManagement onUpdate={fetchLoyaltyData} />}
        {activeTab === 'customers' && <CustomerLoyalty onUpdate={fetchLoyaltyData} />}
        {activeTab === 'referrals' && <ReferralProgram onUpdate={fetchLoyaltyData} />}
      </Card>
    </div>
  );
};

export default LoyaltyProgram;
