// src/components/crm/AdvancedCRM.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Phone, Mail, Calendar, TrendingUp, Star, Plus, Search, Filter, UserPlus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import CustomerDetailModal from './CustomerDetailModal';
import AddCustomerModal from './AddCustomerModal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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

interface CustomerAnalytics {
  totalCustomers: number;
  newThisMonth: number;
  vipCustomers: number;
  inactiveCustomers: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  retentionRate: number;
}

const AdvancedCRM: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // First, get all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Then get order data separately (with error handling in case table doesn't exist)
      let ordersData: any[] = [];
      try {
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select('customer_id, total_amount, created_at');

        if (ordersError) {
          console.warn('Orders table not found or accessible:', ordersError);
        } else {
          ordersData = data || [];
        }
      } catch (ordersFetchError) {
        console.warn('Could not fetch orders data:', ordersFetchError);
        // Continue without order data
      }

      // Enrich customer data with analytics
      const enrichedCustomers: Customer[] = customersData?.map((customer: any) => {
        const customerOrders = ordersData?.filter(order => order.customer_id === customer.id) || [];
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        const lastOrderDate = customerOrders.length > 0 
          ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        
        // Determine customer type based on spending and order history
        let customerType: Customer['customer_type'] = customer.customer_type || 'New';
        if (!customer.customer_type) {
          if (totalSpent > 50000) customerType = 'VIP';
          else if (totalOrders > 5) customerType = 'Regular';
          else if (totalOrders === 0) customerType = 'Inactive';
        }

        return {
          ...customer,
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order_date: lastOrderDate,
          customer_type: customerType,
          status: customer.status || 'active'
        };
      }) || [];

      setCustomers(enrichedCustomers);
      setFilteredCustomers(enrichedCustomers);
      
      // Calculate analytics
      calculateAnalytics(enrichedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (customerData: Customer[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const analytics: CustomerAnalytics = {
      totalCustomers: customerData.length,
      newThisMonth: customerData.filter(c => new Date(c.created_at) >= thisMonth).length,
      vipCustomers: customerData.filter(c => c.customer_type === 'VIP').length,
      inactiveCustomers: customerData.filter(c => c.customer_type === 'Inactive').length,
      averageOrderValue: customerData.reduce((sum, c) => sum + c.total_spent, 0) / customerData.reduce((sum, c) => sum + c.total_orders, 0) || 0,
      customerLifetimeValue: customerData.reduce((sum, c) => sum + c.total_spent, 0) / customerData.length || 0,
      retentionRate: ((customerData.length - customerData.filter(c => c.customer_type === 'Inactive').length) / customerData.length) * 100 || 0
    };
    
    setAnalytics(analytics);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers;
    
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(customer => customer.customer_type.toLowerCase() === filterType);
    }
    
    setFilteredCustomers(filtered);
  }, [searchTerm, filterType, customers]);

  const getCustomerTypeColor = (type: Customer['customer_type']) => {
    switch (type) {
      case 'VIP': return 'text-yellow-400 bg-yellow-400/10';
      case 'Regular': return 'text-green-400 bg-green-400/10';
      case 'New': return 'text-blue-400 bg-blue-400/10';
      case 'Inactive': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-400" />
            Advanced Customer Relationship Management
          </h1>
          <p className="text-gray-400 mt-1">
            Week 3: Complete customer lifecycle management with analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">New This Month</p>
                  <p className="text-2xl font-bold text-green-400">+{analytics.newThisMonth}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">VIP Customers</p>
                  <p className="text-2xl font-bold text-yellow-400">{analytics.vipCustomers}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.averageOrderValue)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="vip">VIP</option>
            <option value="regular">Regular</option>
            <option value="new">New</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      <Card className="bg-gray-800 border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Customer Directory</h2>
          
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium">{customer.name}</h3>
                      <p className="text-gray-400 text-sm">{customer.company}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400 text-xs">{customer.email}</span>
                        <Phone className="w-3 h-3 text-gray-400 ml-2" />
                        <span className="text-gray-400 text-xs">{customer.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCustomerTypeColor(customer.customer_type)}`}>
                      {customer.customer_type}
                    </span>
                    <p className="text-white font-semibold mt-1">{formatCurrency(customer.total_spent)}</p>
                    <p className="text-gray-400 text-sm">{customer.total_orders} orders</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No customers found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onUpdate={fetchCustomers}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerAdded={fetchCustomers}
      />
    </div>
  );
};

export default AdvancedCRM;
