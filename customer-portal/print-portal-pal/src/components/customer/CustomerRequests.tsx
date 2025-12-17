import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ListCollapse } from 'lucide-react';

interface Customer {
    id: string;
    user_id: string;
    name: string;
    phone: string;
}

interface CustomerRequestsProps {
    customer: Customer;
}

interface OrderRequest {
    id: number;
    created_at: string;
    status: string;
    rejection_reason: string | null;
    request_data: {
        orderType: string;
        quantity: number;
        totalAmount?: number;
        estimatedTotal?: number;
    };
}

const RequestStatusBadge = ({ status }: { status?: string }) => {
    const statusConfig = {
        pending_approval: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
        approved: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
        rejected: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };
    const config = (status ? statusConfig[status as keyof typeof statusConfig] : undefined) || { className: 'bg-gray-100 text-gray-800', label: status || 'unknown' };
    return (
        <Badge variant="outline" className={`capitalize ${config.className}`}>
            {config.label}
        </Badge>
    );
};

const CustomerRequests: React.FC<CustomerRequestsProps> = ({ customer }) => {
    const [requests, setRequests] = useState<OrderRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!customer?.id) return; // wait until customer is available
        const fetchRequests = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('order_requests')
                .select('*')
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: false });

            if (data) setRequests(data.map((req: any) => {
                // Safely normalize request_data
                let rd: any = req.request_data;
                try {
                    if (typeof rd === 'string') rd = JSON.parse(rd);
                } catch {
                    rd = {};
                }
                if (!rd || typeof rd !== 'object' || Array.isArray(rd)) rd = {};
                return {
                    ...req,
                    request_data: rd,
                };
            }));
            if (error) console.error("Error fetching requests:", error);
            setLoading(false);
        };
        fetchRequests();

        const channel = supabase.channel(`customer_requests_${customer.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'order_requests', filter: `customer_id=eq.${customer.id}` },
                () => fetchRequests()
            ).subscribe();

        return () => { supabase.removeChannel(channel); };

    }, [customer?.id]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListCollapse size={20} />
                        Your Recent Requests
                    </CardTitle>
                    <CardDescription>A list of your recent order requests and their real-time status.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!customer?.id ? (
                        <div className="text-center py-8 text-muted-foreground"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>Loading customer…</p></div>
                    ) : loading ? (
                        <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>You have no pending requests.</p></div>
                    ) : (
                        <ul className="space-y-4">
                            {requests.map(req => (
                                <li key={req.id} className="p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold flex items-center gap-2">
                                                Request #{req.id}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {new Date(req.created_at || '').toString() === 'Invalid Date' ? '-' : new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </p>
                                            <p className="text-sm text-foreground mt-1">{Number((req.request_data as any)?.quantity ?? 0)} x {(req.request_data as any)?.orderType || '-'}</p>
                                            <p className="text-xs font-bold text-primary mt-0.5">
                                                {Number((req.request_data as any)?.totalAmount ?? 0) > 0
                                                    ? `₹${Number((req.request_data as any)?.totalAmount ?? 0).toLocaleString('en-IN')}`
                                                    : (Number((req.request_data as any)?.estimatedTotal ?? 0) > 0 ? `Est. ₹${Number((req.request_data as any)?.estimatedTotal ?? 0).toLocaleString('en-IN')}` : 'Price TBD')}
                                            </p>
                                        </div>
                                        <RequestStatusBadge status={req.status} />
                                    </div>
                                    {req.status === 'rejected' && req.rejection_reason && (
                                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-900/10 dark:border-red-800/30">
                                            <strong>Reason for rejection:</strong> {req.rejection_reason}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerRequests;
