
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  ChevronsUpDown,
  AlertTriangle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceChargeDisplay from "./ServiceChargeDisplay";
import OrderChat from "@/components/chat/OrderChat";
import { OrderTimeline } from "@shared/order-timeline";
import { useOrderTimeline } from "@/hooks/useOrderTimeline";

interface DisplayOrder {
  id: number;
  date: string;
  order_type: string;
  quantity: number;
  total_amount: number;
  amount_received: number;
  balance_amount: number;
  delivery_date: string;
  notes: string | null;
  status: string;
  rejection_reason?: string | null;
  is_request: boolean;
  service_charges?: any[];
  pricing_status?: string;
  original_amount?: number;
  quote_sent_at?: string;
}

interface CustomerOrdersProps {
  customerId: string;
  onQuickReorder?: (order: any) => void;
}

const OrderCardSkeleton = () => (
    <Card>
        <CardContent className="p-4">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
        </CardContent>
    </Card>
);


import { RefreshCw } from "lucide-react";

const OrderActivityTimeline = ({ orderId }: { orderId: number }) => {
  const { events, isLoading, error, refresh } = useOrderTimeline(orderId, { enabled: Boolean(orderId) });

  return (
    <OrderTimeline
      events={events}
      isLoading={isLoading}
      error={error}
      onRetry={refresh}
      title="Order Activity"
      emptyMessage="No updates recorded for this order yet."
    />
  );
};

