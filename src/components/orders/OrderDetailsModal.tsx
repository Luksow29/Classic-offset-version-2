// src/components/orders/OrderDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card'; // FIX: Missing Card component import added
import { Calendar, User, Package, DollarSign, Phone, MapPin, FileText, Clock, Loader2, Pencil, Printer, Truck, CheckCircle } from 'lucide-react';
import { Order } from '@/types/index';
import OrderStatusStepper from './OrderStatusStepper';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

interface OrderDetails extends Order {
  status: string;
  customer_name: string;
  total_amount: number;
  amount_received: number;
  balance_amount: number;
  payment_method: string;
  notes: string | null;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  designer_name?: string;
  design_needed: boolean;
}

interface StatusHistory {
  id: string;
  status: 'Pending' | 'Design' | 'Printing' | 'Delivered';
  updated_by: string;
  updated_at: string;
  notes?: string;
}

const statusIcons = {
    Pending: <Pencil className="w-5 h-5 text-yellow-500" />,
    Design: <Printer className="w-5 h-5 text-blue-500" />,
    Printing: <Truck className="w-5 h-5 text-purple-500" />,
    Delivered: <CheckCircle className="w-5 h-5 text-green-500" />,
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`*, customers (name, phone, email, address)`)
        .eq('id', orderId)
        .single();
      if (orderError) throw orderError;

      const { data: historyData, error: historyError } = await supabase
        .from('order_status_log')
        .select('*')
        .eq('order_id', orderId)
        .order('updated_at', { ascending: false });
      if (historyError) throw historyError;
      
      const { data: designerData, error: designerError } = orderData.designer_id 
        ? await supabase.from('employees').select('name').eq('id', orderData.designer_id).single()
        : { data: null, error: null };
      if (designerError) console.warn("Could not fetch designer name:", designerError.message);

      setOrderDetails({
        ...orderData,
        order_id: orderData.id,
        customer_name: orderData.customers?.name || orderData.customer_name,
        customer_phone: orderData.customers?.phone || orderData.customer_phone,
        customer_email: orderData.customers?.email,
        customer_address: orderData.customers?.address,
        designer_name: designerData?.name,
      });
      setStatusHistory(historyData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order Details #${orderId}`} size="3xl">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center h-64 flex flex-col justify-center items-center text-red-600">
          <p className="font-semibold">Error loading order details</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : orderDetails ? (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-4">
          <section>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-3">Order Status</h3>
            <Card className="p-4">
                <OrderStatusStepper currentStatus={orderDetails.status as any} />
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2"><User className="w-5 h-5 text-primary-500" /> Customer</h3>
                <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-3"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{orderDetails.customer_name}</span></div>
                    {orderDetails.customer_phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /><span>{orderDetails.customer_phone}</span></div>}
                    {orderDetails.customer_address && <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span>{orderDetails.customer_address}</span></div>}
                </Card>
            </div>
            <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2"><Package className="w-5 h-5 text-primary-500" /> Order</h3>
                 <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-3"><Package className="w-4 h-4 text-gray-400" /><span>{orderDetails.order_type} (Qty: {orderDetails.quantity})</span></div>
                    <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-400" /><span>Ordered: {new Date(orderDetails.date).toLocaleDateString('en-GB')}</span></div>
                    <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-gray-400" /><span>Delivery: {new Date(orderDetails.delivery_date).toLocaleDateString('en-GB')}</span></div>
                    {orderDetails.design_needed && <div className="flex items-center gap-3"><Pencil className="w-4 h-4 text-gray-400" /><span>Designer: {orderDetails.designer_name || 'Not Assigned'}</span></div>}
                </Card>
            </div>
          </section>

          <section>
             <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2 mb-3"><DollarSign className="w-5 h-5 text-primary-500" /> Financials</h3>
             <Card className="p-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><p className="text-sm text-gray-500">Total</p><p className="font-bold text-xl">₹{(orderDetails.total_amount || 0).toLocaleString('en-IN')}</p></div>
                    <div><p className="text-sm text-gray-500">Paid</p><p className="font-bold text-xl text-green-600">₹{(orderDetails.amount_received || 0).toLocaleString('en-IN')}</p></div>
                    <div><p className="text-sm text-gray-500">Balance</p><p className={`font-bold text-xl ${orderDetails.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{(orderDetails.balance_amount || 0).toLocaleString('en-IN')}</p></div>
                    <div><p className="text-sm text-gray-500">Method</p><p className="font-bold text-lg">{orderDetails.payment_method || 'N/A'}</p></div>
                 </div>
             </Card>
          </section>
          
          <section>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-primary-500" /> History</h3>
            <Card className="p-4">
              {statusHistory.length > 0 ? (
                <div className="relative space-y-4">
                   <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                   {statusHistory.map((entry) => (
                    <div key={entry.id} className="relative flex items-start gap-4 pl-10">
                       <div className="absolute left-0 top-1.5 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-full ring-4 ring-white dark:ring-gray-800">
                           {statusIcons[entry.status as keyof typeof statusIcons]}
                       </div>
                       <div>
                         <p className="font-medium">{entry.status}</p>
                         <p className="text-xs text-gray-500">by {entry.updated_by} on {new Date(entry.updated_at).toLocaleString('en-GB')}</p>
                       </div>
                    </div>
                   ))}
                </div>
              ) : <p className="text-sm text-center text-gray-500 py-4">No status history found.</p>}
            </Card>
          </section>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={() => window.open(`/invoices/${orderId}`, '_blank')}>View Full Invoice</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default OrderDetailsModal;