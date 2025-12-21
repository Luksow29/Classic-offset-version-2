
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import RejectReasonModal from './RejectReasonModal';
import ServiceChargeManager from './ServiceChargeManager';
import Card from "@/components/ui/Card";

const fetchOrderRequests = async () => {
  const { data, error } = await supabase
    .from('order_requests')
    .select(`
      id,
      created_at,
      status,
      request_data,
      service_charges,
      admin_total_amount,
      pricing_status,
      quote_sent_at,
      quote_response_at,
      customer:customers (name)
    `)
    .in('pricing_status', ['pending', 'quoted', 'accepted'])
    .neq('status', 'rejected')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

const OrderRequestsTable = () => {
  const queryClient = useQueryClient();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['orderRequests'],
    queryFn: fetchOrderRequests,
  });

  // Realtime subscription for all changes to order requests
  useEffect(() => {
    const channel = supabase.channel('order_request_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_requests' },
        (payload) => {
          console.log('Change detected in order requests!', payload);
          if (payload.eventType === 'INSERT') {
            toast.success('New order request received!');
          } else {
            toast.success('An order request has been updated.');
          }
          queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      // Get the request details first
      const { data: request, error: fetchError } = await supabase
        .from('order_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) throw new Error('Request not found');

      // Extract data from the request
      const requestData = request.request_data as any;
      // Base numbers
      const qty = Number(requestData?.quantity) || 1;
      const rate = Number(requestData?.rate) || 0;
      const originalSubtotal = qty * rate;
      // Prefer admin_total_amount, else provided totalAmount, else compute from qty*rate
      const finalAmount = Number((request.admin_total_amount ?? requestData?.totalAmount ?? originalSubtotal) ?? 0);
      // Map service charges into orders service charge fields used by trigger
      const serviceChargeAmount = Math.max(0, finalAmount - originalSubtotal);
      const hasServiceCharge = serviceChargeAmount > 0;
      const serviceChargeType = hasServiceCharge ? 'custom' : 'none';
      const serviceChargeDescription = Array.isArray(request.service_charges) && request.service_charges.length > 0
        ? request.service_charges.map((c: any) => c.description).join(', ')
        : (hasServiceCharge ? 'Additional charges' : null);

      // Create the order using simple insert
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: request.customer_id,
          customer_name: requestData.customerName || requestData.name || 'Unknown Customer',
          customer_phone: requestData.phoneNumber || requestData.phone || '',
          date: new Date().toISOString().split('T')[0],
          order_type: requestData.printType || requestData.orderType || requestData.type || 'Print Order',
          quantity: qty,
          rate: rate,
          design_needed: requestData.designNeeded || false,
          delivery_date: requestData.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          // Provide fields expected by the totals trigger so it can compute safely
          subtotal: originalSubtotal,
          service_charge_type: serviceChargeType,
          service_charge_value: serviceChargeAmount,
          service_charge_description: serviceChargeDescription || undefined,
          total_amount: finalAmount, // trigger will recalc to subtotal + service_charge_value
          user_id: null, // Admin creates order, not customer (fixes RLS policy)
          notes: request.service_charges && Array.isArray(request.service_charges) && request.service_charges.length > 0
            ? `Service charges applied: ${request.service_charges.map((charge: any) => `${charge.description} (₹${charge.amount})`).join(', ')}`
            : requestData.notes || requestData.description || ''
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update request status
      const { error: updateError } = await supabase
        .from('order_requests')
        .update({
          status: 'approved',
          pricing_status: 'approved'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return newOrder;
    },
    onSuccess: () => {
      toast.success('Order request approved and order created!');
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
    },
    onError: (err: any) => {
      if (err.message.includes('No pending request found')) {
        toast.error('This request has already been processed and is no longer pending.');
      } else {
        toast.error(`Approval failed: ${err.message}`);
      }
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number; reason: string }) => {
      const { error } = await supabase.rpc('reject_order_request', { request_id: requestId, reason: reason });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order request rejected!');
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
      setShowRejectModal(false);
      setSelectedRequest(null);
    },
    onError: (err: any) => {
      if (err.message.includes('No pending request found')) {
        toast.error('This request has already been processed and is no longer pending.');
      } else {
        toast.error(`Rejection failed: ${err.message}`);
      }
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
      setShowRejectModal(false);
      setSelectedRequest(null);
    },
  });

  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  if (isLoading) return <div className="text-center py-10">Loading requests...</div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error loading requests: {(error as Error).message}</div>;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={(reason) => rejectMutation.mutate({ requestId: selectedRequest.id, reason })}
        loading={rejectMutation.isPending}
      />

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
            <AlertTriangle className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No Pending Order Requests</h3>
            <p className="mt-1 text-sm">New requests from the customer portal will appear here in real-time.</p>
          </div>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="font-bold text-lg text-primary-700">{(req.customer as any)?.name || 'Unknown Customer'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {req.request_data.quantity} x {req.request_data.orderType}
                  </p>
                  <p className="text-xs text-gray-500">
                    Requested on {formatDate(req.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.pricing_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    req.pricing_status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                      req.pricing_status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {req.pricing_status === 'pending' ? 'Pending Review' :
                      req.pricing_status === 'quoted' ? 'Quote Sent' :
                        req.pricing_status === 'accepted' ? 'Quote Accepted' :
                          req.pricing_status}
                  </span>
                </div>
              </div>

              <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="space-y-6">
                  {/* Service Charge Manager */}
                  <ServiceChargeManager
                    requestId={req.id}
                    originalAmount={req.request_data.totalAmount || 0}
                    serviceCharges={req.service_charges || []}
                    adminTotalAmount={req.admin_total_amount}
                    pricingStatus={req.pricing_status || 'pending'}
                    onChargesUpdated={() => queryClient.invalidateQueries({ queryKey: ['orderRequests'] })}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Order Details</h4>
                      <dl className="text-sm space-y-2">
                        <div className="flex justify-between"><dt className="text-gray-500">Product:</dt><dd className="font-medium">{req.request_data.productId}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Quantity:</dt><dd>{req.request_data.quantity}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Rate:</dt><dd>{req.request_data.rate ? `₹${req.request_data.rate.toLocaleString()}` : <span className="text-yellow-600 font-semibold">Price TBD</span>}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Estimated Amount:</dt><dd className="font-bold">{(() => { const amount = req.request_data.totalAmount || (req.request_data.quantity * req.request_data.rate); return (amount && amount > 0) ? `₹${amount.toLocaleString()}` : <span className="text-yellow-600">Price TBD</span>; })()}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Delivery:</dt><dd>{formatDate(req.request_data.deliveryDate)}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Design:</dt><dd>{req.request_data.designNeeded ? 'Yes' : 'No'}</dd></div>
                      </dl>
                    </div>
                    <div className="space-y-4">
                      {req.request_data.notes && <div><h4 className="font-semibold mb-1">Customer Notes</h4><p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">{req.request_data.notes}</p></div>}

                      {/* Quote Status */}
                      {req.quote_sent_at && (
                        <div>
                          <h4 className="font-semibold mb-1">Quote Status</h4>
                          <p className="text-sm text-blue-600">Quote sent on {formatDate(req.quote_sent_at)}</p>
                          {req.quote_response_at && (
                            <p className="text-sm text-green-600">
                              Customer responded on {formatDate(req.quote_response_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                        {req.pricing_status === 'pending' && (
                          <Button variant="success" onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve Directly
                          </Button>
                        )}
                        {req.pricing_status === 'accepted' && (
                          <Button variant="success" onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Create Order
                          </Button>
                        )}
                        {req.pricing_status === 'quoted' && (
                          <Button variant="outline" disabled className="text-blue-600">
                            Waiting for Customer Response
                          </Button>
                        )}
                        <Button variant="destructive" onClick={() => handleRejectClick(req)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
};

export default OrderRequestsTable;
