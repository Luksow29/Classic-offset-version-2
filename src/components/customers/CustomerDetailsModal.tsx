// src/components/customers/CustomerDetailsModal.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import { Loader2, AlertTriangle, MessageSquare, DollarSign, ListOrdered, ClipboardList, Phone, Mail, MapPin, ShoppingBag, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import CustomerCommunicationLog from './enhancements/CustomerCommunicationLog';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface Order {
  order_id: number;
  total_amount: number;
  status?: string;
  date: string;
  quantity: number;
  order_type: string;
}

interface Payment {
  id: string;
  order_id: number;
  amount_paid: number;
  payment_method?: string;
  created_at: string;
}

interface WhatsappLog {
  id: number;
  phone: string;
  message: string;
  template_name?: string;
  sent_at: string;
}

interface CustomerDetails {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  joined_date: string | null;
  total_orders: number | null;
  balance_due: number | null;
  tags: string[] | null;
}

interface CustomerDetailsModalProps {
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customerId, customerName, isOpen, onClose }) => {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsappLog[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'communication'>('orders');

  const fetchCustomerData = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Basic Info
      const { data: custData, error: custError } = await supabase
        .from('customer_summary')
        .select('*')
        .eq('id', customerId)
        .single();

      if (custError && custError.code !== 'PGRST116') throw custError;
      setCustomer(custData || { name: customerName, id: customerId } as any);

      // 2. Fetch Orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount, date, order_type, quantity') // Removed status
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (orderError) throw orderError;

      const formattedOrders = (orderData || []).map(o => ({
        order_id: o.id,
        total_amount: o.total_amount,
        date: o.date,
        quantity: o.quantity,
        order_type: o.order_type
      }));
      setOrders(formattedOrders);

      // 3. Fetch Payments
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (payError) throw payError;
      setPayments(payData || []);

      // 4. Fetch WhatsApp
      const { data: waData } = await supabase
        .from('whatsapp_log')
        .select('*')
        .eq('customer_id', customerId)
        .order('sent_at', { ascending: false });
      setWhatsappLogs(waData || []);

    } catch (err: any) {
      console.error("Error loading details:", err);
      setError(err.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (isOpen) fetchCustomerData();
  }, [isOpen, fetchCustomerData]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile" size="3xl">
      <div className="flex flex-col lg:flex-row h-[600px] bg-gray-50 dark:bg-gray-900/50 -m-6 rounded-b-xl overflow-hidden">

        {/* Sidebar - Profile Info */}
        <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-700">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">{customerName}</h2>
            {customer?.tags && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {customer.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</h3>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Phone size={16} className="text-gray-400" />
                <span>{customer?.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Mail size={16} className="text-gray-400" />
                <span>{customer?.email || 'No email'}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <span>{customer?.address || 'No address provided'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financials</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500">Balance Due</p>
                  <p className={`font-bold ${(customer?.balance_due || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{(customer?.balance_due || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {orders.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Tabs */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800/50">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 bg-white dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <ShoppingBag size={16} /> Orders
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <CreditCard size={16} /> Payments
            </button>
            <button
              onClick={() => setActiveTab('communication')}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'communication' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <MessageSquare size={16} /> Communication
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-red-500 flex flex-col items-center justify-center h-full">
                <AlertTriangle className="w-8 h-8 mb-2" />
                {error}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      {orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No orders found</div>
                      ) : orders.map(order => (
                        <div key={order.order_id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm">
                              #{order.order_id}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{order.order_type}</p>
                              <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">₹{order.total_amount.toLocaleString()}</p>
                            {/* <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status || '')}`}>
                              {order.status}
                            </span> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'payments' && (
                    <div className="space-y-4">
                      {payments.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No payments found</div>
                      ) : payments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                              <DollarSign size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">Payment for #{payment.order_id}</p>
                              <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">₹{payment.amount_paid.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{payment.payment_method}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'communication' && (
                    <div className="space-y-6">
                      <CustomerCommunicationLog customerId={customerId} />

                      {whatsappLogs.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3">WhatsApp History</h4>
                          <div className="space-y-3">
                            {whatsappLogs.map(log => (
                              <div key={log.id} className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-bold text-green-700">WhatsApp</span>
                                  <span className="text-xs text-gray-400">{new Date(log.sent_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{log.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerDetailsModal;
