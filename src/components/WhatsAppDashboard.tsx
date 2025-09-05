// src/components/WhatsAppDashboard.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Select, { SelectProps } from './ui/Select';
import TextArea, { TextAreaProps } from './ui/TextArea';
import { MessageCircle, Send, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import RealtimeStatus from './ui/RealtimeStatus';
import { useRealtimeWhatsApp } from '@/hooks/useRealtimeWhatsApp';

import { Customer } from '@/types';

interface OrderSummary {
  order_id: number;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  balance_due: number;
  total_amount: number;
  amount_paid: number;
  order_date?: string;
  delivery_date: string;
  status?: string; // status ஐ இங்கே சேர்க்கவும்
  order_type: string;
}
interface OrderDetails {
    quantity: number;
    order_type: string;
}
interface PaymentHistory {
    payment_date: string;
    amount_paid: number;
    payment_method: string;
}
interface FullOrderInfo extends OrderSummary, OrderDetails {}

interface Template { id: string; name: string; category: string; body: string; }

// --- Child Component for Sending Messages ---
const SendMessageUI = ({ allCustomers, templates, onRefresh, initialOrder }) => {
  const { user } = useUser();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [message, setMessage] = useState('');
  const [customerOrders, setCustomerOrders] = useState<OrderSummary[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  
  // Set up realtime WhatsApp monitoring
  const { recentMessages } = useRealtimeWhatsApp((log) => {
    console.log('📱 WhatsApp message logged:', log);
  });
  
  useEffect(() => {
    if (initialOrder) {
      setSelectedCustomerId(initialOrder.customer_id);
      setCustomerOrders([initialOrder]);
      setSelectedOrderId(String(initialOrder.order_id));
      const invoiceTemplate = templates.find(t => t.name.toLowerCase().includes('full invoice details'));
      if (invoiceTemplate) setSelectedTemplate(invoiceTemplate);
    }
  }, [initialOrder, templates]);

  useEffect(() => {
    if (selectedCustomerId && !initialOrder) {
      const fetchCustomerOrders = async () => {
        setIsFetchingData(true);
        setCustomerOrders([]);
        setSelectedOrderId('');
        setSelectedTemplate(null);

        const { data, error } = await supabase
          .from('all_order_summary')
          .select('*')
          .eq('customer_id', selectedCustomerId)
          .order('order_id', { ascending: false });

        if (error) {
          toast.error('Failed to fetch orders for customer.');
        } else {
          setCustomerOrders(data as OrderSummary[]);
        }
        setIsFetchingData(false);
      };
      fetchCustomerOrders();
    }
  }, [selectedCustomerId, initialOrder]);

  useEffect(() => {
    let isActive = true;

    const generateMessage = async () => {
      const customer = allCustomers.find(c => c.id === selectedCustomerId);
      const orderSummary = customerOrders.find(o => o.order_id === parseInt(selectedOrderId));

      if (!selectedTemplate || !orderSummary || !customer) {
        if (isActive) setMessage('');
        return;
      }

      setIsFetchingData(true);
      
      const { data: orderDetailsData, error: orderDetailsError } = await supabase
        .from('orders')
        .select('quantity, order_type')
        .eq('id', orderSummary.order_id)
        .single();

      const { data: paymentHistoryData, error: paymentHistoryError } = await supabase
        .from('payments')
        .select('payment_date, amount_paid, payment_method')
        .eq('order_id', orderSummary.order_id)
        .order('payment_date', { ascending: true });

      if (!isActive) return;

      if (orderDetailsError || paymentHistoryError) {
        console.error("Order Details Error:", orderDetailsError);
        console.error("Payment History Error:", paymentHistoryError);
        toast.error("Failed to fetch full order details.");
        setIsFetchingData(false);
        return;
      }
      
      const fullOrderInfo: FullOrderInfo = { ...orderSummary, ...orderDetailsData };

      let historyText = 'இதுவரை பணம் எதுவும் செலுத்தப்படவில்லை';
      if (paymentHistoryData && paymentHistoryData.length > 0) {
        historyText = paymentHistoryData.map(p => 
          `- ₹${p.amount_paid.toLocaleString('en-IN')} via ${p.payment_method} on ${new Date(p.payment_date).toLocaleDateString('en-GB')}`
        ).join('\n');
      }
      
      const invoiceLink = `${window.location.origin}/invoices/${fullOrderInfo.order_id}`;
      
      // SOLUTION: Combining logic from old and new code
      const variables = {
          customer_name: fullOrderInfo.customer_name,
          order_id: String(fullOrderInfo.order_id),
          order_type: fullOrderInfo.order_type,
          total_amount: fullOrderInfo.total_amount.toLocaleString('en-IN'),
          balance_due: fullOrderInfo.balance_due.toLocaleString('en-IN'),
          delivery_date: fullOrderInfo.delivery_date ? new Date(fullOrderInfo.delivery_date).toLocaleDateString('en-GB') : 'N/A',
          
          // Variables from your old code logic, now added back
          shop_name: 'Classic Offset', // ADDED
          status: fullOrderInfo.status || 'Processing', // ADDED
          payment_amount: fullOrderInfo.amount_paid.toLocaleString('en-IN'), // ADDED for templates like 'Payment Confirmation'
          pickup_date: fullOrderInfo.delivery_date ? new Date(fullOrderInfo.delivery_date).toLocaleDateString('en-GB') : 'N/A', // ADDED

          // Other useful variables from the new logic
          quantity: String(fullOrderInfo.quantity),
          amount_paid: fullOrderInfo.amount_paid.toLocaleString('en-IN'),
          order_date: fullOrderInfo.order_date ? new Date(fullOrderInfo.order_date).toLocaleDateString('en-GB') : 'N/A',
          invoice_link: invoiceLink,
          payment_history: historyText,
          customer_phone: fullOrderInfo.customer_phone,
      };
      
      let finalMessage = selectedTemplate.body;
      Object.entries(variables).forEach(([key, value]) => {
        finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
      });

      if (isActive) {
        setMessage(finalMessage);
        setIsFetchingData(false);
      }
    };

    generateMessage();

    return () => {
      isActive = false;
    };

  }, [selectedOrderId, selectedTemplate, selectedCustomerId, customerOrders, allCustomers]);

  const handleSend = async () => {
    const customer = allCustomers.find(c => c.id === selectedCustomerId);
    if (!customer?.phone || !message) return toast.error('Customer phone or message is missing.');
    const cleanPhone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    
    const { error } = await supabase.from('whatsapp_log').insert({
      customer_id: customer.id, customer_name: customer.name, phone: customer.phone,
      message, template_name: selectedTemplate?.name, sent_by: user?.id,
    });
    if (error) toast.error(`Log failed: ${error.message}`);
    else { toast.success("Message sent and logged!"); onRefresh(); }
  };

  const getOrderLabel = (order: OrderSummary) => {
    let label = `#${order.order_id} - ${order.order_type} (Due: ₹${order.balance_due.toLocaleString('en-IN')})`;
    return label;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card title="Compose Message">
            <div className="p-5 space-y-4">
                <Select id="customer-select" label="1. Select Customer" options={allCustomers.map(c => ({value: c.id, label: `${c.name} (${c.phone})`}))} value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} placeholder="Choose a customer" />
                <Select id="order-select" label="2. Select Order" options={customerOrders.map(o => ({value: o.order_id, label: getOrderLabel(o)}))} value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} disabled={!selectedCustomerId || isFetchingData} placeholder={isFetchingData ? "Loading orders..." : "Choose an order"}/>
                <Select id="template-select" label="3. Select Template" options={templates.map(t => ({value: t.name, label: t.name}))} value={selectedTemplate?.name || ''} onChange={(e) => setSelectedTemplate(templates.find(t => t.name === e.target.value) || null)} disabled={!selectedOrderId} placeholder="Choose a template"/>
                <TextArea id="message-review" label="4. Review Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={12} placeholder="Message will be generated here..." disabled={isFetchingData}/>
                <Button onClick={handleSend} fullWidth variant="success" disabled={!message || isFetchingData}><Send className="w-4 h-4 mr-2"/> Send on WhatsApp</Button>
            </div>
        </Card>
        <Card title="Message Preview">
          <div className="p-5 min-h-[300px] bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            {isFetchingData ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> : <pre className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-sans">{message || "Select customer, order, and template for preview."}</pre>}
          </div>
        </Card>
    </div>
  );
};

