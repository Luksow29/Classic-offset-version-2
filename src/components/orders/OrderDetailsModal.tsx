// src/components/orders/OrderDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card'; // FIX: Missing Card component import added
import { Calendar, User, Package, DollarSign, Phone, MapPin, FileText, Clock, Loader2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import OrderStatusStepper from './OrderStatusStepper';
import { OrderTimeline } from '@/shared/order-timeline';
import { useOrderTimeline } from '@/hooks/useOrderTimeline';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

interface OrderDetails extends Order {
  customer_email?: string;
  customer_address?: string;
  designer_name?: string;
  status?: string; // Add status property
  matter_content?: Record<string, any>; // Add matter content
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const {
    events: timelineEvents,
    isLoading: timelineLoading,
    error: timelineError,
    refresh: refreshTimeline,
  } = useOrderTimeline(orderId, { enabled: isOpen });

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

      // Fetch Job Matter if exists
      // Using maybeSingle to avoid 116 error noise, but explicit check
      const { data: matterData, error: matterError } = await supabase
        .from('job_matters')
        .select('content')
        .eq('order_id', orderId)
        .maybeSingle();

      if (matterError) {
        console.error("Error fetching job matter:", matterError);
      }

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
        status: historyData?.[0]?.status || 'Pending', // Get latest status from history
        matter_content: matterData?.content, // Add matter content
      });
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
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-primary-500" /> Activity Timeline</h3>
            <OrderTimeline
              events={timelineEvents}
              isLoading={timelineLoading}
              error={timelineError}
              onRetry={refreshTimeline}
            />
          </section>

          {/* NEW: Job Matter Section */}
          {/* NEW: Job Matter Section */}
          {orderDetails.matter_content && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  <span>Job Specification Content</span>
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded-full dark:bg-primary-900/30 dark:text-primary-300">
                  Ready for Design
                </span>
              </div>

              <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {Object.entries(orderDetails.matter_content).map(([key, value]) => {
                      if (key === 'matter_text' || key === 'reference_files') return null;
                      return (
                        <div key={key} className="flex flex-col">
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-base border-b border-gray-200 dark:border-gray-700 pb-1">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {orderDetails.matter_content.matter_text && (
                  <div className="p-5 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary-500"></span>
                      Full Text / Copy
                    </p>
                    <div className="relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-l-md"></div>
                      <p className="whitespace-pre-wrap text-sm leading-7 font-serif text-gray-700 dark:text-gray-300 pl-4 py-2 italic bg-gray-50/50 dark:bg-gray-900/50 rounded-r-md">
                        {String(orderDetails.matter_content.matter_text)}
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* File Previews */}
              {orderDetails.matter_content.reference_files && Array.isArray(orderDetails.matter_content.reference_files) && orderDetails.matter_content.reference_files.length > 0 && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFiles(!showFiles)}
                    className="w-full mb-4 flex items-center justify-center gap-2"
                  >
                    {showFiles ? 'Hide' : 'Show'} Attached Files ({orderDetails.matter_content.reference_files.length})
                  </Button>

                  {showFiles && (
                    <div className="p-5 border border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {orderDetails.matter_content.reference_files.map((file: any, index: number) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 transition-all overflow-hidden shadow-sm hover:shadow-md"
                          >
                            <div className="w-full h-32 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                              {file.type?.startsWith('image/') ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <FileText className="w-10 h-10 text-gray-400 group-hover:text-primary-500 transition-colors" />
                              )}
                            </div>
                            <div className="w-full p-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center group-hover:text-primary-600">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-gray-400 text-center mt-0.5">
                                {(file.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

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
