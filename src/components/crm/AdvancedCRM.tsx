// src/components/crm/AdvancedCRM.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@classic-offset/shared';
import { Users, Phone, Mail, TrendingUp, Star, Search, UserPlus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
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

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // First, get all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Type for order data from database
      interface OrderData {
        customer_id: string;
        total_amount: number | null;
        created_at: string;
      }

      // Then get order data separately (with error handling in case table doesn't exist)
      let ordersData: OrderData[] = [];
      try {
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select('customer_id, total_amount, created_at');

        if (ordersError) {
          console.warn('Orders table not found or accessible:', ordersError);
        } else {
          ordersData = (data || []) as OrderData[];
        }
      } catch (ordersFetchError) {
        console.warn('Could not fetch orders data:', ordersFetchError);
        // Continue without order data
      }

      // Type for raw customer data from database
      interface RawCustomer {
        id: string;
        name: string;
        email: string;
        phone: string;
        company: string;
        customer_type?: Customer['customer_type'];
        created_at: string;
        notes: string;
        follow_up_date?: string;
        communication_preference?: 'email' | 'phone' | 'whatsapp';
        status?: 'active' | 'inactive' | 'prospect';
      }

      // Enrich customer data with analytics
      const enrichedCustomers: Customer[] = (customersData as RawCustomer[])?.map((customer) => {
        const customerOrders = ordersData?.filter(order => order.customer_id === customer.id) || [];
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum: number, order) => sum + (order.total_amount || 0), 0);
        const lastOrderDate = customerOrders.length > 0
          ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : '';

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
          status: customer.status || 'active',
          communication_preference: customer.communication_preference || 'phone'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // formatCurrency is now imported from @classic-offset/shared

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Advanced Customer Relationship Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Week 3: Complete customer lifecycle management with analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-card-foreground">{analytics.totalCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">New This Month</p>
                  <p className="text-2xl font-bold text-success">+{analytics.newThisMonth}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">VIP Customers</p>
                  <p className="text-2xl font-bold text-warning">{analytics.vipCustomers}</p>
                </div>
                <Star className="w-8 h-8 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-card-foreground">{formatCurrency(analytics.averageOrderValue)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-input text-foreground"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary"
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
      <Card className="bg-card border-border">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Customer Directory</h2>

          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-card-foreground font-medium">{customer.name}</h3>
                      <p className="text-muted-foreground text-sm">{customer.company}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs">{customer.email}</span>
                        <Phone className="w-3 h-3 text-muted-foreground ml-2" />
                        <span className="text-muted-foreground text-xs">{customer.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCustomerTypeColor(customer.customer_type)}`}>
                      {customer.customer_type}
                    </span>
                    <p className="text-card-foreground font-semibold mt-1">{formatCurrency(customer.total_spent)}</p>
                    <p className="text-muted-foreground text-sm">{customer.total_orders} orders</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
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
