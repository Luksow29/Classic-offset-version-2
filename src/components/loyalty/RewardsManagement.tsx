// src/components/loyalty/RewardsManagement.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Gift, Plus, Edit, Trash2, DollarSign, Star, Package, Zap } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface LoyaltyReward {
  id: string;
  reward_name: string;
  description: string;
  points_required: number;
  reward_type: 'discount' | 'product' | 'service' | 'cashback';
  reward_value: number;
  min_tier_required: number;
  is_active: boolean;
  stock_quantity?: number;
  terms_conditions: string;
  valid_from: string;
  valid_until?: string;
  created_at: string;
}

interface RewardsManagementProps {
  onUpdate: () => void;
}

const RewardsManagement: React.FC<RewardsManagementProps> = ({ onUpdate }) => {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [filter, setFilter] = useState<'all' | 'discount' | 'product' | 'service' | 'cashback'>('all');

  const [formData, setFormData] = useState({
    reward_name: '',
    description: '',
    points_required: '',
    reward_type: 'discount' as LoyaltyReward['reward_type'],
    reward_value: '',
    min_tier_required: '1',
    stock_quantity: '',
    terms_conditions: '',
    valid_until: ''
  });

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const resetForm = () => {
    setFormData({
      reward_name: '',
      description: '',
      points_required: '',
      reward_type: 'discount',
      reward_value: '',
      min_tier_required: '1',
      stock_quantity: '',
      terms_conditions: '',
      valid_until: ''
    });
    setEditingReward(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reward_name || !formData.points_required || !formData.reward_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        reward_name: formData.reward_name,
        description: formData.description,
        points_required: parseInt(formData.points_required),
        reward_type: formData.reward_type,
        reward_value: parseFloat(formData.reward_value),
        min_tier_required: parseInt(formData.min_tier_required),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        terms_conditions: formData.terms_conditions,
        valid_until: formData.valid_until || null,
        is_active: true
      };

      if (editingReward) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .update(payload)
          .eq('id', editingReward.id);
        
        if (error) throw error;
        toast.success('Reward updated successfully!');
      } else {
        const { error } = await supabase
          .from('loyalty_rewards')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Reward created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchRewards();
      onUpdate();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    }
  };

  const handleEdit = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setFormData({
      reward_name: reward.reward_name,
      description: reward.description,
      points_required: reward.points_required.toString(),
      reward_type: reward.reward_type,
      reward_value: reward.reward_value.toString(),
      min_tier_required: reward.min_tier_required.toString(),
      stock_quantity: reward.stock_quantity?.toString() || '',
      terms_conditions: reward.terms_conditions,
      valid_until: reward.valid_until ? reward.valid_until.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;
      toast.success('Reward deleted successfully!');
      fetchRewards();
      onUpdate();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  };

  const toggleActive = async (reward: LoyaltyReward) => {
    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .update({ is_active: !reward.is_active })
        .eq('id', reward.id);

      if (error) throw error;
      toast.success(`Reward ${reward.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchRewards();
      onUpdate();
    } catch (error) {
      console.error('Error updating reward status:', error);
      toast.error('Failed to update reward status');
    }
  };

  const getRewardIcon = (type: LoyaltyReward['reward_type']) => {
    switch (type) {
      case 'discount': return <DollarSign className="w-5 h-5" />;
      case 'product': return <Package className="w-5 h-5" />;
      case 'service': return <Zap className="w-5 h-5" />;
      case 'cashback': return <Star className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getRewardTypeColor = (type: LoyaltyReward['reward_type']) => {
    switch (type) {
      case 'discount': return 'text-green-400 bg-green-400/10';
      case 'product': return 'text-blue-400 bg-blue-400/10';
      case 'service': return 'text-purple-400 bg-purple-400/10';
      case 'cashback': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const filteredRewards = filter === 'all' 
    ? rewards 
    : rewards.filter(reward => reward.reward_type === filter);

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
          <h2 className="text-xl font-semibold text-white">Rewards Catalog</h2>
          <p className="text-gray-400 text-sm">Manage loyalty program rewards and offers</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-pink-600 hover:bg-pink-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Reward
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'discount', 'product', 'service', 'cashback'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as typeof filter)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterType
                ? 'bg-pink-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-gray-800 border-gray-700 ${!reward.is_active ? 'opacity-60' : ''}`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getRewardIcon(reward.reward_type)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRewardTypeColor(reward.reward_type)}`}>
                      {reward.reward_type}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(reward)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-white font-semibold mb-2">{reward.reward_name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{reward.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Points Required:</span>
                    <span className="text-pink-400 font-semibold">{reward.points_required}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Value:</span>
                    <span className="text-green-400 font-semibold">
                      {reward.reward_type === 'discount' || reward.reward_type === 'cashback' 
                        ? `₹${reward.reward_value}` 
                        : `₹${reward.reward_value}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Min Tier:</span>
                    <span className="text-blue-400 text-sm">Level {reward.min_tier_required}</span>
                  </div>
                  
                  {reward.stock_quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Stock:</span>
                      <span className="text-yellow-400 text-sm">{reward.stock_quantity} left</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <Button
                    onClick={() => toggleActive(reward)}
                    variant={reward.is_active ? 'outline' : 'primary'}
                    size="sm"
                    className="w-full"
                  >
                    {reward.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No rewards found for the selected filter</p>
        </div>
      )}

      {/* Add/Edit Reward Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingReward ? 'Edit Reward' : 'Add New Reward'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Reward Name *"
              value={formData.reward_name}
              onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500"
                rows={3}
                placeholder="Reward description..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Points Required *"
                type="number"
                value={formData.points_required}
                onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
              
              <Input
                label="Reward Value *"
                type="number"
                step="0.01"
                value={formData.reward_value}
                onChange={(e) => setFormData({ ...formData, reward_value: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reward Type</label>
                <select
                  value={formData.reward_type}
                  onChange={(e) => setFormData({ ...formData, reward_type: e.target.value as LoyaltyReward['reward_type'] })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500"
                >
                  <option value="discount">Discount</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="cashback">Cashback</option>
                </select>
              </div>
              
              <Input
                label="Min Tier Required"
                type="number"
                min="1"
                max="5"
                value={formData.min_tier_required}
                onChange={(e) => setFormData({ ...formData, min_tier_required: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock Quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Leave empty for unlimited"
              />
              
              <Input
                label="Valid Until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Terms & Conditions</label>
              <textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500"
                rows={2}
                placeholder="Terms and conditions..."
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                {editingReward ? 'Update' : 'Create'} Reward
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default RewardsManagement;
