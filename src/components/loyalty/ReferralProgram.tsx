// src/components/loyalty/ReferralProgram.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Share, Gift, TrendingUp, Copy, Check, User, UserPlus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface ReferralData {
  id: string;
  referrer_name: string;
  referrer_email: string;
  referrer_code: string;
  referred_name?: string;
  referred_email?: string;
  status: 'pending' | 'completed' | 'rewarded';
  referrer_points: number;
  referred_points: number;
  first_order_completed: boolean;
  created_at: string;
  completed_at?: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsAwarded: number;
  conversionRate: number;
  topReferrers: Array<{
    name: string;
    email: string;
    referral_count: number;
    total_points: number;
  }>;
}

interface ReferralProgramProps {
  onUpdate: () => void;
}

const ReferralProgram: React.FC<ReferralProgramProps> = ({ onUpdate }) => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      // Fetch referral data
      const { data: referralData, error: referralError } = await supabase
        .from('loyalty_referrals')
        .select(`
          *,
          referrer:customers!loyalty_referrals_referrer_id_fkey(name, email, referral_code),
          referred:customers!loyalty_referrals_referred_customer_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (referralError) throw referralError;

      const enrichedReferrals: ReferralData[] = referralData.map((ref: any) => ({
        id: ref.id,
        referrer_name: ref.referrer?.name || 'Unknown',
        referrer_email: ref.referrer?.email || '',
        referrer_code: ref.referrer?.referral_code || '',
        referred_name: ref.referred?.name,
        referred_email: ref.referred?.email,
        status: ref.status,
        referrer_points: ref.referrer_points,
        referred_points: ref.referred_points,
        first_order_completed: ref.first_order_completed,
        created_at: ref.created_at,
        completed_at: ref.completed_at
      }));

      setReferrals(enrichedReferrals);

      // Calculate stats
      const totalReferrals = enrichedReferrals.length;
      const completedReferrals = enrichedReferrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
      const pendingReferrals = enrichedReferrals.filter(r => r.status === 'pending').length;
      const totalPointsAwarded = enrichedReferrals.reduce((sum, r) => sum + r.referrer_points + r.referred_points, 0);
      const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

      // Get top referrers
      const referrerMap = new Map();
      enrichedReferrals.forEach(ref => {
        const key = ref.referrer_email;
        if (referrerMap.has(key)) {
          const existing = referrerMap.get(key);
          existing.referral_count += 1;
          existing.total_points += ref.referrer_points;
        } else {
          referrerMap.set(key, {
            name: ref.referrer_name,
            email: ref.referrer_email,
            referral_count: 1,
            total_points: ref.referrer_points
          });
        }
      });

      const topReferrers = Array.from(referrerMap.values())
        .sort((a, b) => b.referral_count - a.referral_count)
        .slice(0, 5);

      setStats({
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalPointsAwarded,
        conversionRate: Math.round(conversionRate * 10) / 10,
        topReferrers
      });

    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral program data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Failed to copy referral code');
    }
  };

  const updateReferralStatus = async (referralId: string, newStatus: ReferralData['status']) => {
    try {
      const { error } = await supabase
        .from('loyalty_referrals')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', referralId);

      if (error) throw error;

      toast.success(`Referral status updated to ${newStatus}`);
      await fetchReferralData();
      onUpdate();
    } catch (error) {
      console.error('Error updating referral status:', error);
      toast.error('Failed to update referral status');
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const getStatusColor = (status: ReferralData['status']) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10';
      case 'completed': return 'text-success bg-success/10';
      case 'rewarded': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Referral Program</h2>
          <p className="text-muted-foreground text-sm">Track and manage customer referrals and rewards</p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-white">{stats.completedReferrals}</p>
                </div>
                <UserPlus className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Points Awarded</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPointsAwarded.toLocaleString()}</p>
                </div>
                <Gift className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Top Referrers
            </h3>
            <div className="space-y-3">
              {stats?.topReferrers.map((referrer, index) => (
                <motion.div
                  key={referrer.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                          'bg-gray-600'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-card-foreground font-medium text-sm">{referrer.name}</p>
                      <p className="text-foreground/70 text-xs">{referrer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-success font-semibold">{referrer.referral_count} referrals</p>
                    <p className="text-blue-500 text-sm">{referrer.total_points} points</p>
                  </div>
                </motion.div>
              ))}
              {(!stats?.topReferrers || stats.topReferrers.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No referrers yet</p>
              )}
            </div>
          </div>
        </Card>

        {/* Referral Program Info */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Share className="w-5 h-5 text-primary" />
              Program Details
            </h3>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="text-foreground font-medium mb-2">How it Works</h4>
                <ul className="text-foreground/80 text-sm space-y-1">
                  <li>• Share your unique referral code</li>
                  <li>• Friend places their first order</li>
                  <li>• Both get reward points</li>
                </ul>

                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-foreground/70">You Get:</p>
                    <p className="text-green-400 font-semibold">200 Points</p>
                  </div>
                  <div>
                    <p className="text-foreground/70">Friend Gets:</p>
                    <p className="text-blue-500 font-semibold">100 Points</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="text-foreground font-medium mb-2">Terms</h4>
                <ul className="text-foreground/70 text-xs space-y-1">
                  <li>• Points awarded after first order completion</li>
                  <li>• Self-referrals not allowed</li>
                  <li>• Points expire after 1 year</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Referrals */}
      <Card className="bg-card border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Recent Referrals
          </h3>
          <div className="space-y-3">
            {referrals.slice(0, 10).map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted/30 rounded-lg p-4 border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-card-foreground font-medium">{referral.referrer_name}</span>
                      <span className="text-muted-foreground">referred</span>
                      {referral.referred_name ? (
                        <span className="text-success font-medium">{referral.referred_name}</span>
                      ) : (
                        <span className="text-warning">pending signup</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/70">Code:</span>
                        <span className="text-blue-500 font-mono">{referral.referrer_code}</span>
                        <button
                          onClick={() => copyReferralCode(referral.referrer_code)}
                          className="text-foreground/70 hover:text-foreground transition-colors"
                        >
                          {copiedCode === referral.referrer_code ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-foreground/70">Date:</span>
                        <span className="text-foreground/80">{formatDate(referral.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {referral.status}
                    </span>

                    {referral.status === 'pending' && (
                      <Button
                        onClick={() => updateReferralStatus(referral.id, 'completed')}
                        size="sm"
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        Mark Complete
                      </Button>
                    )}

                    <div className="text-right">
                      {referral.referrer_points > 0 && (
                        <p className="text-success text-sm font-semibold">
                          +{referral.referrer_points} pts
                        </p>
                      )}
                      {referral.referred_points > 0 && (
                        <p className="text-blue-500 text-xs">
                          Friend: +{referral.referred_points} pts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {referrals.length === 0 && (
              <div className="text-center py-8">
                <Share className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No referrals yet</p>
                <p className="text-muted-foreground text-sm">Referrals will appear here once customers start sharing</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReferralProgram;