// --- Main Dashboard Component ---
const WhatsAppDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [initialOrder, setInitialOrder] = useState<OrderSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(location.search);
      const orderIdFromUrl = params.get('orderId');

      const [customersRes, templatesRes, dueOrdersRes] = await Promise.all([
        supabase.from('customers').select('id, name, phone').order('name'),
        supabase.from('whatsapp_templates').select('*').order('name'),
        supabase.from('all_order_summary').select('*').gt('balance_due', 0) // Fetch all due orders initially
      ]);
      
      const errors = [customersRes.error, templatesRes.error, dueOrdersRes.error].filter(Boolean);
      if (errors.length > 0) throw errors[0];

      setAllCustomers(customersRes.data || []);
      setTemplates(templatesRes.data || []);

      if (orderIdFromUrl) {
        const { data: orderData, error: orderError } = await supabase
          .from('all_order_summary').select('*').eq('order_id', orderIdFromUrl).single();
        if (orderError) throw orderError;
        setInitialOrder(orderData as OrderSummary);
        // We set the initial order, and the UI components will handle the state.
        navigate(location.pathname, { replace: true });
      } else {
        setInitialOrder(null);
      }
    } catch(err: any) {
      toast.error(err.message || "Failed to load dashboard data.");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location.search, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  if (loading) return <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500"/></div>;
  if (error) return <Card className="m-4"><div className="p-4 bg-red-50 text-red-700 rounded-md"><AlertTriangle className="inline w-5 mr-2"/> {error}</div></Card>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <MessageSquare size={28} className="text-green-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">WhatsApp Suite</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Send personalized messages to your customers.</p>
        </div>
        <div className="ml-auto">
          <RealtimeStatus showDetails />
        </div>
      </div>
      <SendMessageUI 
        allCustomers={allCustomers} 
        templates={templates} 
        initialOrder={initialOrder} 
        onRefresh={() => setRefreshKey(k => k + 1)} 
      />
    </div>
  );
};

export default WhatsAppDashboard;