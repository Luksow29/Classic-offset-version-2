
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import RejectReasonModal from './RejectReasonModal';
import Card from "@/components/ui/Card";

const fetchOrderRequests = async () => {
  const { data, error } = await supabase
    .from('order_requests')
    .select(`
      id,
      created_at,
      status,
      request_data,
      customer:customers (name)
    `)
    .in('status', ['pending', 'pending_approval'])
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
      const { error } = await supabase.rpc('approve_order_request', { request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order request approved!');
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
    mutationFn: async ({ requestId, reason }: { requestId: number; reason:string }) => {
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
                </div>
                
                  <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <h4 className="font-semibold mb-2">Details</h4>
                              <dl className="text-sm space-y-2">
                                  <div className="flex justify-between"><dt className="text-gray-500">Product:</dt><dd className="font-medium">{req.request_data.productId}</dd></div>
                                  <div className="flex justify-between"><dt className="text-gray-500">Rate:</dt><dd>₹{req.request_data.rate?.toLocaleString()}</dd></div>
                                  <div className="flex justify-between"><dt className="text-gray-500">Total:</dt><dd className="font-bold">₹{req.request_data.totalAmount?.toLocaleString()}</dd></div>
                                  <div className="flex justify-between"><dt className="text-gray-500">Delivery:</dt><dd>{formatDate(req.request_data.deliveryDate)}</dd></div>
                                  <div className="flex justify-between"><dt className="text-gray-500">Design:</dt><dd>{req.request_data.designNeeded ? 'Yes' : 'No'}</dd></div>
                              </dl>
                          </div>
                          <div className="space-y-4">
                            {req.request_data.notes && <div><h4 className="font-semibold mb-1">Notes</h4><p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">{req.request_data.notes}</p></div>}
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="success" onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                </Button>
                                <Button variant="destructive" onClick={() => handleRejectClick(req)} disabled={rejectMutation.isPending}>
                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                </Button>
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
