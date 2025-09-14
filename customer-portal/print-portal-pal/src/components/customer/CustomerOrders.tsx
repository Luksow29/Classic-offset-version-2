
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
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface StatusLog {
  order_id: number;
  status: string;
  updated_at: string;
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

export default function CustomerOrders({ customerId, onQuickReorder }: CustomerOrdersProps) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [statusHistories, setStatusHistories] = useState<{ [key: number]: StatusLog[] }>({});
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
      
      const { data: rejectedRequests, error: requestsError } = await supabase.from("order_requests").select("*").eq("customer_id", customerId).eq("status", "rejected");
      if (requestsError) throw requestsError;
      
      const mappedRejected = rejectedRequests.map(req => {
        const data = typeof req.request_data === 'object' && req.request_data !== null ? req.request_data as Record<string, any> : {};
        return {
          id: req.id,
          date: req.created_at,
          order_type: data.orderType ?? '',
          quantity: data.quantity ?? 0,
          total_amount: data.totalAmount ?? 0,
          amount_received: 0,
          balance_amount: data.totalAmount ?? 0,
          delivery_date: data.deliveryDate ?? '',
          notes: data.notes ?? '',
          status: 'Rejected',
          rejection_reason: req.rejection_reason,
          is_request: true,
        };
      });

      const orderIds = ordersData.map(order => order.id);
      const { data: historyData, error: historyError } = await supabase.from("order_status_log").select("*").in("order_id", orderIds);
      if (historyError) throw historyError;
      
      const histories: { [key: number]: StatusLog[] } = {};
      const latestStatuses: { [key:number]: string } = {};

      if (historyData) {
        historyData.forEach(log => {
          if (!histories[log.order_id] || new Date(log.updated_at) > new Date(histories[log.order_id][0].updated_at)) {
             latestStatuses[log.order_id] = log.status;
          }
          if (!histories[log.order_id]) histories[log.order_id] = [];
          histories[log.order_id].push(log);
        });
      }
      
      const ordersWithStatus: DisplayOrder[] = ordersData.map(order => ({
        ...order, status: latestStatuses[order.id] || "Pending", is_request: false,
      }));

      const combinedList = [...ordersWithStatus, ...mappedRejected].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOrders(combinedList);
      setStatusHistories(histories);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch order history." });
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Pending": { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      "In Progress": { variant: "default" as const, icon: Package, color: "text-blue-600" },
      "Completed": { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      "Delivered": { variant: "default" as const, icon: Truck, color: "text-green-600" },
      "Rejected": { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["Pending"];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1 whitespace-nowrap">
        <Icon className={`h-3 w-3 ${config.color}`} />
        <span>{status}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

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
                      <div><h4 className="font-semibold mb-3">{t('orders.history')}</h4><OrderStatusTimeline history={statusHistories[order.id] || []} /></div>
                    ) : <div className="text-sm text-muted-foreground">{t('orders.request_pending')}</div>}
                    <div className="space-y-6">
                      <div><h4 className="font-semibold mb-2">{t('orders.payment_details')}</h4><div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between"><span>{t('orders.total')}</span><span className="font-semibold">₹{order.total_amount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>{t('orders.paid')}</span><span className="text-green-600">₹{order.amount_received.toLocaleString()}</span></div>
                        <div className="flex justify-between font-semibold"><span>{t('orders.balance')}</span><span className={order.balance_amount > 0 ? "text-orange-600" : ""}>₹{order.balance_amount.toLocaleString()}</span></div>
                      </div></div>
                      <div><h4 className="font-semibold mb-2">{t('orders.details')}</h4><div className="space-y-2 text-sm text-muted-foreground">
                        <div><strong>{t('orders.type')}</strong> {order.order_type}</div>
                        <div><strong>{t('orders.quantity')}</strong> {order.quantity}</div>
                        {order.notes && <p className="pt-2"><strong>{t('orders.notes')}</strong> {order.notes}</p>}
                      </div></div>
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
