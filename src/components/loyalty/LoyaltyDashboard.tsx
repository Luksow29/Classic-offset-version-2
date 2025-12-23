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
  transactions: any[];
  tierDistribution: { id: string; count: number; percentage: number }[];
}

const LoyaltyDashboard: React.FC<LoyaltyDashboardProps> = ({ analytics, tiers, transactions, tierDistribution }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Avg Points/Customer</p>
                  <p className="text-2xl font-bold text-card-foreground">{formatNumber(analytics.averagePointsPerCustomer)}</p>
                  <p className="text-muted-foreground text-xs mt-1">Per active member</p>
                </div>
                <Star className="w-10 h-10 text-primary" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Monthly Growth</p>
                  <p className="text-2xl font-bold text-success">+{analytics.monthlyGrowth}</p>
                  <p className="text-muted-foreground text-xs mt-1">New members</p>
                </div>
                <TrendingUp className="w-10 h-10 text-success" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Top Tier Members</p>
                  <p className="text-2xl font-bold text-warning">{analytics.topTierCustomers}</p>
                  <p className="text-muted-foreground text-xs mt-1">Platinum & Diamond</p>
                </div>
                <Trophy className="w-10 h-10 text-warning" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Redemptions</p>
                  <p className="text-2xl font-bold text-card-foreground">{analytics.activeRedemptions}</p>
                  <p className="text-muted-foreground text-xs mt-1">Pending rewards</p>
                </div>
                <Gift className="w-10 h-10 text-accent" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Flow */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Points Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Total Points Awarded</span>
                <span className="text-success font-semibold">{formatNumber(analytics.pointsAwarded)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Rewards Claimed</span>
                <span className="text-primary font-semibold">{analytics.rewardsClaimed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Engagement Rate</span>
                <span className="text-warning font-semibold">{analytics.engagementRate}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tier Distribution */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Tier Distribution
            </h3>
            <div className="space-y-3">
              {tiers.map((tier) => {
                const distributionData = tierDistribution.find(d => d.id === tier.id);
                const percentage = distributionData?.percentage || 0;
                const count = distributionData?.count || 0;

                return (
                  <div key={tier.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tier.tier_color }}
                      />
                      <span className="text-muted-foreground text-sm">{tier.tier_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: tier.tier_color,
                            width: `${percentage}%`
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs w-12 text-right">{Math.round(percentage)}% ({count})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${transaction.transaction_type === 'earned' ? 'bg-success' :
                      transaction.transaction_type === 'adjustment' ? 'bg-primary' :
                        (transaction.transaction_type === 'redemption' || transaction.transaction_type === 'spent') ? 'bg-warning' :
                          'bg-muted-foreground'
                    }`} />
                  <div>
                    <p className="text-card-foreground text-sm">{transaction.description || 'Points Update'}</p>
                    <p className="text-muted-foreground text-xs">{transaction.customers?.name || 'Customer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${transaction.points_earned > 0 ? 'text-success' :
                    transaction.points_spent > 0 ? 'text-destructive' : 'text-foreground'
                    }`}>
                    {transaction.points_earned > 0 ? `+${transaction.points_earned}` : `-${transaction.points_spent}`} pts
                  </p>
                  <p className="text-muted-foreground text-xs">{formatDate(transaction.created_at)}</p>
                </div>
              </motion.div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent activity found.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoyaltyDashboard;
