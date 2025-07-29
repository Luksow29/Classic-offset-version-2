// src/components/crm/CustomerDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { 
  X, Phone, Mail, MapPin, Calendar, TrendingUp, 
  MessageSquare, FileText, Clock, Plus, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  customer_type: 'VIP' | 'Regular' | 'New' | 'Inactive';
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  created_at: string;
  notes: string;
  follow_up_date?: string;
  communication_preference: 'email' | 'phone' | 'whatsapp';
  status: 'active' | 'inactive' | 'prospect';
}

interface CustomerInteraction {
  id: string;
  customer_id: string;
  type: 'call' | 'email' | 'meeting' | 'order' | 'complaint' | 'follow_up';
  subject: string;
  description: string;
  outcome: string;
  next_action?: string;
  created_at: string;
  created_by: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  due_date: string;
}

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onUpdate: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onUpdate
}) => {
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'orders'>('overview');
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'call' as CustomerInteraction['type'],
    subject: '',
    description: '',
    outcome: '',
    next_action: ''
  });

  useEffect(() => {
    if (isOpen && customer) {
      fetchCustomerData();
    }
  }, [isOpen, customer]);

  const fetchCustomerData = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
      } else {
        setInteractions(interactionsData || []);
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInteraction = async () => {
    if (!customer || !newInteraction.subject || !newInteraction.description) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_interactions')
        .insert([{
          customer_id: customer.id,
          ...newInteraction,
          created_by: 'current_user' // Replace with actual user ID
        }]);

      if (error) throw error;

      toast.success('Interaction added successfully');
      setNewInteraction({
        type: 'call',
        subject: '',
        description: '',
        outcome: '',
        next_action: ''
      });
      setShowAddInteraction(false);
      fetchCustomerData();
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast.error('Failed to add interaction');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInteractionIcon = (type: CustomerInteraction['type']) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'order': return <FileText className="w-4 h-4" />;
      case 'complaint': return <MessageSquare className="w-4 h-4" />;
      case 'follow_up': return <Clock className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCustomerTypeColor = (type: Customer['customer_type']) => {
    switch (type) {
      case 'VIP': return 'text-yellow-400 bg-yellow-400/10';
      case 'Regular': return 'text-green-400 bg-green-400/10';
      case 'New': return 'text-blue-400 bg-blue-400/10';
      case 'Inactive': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="bg-gray-800 rounded-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{customer.name}</h2>
              <p className="text-gray-400">{customer.company}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getCustomerTypeColor(customer.customer_type)}`}>
                {customer.customer_type === 'VIP' && <Star className="w-3 h-3 mr-1" />}
                {customer.customer_type}
              </span>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'interactions', label: 'Interactions' },
            { id: 'orders', label: 'Orders' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="bg-gray-700 border-gray-600">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-gray-400 text-sm">Phone</p>
                        <p className="text-white">{customer.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Customer Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <div className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(customer.total_spent)}</p>
                  </div>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <div className="p-4 text-center">
                    <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Total Orders</p>
                    <p className="text-xl font-bold text-white">{customer.total_orders}</p>
                  </div>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <div className="p-4 text-center">
                    <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Customer Since</p>
                    <p className="text-xl font-bold text-white">{formatDate(customer.created_at)}</p>
                  </div>
                </Card>
              </div>

              {/* Notes */}
              {customer.notes && (
                <Card className="bg-gray-700 border-gray-600">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                    <p className="text-gray-300">{customer.notes}</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Customer Interactions</h3>
                <Button
                  onClick={() => setShowAddInteraction(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Interaction
                </Button>
              </div>

              {showAddInteraction && (
                <Card className="bg-gray-700 border-gray-600">
                  <div className="p-4 space-y-4">
                    <h4 className="text-white font-medium">Add New Interaction</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={newInteraction.type}
                        onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value as CustomerInteraction['type'] })}
                        className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="complaint">Complaint</option>
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Subject"
                        value={newInteraction.subject}
                        onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                        className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <textarea
                      placeholder="Description"
                      value={newInteraction.description}
                      onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                      rows={3}
                    />
                    
                    <textarea
                      placeholder="Outcome"
                      value={newInteraction.outcome}
                      onChange={(e) => setNewInteraction({ ...newInteraction, outcome: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                      rows={2}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => setShowAddInteraction(false)}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addInteraction}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        Add Interaction
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <Card key={interaction.id} className="bg-gray-700 border-gray-600">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-blue-400 mt-1">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{interaction.subject}</h4>
                            <p className="text-gray-300 text-sm mt-1">{interaction.description}</p>
                            {interaction.outcome && (
                              <p className="text-gray-400 text-sm mt-2">
                                <strong>Outcome:</strong> {interaction.outcome}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-400 text-sm capitalize">{interaction.type}</span>
                          <p className="text-gray-400 text-xs mt-1">{formatDate(interaction.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {interactions.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No interactions recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
              
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="bg-gray-700 border-gray-600">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Order #{order.order_number}</h4>
                          <p className="text-gray-400 text-sm">Created: {formatDate(order.created_at)}</p>
                          <p className="text-gray-400 text-sm">Due: {formatDate(order.due_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(order.total_amount)}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                            order.status === 'in_progress' ? 'text-blue-400 bg-blue-400/10' :
                            'text-yellow-400 bg-yellow-400/10'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No orders found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerDetailModal;