export default function CustomerOrders({ customerId, onQuickReorder }: CustomerOrdersProps) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(orders.length / pageSize);
  // Sorting
  const [sortKey, setSortKey] = useState<'date'|'total_amount'|'status'>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  // Filtering (status)
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchOrdersAndHistory();
    fetchProducts();
  }, [customerId]);

  // Fetch all products for mapping product info to orders
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('id, name, category');
    if (!error && data) setProducts(data);
  };

  const fetchOrdersAndHistory = async () => {
    setIsLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase.from("orders").select("*").eq("customer_id", customerId).order("date", { ascending: false });
      if (ordersError) throw ordersError;
      
      // Fetch rejected requests with service charge information
      const { data: rejectedRequests, error: requestsError } = await supabase
        .from("order_requests")
        .select("id, created_at, request_data, rejection_reason, service_charges, admin_total_amount, pricing_status, quote_sent_at, quote_response_at")
        .eq("customer_id", customerId)
        .eq("status", "rejected");
      if (requestsError) throw requestsError;
      
      // Fetch pending and quoted requests with service charge information
      const { data: pendingRequests, error: pendingError } = await supabase
        .from("order_requests")
        .select("id, created_at, request_data, status, service_charges, admin_total_amount, pricing_status, quote_sent_at, quote_response_at")
        .eq("customer_id", customerId)
        .in("status", ["pending", "pending_approval", "quoted", "accepted"]);
      if (pendingError) throw pendingError;
      
      const mappedRejected = rejectedRequests.map(req => {
        const data = typeof req.request_data === 'object' && req.request_data !== null ? req.request_data as Record<string, any> : {};
        const serviceCharges = Array.isArray(req.service_charges) ? req.service_charges : [];
        const originalAmount = data.totalAmount ?? 0;
        const finalAmount = req.admin_total_amount ?? originalAmount;
        
        return {
          id: req.id,
          date: req.created_at,
          order_type: data.orderType ?? '',
          quantity: data.quantity ?? 0,
          total_amount: finalAmount,
          original_amount: originalAmount,
          amount_received: 0,
          balance_amount: finalAmount,
          delivery_date: data.deliveryDate ?? '',
          notes: data.notes ?? '',
          status: 'Rejected',
          rejection_reason: req.rejection_reason,
          is_request: true,
          service_charges: serviceCharges,
          pricing_status: req.pricing_status || 'rejected',
          quote_sent_at: req.quote_sent_at,
        };
      });

      const mappedPending = pendingRequests.map(req => {
        const data = typeof req.request_data === 'object' && req.request_data !== null ? req.request_data as Record<string, any> : {};
        const serviceCharges = Array.isArray(req.service_charges) ? req.service_charges : [];
        const originalAmount = data.totalAmount ?? 0;
        const finalAmount = req.admin_total_amount ?? originalAmount;
        
        return {
          id: req.id,
          date: req.created_at,
          order_type: data.orderType ?? '',
          quantity: data.quantity ?? 0,
          total_amount: finalAmount,
          original_amount: originalAmount,
          amount_received: 0,
          balance_amount: finalAmount,
          delivery_date: data.deliveryDate ?? '',
          notes: data.notes ?? '',
          status: req.status === 'quoted' ? 'Quote Received' : 
                  req.status === 'accepted' ? 'Quote Accepted' : 'Pending Review',
          is_request: true,
          service_charges: serviceCharges,
          pricing_status: req.pricing_status || 'pending',
          quote_sent_at: req.quote_sent_at,
        };
      });

      // Only query history if we actually have order IDs
      const orderIds = (ordersData || []).map(order => order.id);
      let historyData: any[] | null = [];
      if (orderIds.length > 0) {
        const { data: hData, error: historyError } = await supabase
          .from("order_status_log")
          .select("*")
          .in("order_id", orderIds);
        if (historyError) throw historyError;
        historyData = hData;
      } else {
        historyData = [];
      }
      
      const latestStatuses: { [key:number]: { status: string; updated_at: string } } = {};

      if (historyData) {
        historyData.forEach(log => {
          if (!log.order_id) return;
          const existing = latestStatuses[log.order_id];
          const currentUpdatedAt = log.updated_at ? new Date(log.updated_at).getTime() : 0;
          const existingUpdatedAt = existing?.updated_at ? new Date(existing.updated_at).getTime() : -1;
          if (!existing || currentUpdatedAt > existingUpdatedAt) {
            latestStatuses[log.order_id] = {
              status: log.status,
              updated_at: log.updated_at || new Date(0).toISOString(),
            };
          }
        });
      }
      
      const ordersWithStatus: DisplayOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        date: order.date || order.created_at || new Date().toISOString(),
        order_type: order.order_type || "",
        quantity: Number((order as any).quantity ?? 0),
        total_amount: Number((order as any).total_amount ?? 0),
        amount_received: Number((order as any).amount_received ?? 0),
        balance_amount: Number((order as any).balance_amount ?? (Number((order as any).total_amount ?? 0) - Number((order as any).amount_received ?? 0))),
        delivery_date: (order as any).delivery_date || "",
        notes: (order as any).notes ?? "",
        status: latestStatuses[order.id]?.status || "Pending",
        is_request: false,
      }));

      const combinedList = [...ordersWithStatus, ...mappedRejected, ...mappedPending].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOrders(combinedList);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch order history." });
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Pending": { 
        icon: Clock, 
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/50" 
      },
      "Pending Review": { 
        icon: Clock, 
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/50" 
      },
      "In Progress": { 
        icon: Package, 
        className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50" 
      },
      "Completed": { 
        icon: CheckCircle, 
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50" 
      },
      "Delivered": { 
        icon: Truck, 
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50" 
      },
      "Quote Received": { 
        icon: AlertTriangle, 
        className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50" 
      },
      "Quote Accepted": { 
        icon: CheckCircle, 
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50" 
      },
      "Rejected": { 
        icon: XCircle, 
        className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50" 
      },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["Pending"];
    const Icon = config.icon;
    return (
      <Badge className={`flex items-center space-x-1 whitespace-nowrap border ${config.className}`}>
        <Icon className="h-3 w-3" />
        <span>{status}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const formatCurrency = (val: any) => Number(val ?? 0).toLocaleString('en-IN');

  // Sorting/filtering logic
  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortKey === 'date') {
      return sortDir === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortKey === 'total_amount') {
      return sortDir === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
    } else if (sortKey === 'status') {
      return sortDir === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
    }
    return 0;
  });
  const pagedOrders = sortedOrders.slice((page-1)*pageSize, page*pageSize);

  if (isLoading) return (
      <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
      </div>
  );

  if (orders.length === 0) return (
      <Card><CardContent className="py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('orders.none_found')}</h3>
          <p className="text-muted-foreground">{t('orders.none_desc')}</p>
      </CardContent></Card>
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{t('orders.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('orders.count', { count: orders.length })}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm">{t('orders.sort_by')}</label>
            <select className="border rounded px-2 py-1 text-sm" value={sortKey} onChange={e => setSortKey(e.target.value as any)}>
              <option value="date">{t('orders.sort_date')}</option>
              <option value="total_amount">{t('orders.sort_amount')}</option>
              <option value="status">{t('orders.sort_status')}</option>
            </select>
            <button className="text-xs underline" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? t('orders.asc') : t('orders.desc')}</button>
            <label className="text-sm ml-2">{t('orders.filter_status')}</label>
            <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">{t('orders.status_all')}</option>
              <option value="Pending">{t('orders.status_pending')}</option>
              <option value="In Progress">{t('orders.status_inprogress')}</option>
              <option value="Completed">{t('orders.status_completed')}</option>
              <option value="Delivered">{t('orders.status_delivered')}</option>
              <option value="Rejected">{t('orders.status_rejected')}</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {pagedOrders.map((order) => (
          <Collapsible key={`${order.is_request}-${order.id}`} asChild>
            <Card className="transition-shadow hover:shadow-md">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <h3 className="font-semibold text-lg">{order.is_request ? t('orders.request_number', { id: order.id }) : t('orders.order_number', { id: order.id })}</h3>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{getStatusBadge(order.status)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('orders.status')}: {t('orders.status_' + order.status.replace(/\s/g, '').toLowerCase())}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{formatDate(order.date)}</span></div>
                      {order.delivery_date && <div className="flex items-center gap-2"><Truck className="h-4 w-4" /><span>Delivery by {formatDate(order.delivery_date)}</span></div>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <CollapsibleTrigger asChild><Button variant="outline" size="sm" className="w-full sm:w-auto">{t('orders.view_details')}<ChevronsUpDown className="h-4 w-4 ml-2" /></Button></CollapsibleTrigger>
                    {/* Quick Re-order button */}
                    {(order.status === 'Completed' || order.status === 'Delivered') && !order.is_request && typeof onQuickReorder === 'function' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto flex items-center gap-1"
                        onClick={() => {
                          // Try to match product by category (order_type) and/or name heuristically
                          let productInfo = null;
                          // Try to match by category (order_type)
                          if (order.order_type) {
                            productInfo = products.find(p => p.category === order.order_type);
                          }
                          // Compose reorderData with product info
                          const reorderData = {
                            ...order,
                            productId: productInfo ? String(productInfo.id) : undefined,
                            product_name: productInfo ? productInfo.name : undefined,
                          };
                          onQuickReorder(reorderData);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" /> {t('orders.quick_reorder')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <CollapsibleContent>
                <div className="p-4 border-t dark:border-zinc-700">
                  {order.rejection_reason && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{t('orders.rejection_reason')}</h4>
                        <p className="text-sm">{order.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    {!order.is_request ? (
                      <div>
                        <h4 className="font-semibold mb-3">{t('orders.history')}</h4>
                        <OrderActivityTimeline orderId={order.id} />
                      </div>
                    ) : <div className="text-sm text-muted-foreground">{t('orders.request_pending')}</div>}
                    <div className="space-y-6">
                      <div><h4 className="font-semibold mb-2">{t('orders.payment_details')}</h4><div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between"><span>{t('orders.total')}</span><span className="font-semibold">₹{formatCurrency(order.total_amount)}</span></div>
                        <div className="flex justify-between"><span>{t('orders.paid')}</span><span className="text-green-600">₹{formatCurrency(order.amount_received)}</span></div>
                        <div className="flex justify-between font-semibold"><span>{t('orders.balance')}</span><span className={order.balance_amount > 0 ? "text-orange-600" : ""}>₹{formatCurrency(order.balance_amount)}</span></div>
                      </div></div>
                      <div><h4 className="font-semibold mb-2">{t('orders.details')}</h4><div className="space-y-2 text-sm text-muted-foreground">
                        <div><strong>{t('orders.type')}</strong> {order.order_type}</div>
                        <div><strong>{t('orders.quantity')}</strong> {order.quantity}</div>
                        {order.notes && <p className="pt-2"><strong>{t('orders.notes')}</strong> {order.notes}</p>}
                      </div></div>
                    </div>
                  </div>
                  
                  {/* Service Charge Display for requests */}
                  {order.is_request && (
                    <div className="mt-6">
                      <ServiceChargeDisplay 
                        order={order}
                        customerId={customerId}
                        onResponseSubmitted={() => {
                          setIsLoading(true);
                          fetchOrdersAndHistory();
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Order Chat Component */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Need help with this order?</h4>
                      <OrderChat 
                        orderId={order.id}
                        orderNumber={`#${order.id}`}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          ))}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={e => {e.preventDefault(); setPage(p => Math.max(1, p-1));}} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={page === i+1} onClick={e => {e.preventDefault(); setPage(i+1);}}>{i+1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={e => {e.preventDefault(); setPage(p => Math.min(totalPages, p+1));}} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </TooltipProvider>
  );
}
