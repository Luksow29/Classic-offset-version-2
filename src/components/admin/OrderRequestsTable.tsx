
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@classic-offset/shared';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import RejectReasonModal from './RejectReasonModal';
import ServiceChargeManager from './ServiceChargeManager';
import Card from "@/components/ui/Card";

// Type definitions for order request data
interface ServiceCharge {
  id: string;
  description: string;
  amount: number;
  type: string;
  added_at: string;
}

// Raw service charge from database (may have optional fields)
interface RawServiceCharge {
  id?: string;
  description: string;
  amount: number;
  type?: string;
  added_at?: string;
}

interface RequestData {
  quantity?: number;
  rate?: number;
  totalAmount?: number;
  customerName?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  printType?: string;
  orderType?: string;
  type?: string;
  designNeeded?: boolean;
  deliveryDate?: string;
  notes?: string;
  description?: string;
  productId?: string;
}

interface CustomerInfo {
  name: string;
}

interface OrderRequest {
  id: number;
  created_at: string;
  status: string;
  request_data: RequestData;
  service_charges: ServiceCharge[] | null;
  admin_total_amount: number | null;
  pricing_status: string | null;
  quote_sent_at: string | null;
  quote_response_at: string | null;
  customer: CustomerInfo | null;
  customer_id?: string;
}

// Raw data shape from Supabase query (before normalization)
interface RawOrderRequestData {
  id: number;
  created_at: string;
  status: string;
  request_data: RequestData;
  service_charges: RawServiceCharge[] | null;
  admin_total_amount: number | null;
  pricing_status: string | null;
  quote_sent_at: string | null;
  quote_response_at: string | null;
  customer: CustomerInfo | CustomerInfo[] | null;
  customer_id?: string;
}

const fetchOrderRequests = async (): Promise<OrderRequest[]> => {
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

  // Normalize customer data and backfill service charges
  return ((data || []) as RawOrderRequestData[]).map((item): OrderRequest => ({
    ...item,
    customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
    service_charges: Array.isArray(item.service_charges)
      ? item.service_charges.map((sc: RawServiceCharge): ServiceCharge => ({
        ...sc,
        id: sc.id || `legacy_${Math.random().toString(36).substr(2, 9)}`,
        type: sc.type || 'other',
        added_at: sc.added_at || new Date().toISOString()
      }))
      : null
  }));
};

const OrderRequestsTable = () => {
  const queryClient = useQueryClient();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(null);

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
      const requestData = request.request_data as RequestData;
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
      const serviceCharges = request.service_charges as ServiceCharge[] | null;
      const serviceChargeDescription = Array.isArray(serviceCharges) && serviceCharges.length > 0
        ? serviceCharges.map((c) => c.description).join(', ')
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
          notes: serviceCharges && serviceCharges.length > 0
            ? `Service charges applied: ${serviceCharges.map((charge) => `${charge.description} (₹${charge.amount})`).join(', ')}`
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
    onError: (err: Error) => {
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
    onError: (err: Error) => {
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

  const handleRejectClick = (request: OrderRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  if (isLoading) return <div className="text-center py-10">Loading requests...</div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error loading requests: {(error as Error).message}</div>;

  // formatDate is now imported from @classic-offset/shared

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
          requests.map((req) => {
            const customerName = Array.isArray(req.customer)
              ? req.customer[0]?.name
              : req.customer?.name;
            return (
              <Card key={req.id} className="shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-foreground">{customerName || 'Unknown Customer'}</p>
                    <p className="text-sm text-muted-foreground">
                      {req.request_data.quantity} x {req.request_data.orderType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested on {formatDate(req.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.pricing_status === 'pending' ? 'bg-warning/20 text-warning-foreground' :
                      req.pricing_status === 'quoted' ? 'bg-info/20 text-info' :
                        req.pricing_status === 'accepted' ? 'bg-success/20 text-success' :
                          'bg-muted text-muted-foreground'
                      }`}>
                      {req.pricing_status === 'pending' ? 'Pending Review' :
                        req.pricing_status === 'quoted' ? 'Quote Sent' :
                          req.pricing_status === 'accepted' ? 'Quote Accepted' :
                            req.pricing_status}
                    </span>
                  </div>
                </div>

                <div className="border-t bg-muted/30 p-4">
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
                          <div className="flex justify-between"><dt className="text-muted-foreground">Product:</dt><dd className="font-medium">{req.request_data.productId}</dd></div>
                          <div className="flex justify-between"><dt className="text-muted-foreground">Quantity:</dt><dd>{req.request_data.quantity}</dd></div>
                          <div className="flex justify-between"><dt className="text-muted-foreground">Rate:</dt><dd>{req.request_data.rate ? `₹${req.request_data.rate.toLocaleString()}` : <span className="text-warning font-semibold">Price TBD</span>}</dd></div>
                          <div className="flex justify-between"><dt className="text-muted-foreground">Estimated Amount:</dt><dd className="font-bold">{(() => { const amount = req.request_data.totalAmount || (req.request_data.quantity * req.request_data.rate); return (amount && amount > 0) ? `₹${amount.toLocaleString()}` : <span className="text-warning">Price TBD</span>; })()}</dd></div>
                          <div className="flex justify-between"><dt className="text-muted-foreground">Delivery:</dt><dd>{formatDate(req.request_data.deliveryDate)}</dd></div>
                          <div className="flex justify-between"><dt className="text-muted-foreground">Design:</dt><dd>{req.request_data.designNeeded ? 'Yes' : 'No'}</dd></div>
                        </dl>
                      </div>
                      <div className="space-y-4">
                        {req.request_data.notes && <div><h4 className="font-semibold mb-1">Customer Notes</h4><p className="text-sm bg-warning/10 p-2 rounded border border-warning/20">{req.request_data.notes}</p></div>}

                        {/* Quote Status */}
                        {req.quote_sent_at && (
                          <div>
                            <h4 className="font-semibold mb-1">Quote Status</h4>
                            <p className="text-sm text-info">Quote sent on {formatDate(req.quote_sent_at)}</p>
                            {req.quote_response_at && (
                              <p className="text-sm text-success">
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
                            <Button variant="outline" disabled className="text-info">
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
            );
          })
        )}
      </div>
    </>
  );
};

export default OrderRequestsTable;