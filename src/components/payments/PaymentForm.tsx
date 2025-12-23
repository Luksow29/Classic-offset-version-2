import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import {
  Loader2, AlertCircle, CheckCircle2, User,
  ShoppingBag, CreditCard, Calendar, FileText,
  Banknote, Wallet, Building2, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/activityLogger';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Customer } from '@/types';
import { hasAnyStaffRole } from '@/lib/rbac';

interface Order {
  id: number;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  amount_received: number;
  balance_amount: number;
  subtotal?: number | null;
  service_charge_type?: string | null;
  service_charge_value?: number | null;
  service_charge_amount?: number | null;
  service_charge_description?: string | null;
}

interface PaymentFormProps {
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
  const { user, userProfile } = useUser();
  const canRecordPayment = hasAnyStaffRole(userProfile?.role, ['owner', 'manager', 'office']);
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
    if (!canRecordPayment) return;
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: customersData, error: customersError } = await supabase.from('customers').select('id, name, phone').order('name');
        if (customersError) throw customersError;

        const customers = (customersData || []).map(customer => ({
          ...customer,
          // Fill required Customer fields with nulls/defaults
          email: null, address: null, joined_date: null, created_at: new Date().toISOString(),
          total_orders: null, total_spent: null, last_interaction: null, updated_at: null,
          billing_address: null, shipping_address: null, birthday: null, secondary_phone: null,
          company_name: null, tags: null, user_id: null, customer_type: null,
          communication_preference: null, notes: null, last_interaction_date: null,
          follow_up_date: null, customer_since: null, total_lifetime_value: null,
          loyalty_points: null, loyalty_tier_id: null, referral_code: null,
          total_points_earned: null, total_points_spent: null, tier_upgraded_at: null
        } as Customer));

        setCustomers(customers);

        const { data: ordersData, error: ordersError } = await supabase
          .from('order_summary_with_dues')
          .select('order_id, customer_id, customer_name, total_amount, amount_paid, balance_due')
          .gt('balance_due', 0)
          .order('order_id', { ascending: false });

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
  }, [canRecordPayment]);

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
    if (!canRecordPayment) {
      toast.error('Permission denied: You do not have access to record payments.');
      return;
    }
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

      // Create notification
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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash': return <Banknote className="w-4 h-4" />;
      case 'UPI': return <Smartphone className="w-4 h-4" />;
      case 'Bank Transfer': return <Building2 className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  if (!canRecordPayment) {
    return (
      <Card className="border-l-4 border-l-destructive shadow-sm">
        <div className="p-6 flex items-center gap-4 text-destructive">
          <AlertCircle size={24} />
          <div>
            <h3 className="font-semibold text-lg">Access Denied</h3>
            <p className="text-sm opacity-90">Only Owner, Manager, or Office staff can record payments.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-md border-t-4 border-t-primary transition-all hover:shadow-lg">
      <div className="p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-full text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Record New Payment</h2>
            <p className="text-sm text-muted-foreground">Enter transaction details below</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        {/* Section 1: Link to Order */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User size={14} /> Customer & Order
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Select
                id="customerId"
                label="Select Customer"
                value={formData.customerId}
                onChange={handleCustomerChange}
                options={customers.map(c => ({ value: c.id, label: `${c.name}${c.phone ? ` (${c.phone})` : ''}` }))}
                placeholder="Choose Customer..."
                required
                disabled={loading}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Select
                id="orderId"
                label="Select Order"
                value={formData.orderId}
                onChange={handleOrderChange}
                options={filteredOrders.map(o => ({ value: String(o.id), label: `Order #${o.id} • Due: ₹${o.balance_amount.toLocaleString('en-IN')}` }))}
                placeholder={!formData.customerId ? "Select customer first" : "Choose Order..."}
                required
                disabled={!formData.customerId || loading}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Order Context Summary */}
        {selectedOrder && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 overlow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-primary/10 flex justify-between items-center bg-primary/10">
              <div className="flex items-center gap-2 text-primary font-medium">
                <ShoppingBag size={16} />
                <span>Order Details #{selectedOrder.id}</span>
              </div>
              <div className="text-xs bg-background/50 px-2 py-1 rounded text-primary">
                Due Balance
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Total Amount</span>
                <div className="font-bold text-lg text-foreground">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Already Paid</span>
                <div className="font-bold text-lg text-emerald-600">₹{selectedOrder.amount_received.toLocaleString('en-IN')}</div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Current Balance</span>
                <div className="font-bold text-lg text-destructive">₹{selectedOrder.balance_amount.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Payment Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Wallet size={14} /> Payment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="amountPaid"
              label="Payment Amount (₹)"
              type="number"
              value={formData.amountPaid}
              onChange={handleInputChange}
              required
              disabled={loading || !selectedOrder}
              placeholder="0.00"
              className="text-lg font-semibold"
            />
            <Select
              id="paymentMethod"
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Card', label: 'Card' }
              ]}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="paymentDate"
              label="Payment Date"
              type="date"
              value={formData.paymentDate}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
            <div className="pt-1">
              {/* Spacer or additional field could go here */}
              <div className="h-full flex items-center text-xs text-muted-foreground italic px-2">
                Recording this payment will update the order status and balance automatically.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText size={14} /> Payment Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={handleInputChange}
            disabled={loading}
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-lg shadow-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            placeholder="Add any relevant details (Reference #, Transaction ID...)"
          />
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-border/50">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !selectedOrder}
            className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.99] transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Record Payment
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            This action triggers an automatic notification to the admin panel.
          </p>
        </div>
      </form>
    </Card>
  );
};

export default PaymentForm;
