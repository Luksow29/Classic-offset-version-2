// src/components/loyalty/LoyaltyDashboard.tsx
import React from 'react';
import { TrendingUp, Users, Star, Gift, Trophy, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import { motion } from 'framer-motion';

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

interface LoyaltyDashboardProps {
  analytics: LoyaltyAnalytics | null;
  tiers: LoyaltyTier[];
}

const LoyaltyDashboard: React.FC<LoyaltyDashboardProps> = ({ analytics, tiers }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Avg Points/Customer</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(analytics.averagePointsPerCustomer)}</p>
                  <p className="text-blue-300 text-xs mt-1">Per active member</p>
                </div>
                <Star className="w-10 h-10 text-blue-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Monthly Growth</p>
                  <p className="text-2xl font-bold text-white">+{analytics.monthlyGrowth}%</p>
                  <p className="text-green-300 text-xs mt-1">New members</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Top Tier Members</p>
                  <p className="text-2xl font-bold text-white">{analytics.topTierCustomers}</p>
                  <p className="text-yellow-300 text-xs mt-1">Platinum & Diamond</p>
                </div>
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Active Redemptions</p>
                  <p className="text-2xl font-bold text-white">{analytics.activeRedemptions}</p>
                  <p className="text-purple-300 text-xs mt-1">Pending rewards</p>
                </div>
                <Gift className="w-10 h-10 text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Flow */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Points Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Total Points Awarded</span>
                <span className="text-green-400 font-semibold">{formatNumber(analytics.pointsAwarded)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Rewards Claimed</span>
                <span className="text-blue-400 font-semibold">{analytics.rewardsClaimed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Engagement Rate</span>
                <span className="text-yellow-400 font-semibold">{analytics.engagementRate}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tier Distribution */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Tier Distribution
            </h3>
            <div className="space-y-3">
              {tiers.map((tier, index) => {
                const percentage = Math.random() * 40 + 10; // Mock data for visualization
                return (
                  <div key={tier.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tier.tier_color }}
                      />
                      <span className="text-gray-300 text-sm">{tier.tier_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: tier.tier_color,
                            width: `${percentage}%`
                          }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs w-8">{Math.round(percentage)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800 border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { action: 'New member joined', customer: 'Rajesh Kumar', tier: 'Bronze', time: '2 hours ago', type: 'join' },
              { action: 'Points earned', customer: 'Priya Singh', points: '150 points', time: '4 hours ago', type: 'earn' },
              { action: 'Reward redeemed', customer: 'Amit Patel', reward: '₹100 discount', time: '6 hours ago', type: 'redeem' },
              { action: 'Tier upgraded', customer: 'Sneha Sharma', tier: 'Gold', time: '8 hours ago', type: 'upgrade' },
              { action: 'Referral successful', customer: 'Vikram Gupta', points: '200 points', time: '1 day ago', type: 'referral' }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'join' ? 'bg-green-400' :
                    activity.type === 'earn' ? 'bg-blue-400' :
                    activity.type === 'redeem' ? 'bg-yellow-400' :
                    activity.type === 'upgrade' ? 'bg-purple-400' :
                    'bg-pink-400'
                  }`} />
                  <div>
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-gray-400 text-xs">{activity.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm">
                    {activity.tier || activity.points || activity.reward}
                  </p>
                  <p className="text-gray-400 text-xs">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoyaltyDashboard;
