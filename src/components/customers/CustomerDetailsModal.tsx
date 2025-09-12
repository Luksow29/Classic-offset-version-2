import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import { Loader2, AlertTriangle, FileX, MessageSquare, DollarSign, ListOrdered, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import CustomerCommunicationLog from './enhancements/CustomerCommunicationLog'; // Import the new component

// Interface for order data from the view
interface Order {
  order_id: number;
  total_amount: number;
  status?: string;
  date: string;
}

// Interface for payment data
interface Payment {
  id: string;
  order_id: number;
  amount_paid: number;
  payment_method?: string;
  created_at: string;
}

// Interface for WhatsApp log data
interface WhatsappLog {
  id: number;
  phone: string;
  message: string;
  template_name?: string;
  sent_at: string;
}

interface CustomerDetailsModalProps {
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customerId, customerName, isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsappLog[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'whatsapp' | 'communication'>('orders');

  // Add validation for customerId
  if (!customerId || customerId.trim() === '') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Customer Details: ${customerName}`} size="3xl">
        <div className="text-center py-10 text-red-500">
          <p>Invalid Customer ID: "{customerId}"</p>
          <p className="text-sm text-gray-500 mt-2">Please contact support if this issue persists.</p>
        </div>
      </Modal>
    );
  }

  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId || activeTab === 'communication') return;
    
    console.log('=== Fetching customer details ===');
    console.log('Customer ID:', customerId);
    console.log('Customer ID type:', typeof customerId);
    console.log('Customer ID length:', customerId.length);
    console.log('Customer Name:', customerName);
    console.log('Active Tab:', activeTab);
    
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'orders') {
        console.log('Fetching orders for customer ID:', customerId);
        
        // First try with customer_id
        let { data, error: fetchError } = await supabase
          .from('orders')
          .select('id, total_amount, date, customer_id, customer_name, order_type, quantity')
          .eq('customer_id', customerId)
          .eq('is_deleted', false)
          .order('date', { ascending: false });

        // If no results and we have a customer name, try with customer_name
        if ((!data || data.length === 0) && customerName) {
          console.log('No orders found by customer_id, trying customer_name:', customerName);
          const { data: nameData, error: nameError } = await supabase
            .from('orders')
            .select('id, total_amount, date, customer_id, customer_name, order_type, quantity')
            .eq('customer_name', customerName)
            .eq('is_deleted', false)
            .order('date', { ascending: false });
          
          if (!nameError) {
            data = nameData;
            fetchError = null;
          }
        }

        if (fetchError) {
          console.error('Error fetching orders:', fetchError);
          throw fetchError;
        }
        
        console.log('Fetched orders data:', data);
        
        // Get the latest status for each order from order_status_log
        const orderIds = (data || []).map(order => order.id);
        let statusMap: Record<number, string> = {};
        
        if (orderIds.length > 0) {
          const { data: statusData, error: statusError } = await supabase
            .from('order_status_log')
            .select('order_id, status, updated_at')
            .in('order_id', orderIds)
            .order('updated_at', { ascending: false });

          if (!statusError && statusData) {
            // Create a map of order_id to latest status
            statusData.forEach((log) => {
              if (log.order_id && !statusMap[log.order_id]) {
                statusMap[log.order_id] = log.status;
              }
            });
          }
        }
        
        // Transform data to match the expected interface with actual status
        const transformedOrders = (data || []).map(order => ({
          order_id: order.id,
          total_amount: order.total_amount,
          status: statusMap[order.id] || 'Pending', // Use actual status from log or default to Pending
          date: order.date
        }));
        
        setOrders(transformedOrders);
      } else if (activeTab === 'payments') {
        console.log('Fetching payments for customer ID:', customerId);
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select('id, order_id, amount_paid, payment_method, created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching payments:', fetchError);
          throw fetchError;
        }
        
        console.log('Fetched payments data:', data);
        setPayments(data || []);
      } else if (activeTab === 'whatsapp') {
        const { data, error: fetchError } = await supabase
          .from('whatsapp_log')
          .select('id, phone, message, template_name, sent_at')
          .eq('customer_id', customerId)
          .order('sent_at', { ascending: false });

        if (fetchError) throw fetchError;
        setWhatsappLogs(data || []);
      }
    } catch (err: any) {
      console.error(`Error fetching ${activeTab} for customer:`, err);
      // ✅ FIX: Use err.message to display a meaningful error string
      setError(err.message || `An unknown error occurred while fetching ${activeTab}.`);
    } finally {
      setLoading(false);
    }
  }, [customerId, activeTab]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId, activeTab, fetchCustomerDetails]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'printing':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'design':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }
    if (error) {
      return <div className="py-10 text-center text-red-600"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>{error}</p></div>;
    }

    // ... (rest of the render logic is unchanged)

    switch (activeTab) {
      case 'orders':
        return orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500"><FileX className="mx-auto h-10 w-10 mb-2" /><p>No orders found for this customer.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <tr>
                  <th className="px-4 py-2">Order #</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-medium">#{order.order_id}</td>
                    <td className="px-4 py-2">₹{order.total_amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status || 'pending')}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(order.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-2 text-right"><Link to={`/invoices/${order.order_id}`}><Button variant="link" size="sm">View Invoice</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'payments':
        return payments.length === 0 ? (
            <div className="text-center py-10 text-gray-500"><DollarSign className="mx-auto h-10 w-10 mb-2" /><p>No payment records found.</p></div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <tr><th className="px-4 py-2">Payment ID</th><th className="px-4 py-2">Order #</th><th className="px-4 py-2">Amount Paid</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((payment) => (<tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-4 py-2 max-w-xs truncate">{payment.id}</td><td className="px-4 py-2">#{payment.order_id}</td><td className="px-4 py-2">₹{payment.amount_paid.toLocaleString('en-IN')}</td><td className="px-4 py-2">{payment.payment_method || '-'}</td><td className="px-4 py-2">{new Date(payment.created_at).toLocaleDateString('en-GB')}</td></tr>))}
                </tbody>
            </table>
            </div>
        );
      case 'whatsapp':
        return whatsappLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-500"><MessageSquare className="mx-auto h-10 w-10 mb-2" /><p>No WhatsApp logs found.</p></div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <tr><th className="px-4 py-2">Phone</th><th className="px-4 py-2">Message</th><th className="px-4 py-2">Template</th><th className="px-4 py-2">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {whatsappLogs.map((log) => (<tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-4 py-2">{log.phone}</td><td className="px-4 py-2 max-w-xs truncate">{log.message}</td><td className="px-4 py-2">{log.template_name || '-'}</td><td className="px-4 py-2">{new Date(log.sent_at).toLocaleDateString('en-GB')}</td></tr>))}
                </tbody>
            </table>
            </div>
        );
      case 'communication':
        return <CustomerCommunicationLog customerId={customerId} />;
      default:
        return null;
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Customer Details: ${customerName}`} size="3xl">
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === 'orders' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('orders')}><ListOrdered size={16} /> Orders</button>
          <button className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === 'payments' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('payments')}><DollarSign size={16} /> Payments</button>
          <button className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === 'whatsapp' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('whatsapp')}><MessageSquare size={16} /> WhatsApp Logs</button>
          <button className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === 'communication' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('communication')}><ClipboardList size={16} /> Communication Log</button>
        </nav>
      </div>
      <div>{renderContent()}</div>
    </Modal>
  );
};

export default CustomerDetailsModal;
