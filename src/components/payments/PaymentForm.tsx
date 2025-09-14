import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/activityLogger';
import { db } from '@/lib/firebaseClient'; // Import Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import { Customer } from '@/types';

interface Order {
  id: number;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  amount_received: number;
  balance_amount: number; 
}

interface PaymentFormProps {
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
  const { user, userProfile } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    orderId: '',
    totalAmount: '',
    amountPaid: '',
    dueDate: '',
    status: 'Due',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: customersData, error: customersError } = await supabase.from('customers').select('id, name, phone').order('name');
        if (customersError) throw customersError;
        
        // Convert the partial customer data to the full Customer interface by adding default values
        const customers = (customersData || []).map(customer => ({
          ...customer,
          email: null,
          address: null,
          joined_date: null,
          created_at: new Date().toISOString(),
          total_orders: null,
          total_spent: null,
          last_interaction: null,
          updated_at: null,
          billing_address: null,
          shipping_address: null,
          birthday: null,
          secondary_phone: null,
          company_name: null,
          tags: null,
          user_id: null,
          customer_type: null,
          communication_preference: null,
          notes: null,
          last_interaction_date: null,
          follow_up_date: null,
          customer_since: null,
          total_lifetime_value: null,
          loyalty_points: null,
          loyalty_tier_id: null,
          referral_code: null,
          total_points_earned: null,
          total_points_spent: null,
          tier_upgraded_at: null
        } as Customer));
        
        setCustomers(customers);

        const { data: ordersData, error: ordersError } = await supabase.from('order_summary_with_dues').select('order_id, customer_id, customer_name, total_amount, amount_paid, balance_due').gt('balance_due', 0).order('order_id', { ascending: false });
        if (ordersError) throw ordersError;

        const processedOrders = (ordersData || []).map(o => ({
            id: o.order_id,
            customer_id: o.customer_id,
            customer_name: o.customer_name,
            total_amount: o.total_amount,
            amount_received: o.amount_paid,
            balance_amount: o.balance_due,
        }));
        setOrders(processedOrders);
      } catch (err: any) {
        setError("Failed to load initial data. Please refresh the page.");
        console.error('Error fetching initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setFormData({ ...formData, customerId, orderId: '', totalAmount: '', amountPaid: '' });
    setSelectedOrder(null);
    setFilteredOrders(customerId ? orders.filter(order => order.customer_id === customerId) : []);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderIdStr = e.target.value;
    const orderId = orderIdStr ? parseInt(orderIdStr, 10) : null;
    
    setFormData(prev => ({ ...prev, orderId: orderIdStr, totalAmount: '', amountPaid: '' }));

    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setFormData(prev => ({ ...prev, totalAmount: String(order.total_amount || 0), amountPaid: '' }));
      }
    } else {
      setSelectedOrder(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const calculateStatus = (totalAmount: number, amountPaid: number): string => {
    if (amountPaid >= totalAmount) return 'Paid';
    if (amountPaid > 0) return 'Partial';
    return 'Due';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOrder) {
      setError("User and order must be selected.");
      return;
    }
    setLoading(true);
    setError(null);
    
    const amountPaid = parseFloat(formData.amountPaid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
        setError("Please enter a valid payment amount.");
        setLoading(false);
        return;
    }

    try {
      const paymentData = { /* ... payment data ... */ };
      const { error: paymentError } = await supabase.from('payments').insert([{
        customer_id: formData.customerId,
        order_id: parseInt(formData.orderId),
        total_amount: selectedOrder.total_amount || 0,
        amount_paid: amountPaid,
        due_date: formData.dueDate || null,
        status: calculateStatus(selectedOrder.total_amount, amountPaid),
        payment_date: formData.paymentDate,
        created_by: user.id,
        payment_method: formData.paymentMethod,
        notes: formData.notes || null,
      }]);
      if (paymentError) throw paymentError;

      const newAmountReceived = (selectedOrder.amount_received || 0) + amountPaid;
      const { error: orderUpdateError } = await supabase.from('orders').update({
        amount_received: newAmountReceived,
        balance_amount: (selectedOrder.total_amount || 0) - newAmountReceived,
      }).eq('id', selectedOrder.id);
      if (orderUpdateError) throw orderUpdateError;

      toast.success('Payment recorded successfully!');
      const userName = userProfile?.name || 'Admin';

      // Log activity
      const activityMessage = `Received a payment of ₹${amountPaid.toLocaleString('en-IN')} for Order #${selectedOrder.id} from ${selectedOrder.customer_name}.`;
      await logActivity(activityMessage, userName);

      // ✅ Create notification
      await addDoc(collection(db, "notifications"), {
          message: `Payment of ₹${amountPaid.toLocaleString('en-IN')} received for Order #${selectedOrder.id}.`,
          type: 'payment',
          relatedId: selectedOrder.id,
          timestamp: serverTimestamp(),
          read: false,
          triggeredBy: userName,
      });

      onSuccess();
      setFormData({ customerId: '', orderId: '', totalAmount: '', amountPaid: '', dueDate: '', status: 'Due', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
      setSelectedOrder(null);
      setFilteredOrders([]);

    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment. Please try again.');
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Record New Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}
        <Select id="customerId" label="Customer *" value={formData.customerId} onChange={handleCustomerChange} options={customers.map(c => ({ value: c.id, label: `${c.name}${c.phone ? ` (${c.phone})` : ''}` }))} placeholder="Select a customer" required disabled={loading} />
        <Select id="orderId" label="Order *" value={formData.orderId} onChange={handleOrderChange} options={filteredOrders.map(o => ({ value: String(o.id), label: `Order #${o.id} - Due: ₹${o.balance_amount.toLocaleString('en-IN')}` }))} placeholder="Select an order" required disabled={!formData.customerId || loading} />
        {selectedOrder && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Order Details</h4>
            
            {/* Service Charge Breakdown if applicable */}
            {selectedOrder.subtotal && selectedOrder.service_charge_amount > 0 ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Subtotal:</span>
                  <span className="font-semibold">₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    Service Charge ({selectedOrder.service_charge_description || 'Additional Fee'}):
                  </span>
                  <span className="font-semibold">₹{(selectedOrder.service_charge_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <hr className="border-blue-200 dark:border-blue-600" />
                <div className="flex justify-between font-bold">
                  <span className="text-blue-700 dark:text-blue-300">Total:</span>
                  <span>₹{(selectedOrder.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div><span className="text-blue-700 dark:text-blue-300">Paid:</span><div className="font-semibold text-green-600">₹{(selectedOrder.amount_received || 0).toLocaleString('en-IN')}</div></div>
                  <div><span className="text-blue-700 dark:text-blue-300">Due:</span><div className="font-semibold text-red-600">₹{(selectedOrder.balance_amount || 0).toLocaleString('en-IN')}</div></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-blue-700 dark:text-blue-300">Total:</span><div className="font-semibold">₹{(selectedOrder.total_amount || 0).toLocaleString('en-IN')}</div></div>
                <div><span className="text-blue-700 dark:text-blue-300">Paid:</span><div className="font-semibold text-green-600">₹{(selectedOrder.amount_received || 0).toLocaleString('en-IN')}</div></div>
                <div><span className="text-blue-700 dark:text-blue-300">Due:</span><div className="font-semibold text-red-600">₹{(selectedOrder.balance_amount || 0).toLocaleString('en-IN')}</div></div>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="totalAmount" label="Total Amount (₹)" type="number" value={formData.totalAmount} onChange={handleInputChange} disabled required placeholder="Total order amount" />
          <Input id="amountPaid" label="Amount Being Paid (₹) *" type="number" value={formData.amountPaid} onChange={handleInputChange} required disabled={loading || !selectedOrder} placeholder="Amount being paid now" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="paymentDate" label="Payment Date *" type="date" value={formData.paymentDate} onChange={handleInputChange} required disabled={loading} />
          <Select id="paymentMethod" label="Payment Method" value={formData.paymentMethod} onChange={handleInputChange} options={[{ value: 'Cash', label: 'Cash' }, { value: 'UPI', label: 'UPI' }, { value: 'Bank Transfer', label: 'Bank Transfer' }]} disabled={loading} />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea id="notes" value={formData.notes} onChange={handleInputChange} disabled={loading} rows={3} className="w-full px-3 py-2 border rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" placeholder="Payment notes..."/>
        </div>
        <Button type="submit" variant="primary" disabled={loading || !selectedOrder} className="w-full">{loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Recording...</> : 'Record Payment'}</Button>
      </form>
    </Card>
  );
};

export default PaymentForm;
