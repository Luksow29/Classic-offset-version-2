// src/components/loyalty/CustomerLoyalty.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Search, Star, TrendingUp, Award, Gift, Plus, Minus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface CustomerLoyalty {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  total_points_earned: number;
  total_points_spent: number;
  tier_name: string;
  tier_level: number;
  tier_color: string;
  discount_percentage: number;
  referral_code: string;
  created_at: string;
}

interface PointTransaction {
  id: string;
  points_earned: number;
  points_spent: number;
  transaction_type: 'earned' | 'spent' | 'expired' | 'adjustment';
  reference_type: string;
  description: string;
  created_at: string;
}

interface CustomerLoyaltyProps {
  onUpdate: () => void;
}

const CustomerLoyalty: React.FC<CustomerLoyaltyProps> = ({ onUpdate }) => {
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          phone,
          loyalty_points,
          total_points_earned,
          total_points_spent,
          referral_code,
          created_at,
          loyalty_tiers (
            tier_name,
            tier_level,
            tier_color,
            discount_percentage
          )
        `)
        .order('loyalty_points', { ascending: false });

      if (error) throw error;

      const enrichedCustomers: CustomerLoyalty[] = data.map((customer: any) => ({
        ...customer,
        tier_name: customer.loyalty_tiers?.tier_name || 'Bronze',
        tier_level: customer.loyalty_tiers?.tier_level || 1,
        tier_color: customer.loyalty_tiers?.tier_color || '#CD7F32',
        discount_percentage: customer.loyalty_tiers?.discount_percentage || 0,
        total_points_spent: customer.total_points_spent || 0
      }));

      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTransactions = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    }
  };

  const handleCustomerClick = async (customer: CustomerLoyalty) => {
    setSelectedCustomer(customer);
    await fetchCustomerTransactions(customer.id);
    setShowDetailModal(true);
  };

  const handlePointAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer || !adjustmentPoints || !adjustmentReason) {
      toast.error('Please fill in all fields');
      return;
    }

    const pointsValue = parseInt(adjustmentPoints);
    if (isNaN(pointsValue) || pointsValue <= 0) {
      toast.error('Please enter a valid number of points');
      return;
    }

    try {
      // Add transaction record
      const transactionPayload = {
        customer_id: selectedCustomer.id,
        points_earned: adjustmentType === 'add' ? pointsValue : 0,
        points_spent: adjustmentType === 'subtract' ? pointsValue : 0,
        transaction_type: 'adjustment',
        reference_type: 'manual',
        description: adjustmentReason
      };

      const { error: transactionError } = await supabase
        .from('loyalty_points')
        .insert([transactionPayload]);

      if (transactionError) throw transactionError;

      // NOTE: The 'loyalty_points_trigger' database trigger automatically updates 
      // the customer's loyalty_points, total_points_earned, and total_points_spent
      // when a new record is inserted into loyalty_points.
      // We do NOT need to manually update the customers table here.

      toast.success(`Points ${adjustmentType === 'add' ? 'added' : 'deducted'} successfully!`);
      setShowAdjustModal(false);
      setAdjustmentPoints('');
      setAdjustmentReason('');

      // Refresh data
      await fetchCustomers();
      if (selectedCustomer) {
        await fetchCustomerTransactions(selectedCustomer.id);
        // We need to find the updated customer from the fresh list we just fetched
        const updatedCustomer = (await supabase.from('customers').select('*').eq('id', selectedCustomer.id).single()).data;
        if (updatedCustomer) {
          // We need to merge this with the complex object structure if needed, or just partial update
          // But since 'customers' state is already refreshed by fetchCustomers(), we can find it there
          // However, fetchCustomers() is async and updates state.
          // Let's just re-select it from the database to be sure we have the trigger's result
          setSelectedCustomer({
            ...selectedCustomer,
            loyalty_points: updatedCustomer.loyalty_points,
            total_points_earned: updatedCustomer.total_points_earned,
            total_points_spent: updatedCustomer.total_points_spent
          });
        }
      }
      onUpdate();
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('Failed to adjust points');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const getTierIcon = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return <Award className="w-4 h-4" />;
      case 2: return <Star className="w-4 h-4" />;
      case 3: return <TrendingUp className="w-4 h-4" />;
      case 4: return <Gift className="w-4 h-4" />;
      case 5: return <Users className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h2 className="text-xl font-semibold text-foreground">Customer Loyalty Management</h2>
          <p className="text-muted-foreground text-sm">View and manage customer loyalty points and tiers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background border-input text-foreground"
        />
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleCustomerClick(customer)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: customer.tier_color }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-card-foreground font-medium text-sm">{customer.name}</h3>
                      <p className="text-muted-foreground text-xs">{customer.email}</p>
                      <p className="text-foreground/70 text-xs">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${customer.tier_color}20`,
                        color: customer.tier_color
                      }}
                    >
                      {getTierIcon(customer.tier_level)}
                      <span className="ml-1">{customer.tier_name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 text-sm">Current Points:</span>
                    <span className="text-primary font-semibold">{customer.loyalty_points.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 text-sm">Total Earned:</span>
                    <span className="text-success text-sm">{customer.total_points_earned.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 text-sm">Discount:</span>
                    <span className="text-blue-500 text-sm">{customer.discount_percentage}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70 text-sm">Referral Code:</span>
                    <span className="text-warning text-sm font-mono">{customer.referral_code}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No customers found</p>
        </div>
      )}

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      >
        <div className="bg-card rounded-lg p-6 w-full max-w-2xl border border-border">
          {selectedCustomer && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: selectedCustomer.tier_color }}
                  >
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground">{selectedCustomer.name}</h3>
                    <p className="text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAdjustModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="sm"
                >
                  Adjust Points
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                  <p className="text-foreground/70 text-sm">Current Points</p>
                  <p className="text-2xl font-bold text-primary">{selectedCustomer.loyalty_points.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                  <p className="text-foreground/70 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-success">{selectedCustomer.total_points_earned.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                  <p className="text-foreground/70 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-destructive">{selectedCustomer.total_points_spent.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                  <p className="text-foreground/70 text-sm">Tier Discount</p>
                  <p className="text-2xl font-bold text-blue-500">{selectedCustomer.discount_percentage}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-card-foreground mb-4">Recent Transactions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-muted/30 rounded-lg p-3 border border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-card-foreground text-sm font-medium">{transaction.description}</p>
                          <p className="text-foreground/70 text-xs mt-1">
                            {transaction.reference_type} • {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          {transaction.points_earned > 0 && (
                            <span className="text-success font-semibold">
                              +{transaction.points_earned}
                            </span>
                          )}
                          {transaction.points_spent > 0 && (
                            <span className="text-destructive font-semibold">
                              -{transaction.points_spent}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No transactions found</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Point Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
      >
        <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Adjust Customer Points</h3>

          <form onSubmit={handlePointAdjustment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Adjustment Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('add')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${adjustmentType === 'add'
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  <Plus className="w-4 h-4" />
                  Add Points
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('subtract')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${adjustmentType === 'subtract'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  <Minus className="w-4 h-4" />
                  Subtract Points
                </button>
              </div>
            </div>

            <Input
              label="Points Amount *"
              type="number"
              min="1"
              value={adjustmentPoints}
              onChange={(e) => setAdjustmentPoints(e.target.value)}
              className="bg-background border-input text-foreground"
              required
            />

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Reason *</label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Reason for adjustment..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={adjustmentType === 'add' ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}
              >
                {adjustmentType === 'add' ? 'Add' : 'Subtract'} Points
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerLoyalty;
