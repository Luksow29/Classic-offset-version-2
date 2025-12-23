
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/services/supabase/client";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/shared/components/ui/pagination";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  IndianRupee,
  FileText,
  Filter,
  ArrowUpDown,
  MessageCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import ServiceChargeDisplay from "@/features/invoices/components/ServiceChargeDisplay";
import OrderChat from "@/features/support/components/chat/OrderChat";
import { OrderTimeline } from "@/features/orders/components/Timeline";
import { useOrderTimeline } from "@/features/orders/hooks/useTimeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

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
  service_charges?: Array<{
    id: string;
    amount: number;
    description: string;
    type: string;
    added_at: string;
  }>;
  pricing_status?: string;
  original_amount?: number;
  quote_sent_at?: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  unit_price?: number;
}

interface DatabaseOrder {
  id: number;
  date: string;
  created_at: string | null;
  order_type: string;
  quantity: number;
  total_amount: number;
  amount_received: number | null;
  balance_amount: number | null;
  delivery_date: string | null;
  notes: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
}

interface RequestData {
  orderType?: string;
  quantity?: number;
  totalAmount?: number;
  deliveryDate?: string;
  notes?: string;
}

interface CustomerOrdersProps {
  customerId: string;
  onQuickReorder?: (order: DisplayOrder) => void;
}

const OrderCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="overflow-hidden border-border/50 bg-white dark:bg-gray-900">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
                  <Skeleton className="h-3 w-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
              </div>
              <div className="flex flex-wrap gap-4 ml-14">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded bg-gray-100 dark:bg-gray-800" />
                  <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded bg-gray-100 dark:bg-gray-800" />
                  <Skeleton className="h-4 w-28 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded bg-gray-100 dark:bg-gray-800" />
                  <Skeleton className="h-4 w-20 bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <Skeleton className="h-9 w-28 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Full page skeleton for initial load
const OrdersListSkeleton = () => (
  <div className="space-y-5">
    {/* Filter Bar Skeleton */}
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-[140px] rounded-lg" />
        <Skeleton className="h-9 w-[140px] rounded-lg" />
        <Skeleton className="h-9 w-[100px] rounded-lg ml-auto" />
      </div>
    </motion.div>

    {/* Order Cards Skeleton */}
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <OrderCardSkeleton />
        </motion.div>
      ))}
    </div>

    {/* Pagination Skeleton */}
    <div className="flex justify-center py-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  </div>
);


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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(orders.length / pageSize);
  // Sorting
  const [sortKey, setSortKey] = useState<'date' | 'total_amount' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  // Filtering (status)
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch all products for mapping product info to orders
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('id, name, category');
    if (!error && data) setProducts(data);
  };

  const fetchOrdersAndHistory = useCallback(async () => {
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
        const data: RequestData = typeof req.request_data === 'object' && req.request_data !== null ? req.request_data as RequestData : {};
        const serviceCharges = Array.isArray(req.service_charges)
          ? req.service_charges as Array<{ id: string; amount: number; description: string; type: string; added_at: string }>
          : [];
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
        const data: RequestData = typeof req.request_data === 'object' && req.request_data !== null ? req.request_data as RequestData : {};
        const serviceCharges = Array.isArray(req.service_charges)
          ? req.service_charges as Array<{ id: string; amount: number; description: string; type: string; added_at: string }>
          : [];
        const originalAmount = data.totalAmount ?? 0;
        const finalAmount = req.admin_total_amount ?? originalAmount;

        let displayStatus = req.status || 'Pending';
        if (req.status === 'quoted') {
          displayStatus = 'Quoted';
        } else if (req.status === 'accepted') {
          displayStatus = 'Accepted';
        }

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
          status: displayStatus,
          is_request: true,
          service_charges: serviceCharges,
          pricing_status: req.pricing_status || 'pending',
          quote_sent_at: req.quote_sent_at,
        };
      });

      // Only query history if we actually have order IDs
      const orderIds = (ordersData || []).map(order => order.id);

      interface OrderStatusLog {
        order_id: number;
        status: string;
        updated_at: string;
      }

      let historyData: OrderStatusLog[] = [];
      if (orderIds.length > 0) {
        const { data: hData, error: historyError } = await supabase
          .from("order_status_log")
          .select("*")
          .in("order_id", orderIds);
        if (historyError) throw historyError;
        historyData = hData || [];
      }

      const latestStatuses: { [key: number]: { status: string; updated_at: string } } = {};

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

      const ordersWithStatus: DisplayOrder[] = (ordersData || []).map((order: DatabaseOrder) => {
        const totalAmount = order.total_amount || 0;
        const amountReceived = order.amount_received || 0;
        const balanceAmount = order.balance_amount ?? (totalAmount - amountReceived);

        return {
          id: order.id,
          date: order.date || order.created_at || new Date().toISOString(),
          order_type: order.order_type || "",
          quantity: order.quantity || 0,
          total_amount: totalAmount,
          amount_received: amountReceived,
          balance_amount: balanceAmount,
          delivery_date: order.delivery_date || "",
          notes: order.notes,
          status: latestStatuses[order.id]?.status || "Pending",
          is_request: false,
        };
      });

      const combinedList = [...ordersWithStatus, ...mappedRejected, ...mappedPending].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOrders(combinedList);

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch order history." });
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetchOrdersAndHistory();
    fetchProducts();

    const channel = supabase
      .channel('customer-orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          fetchOrdersAndHistory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_status_log',
        },
        () => {
          fetchOrdersAndHistory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_requests',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          fetchOrdersAndHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, fetchOrdersAndHistory]);

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
  const formatCurrency = (val: number | string | null | undefined) => Number(val ?? 0).toLocaleString('en-IN');

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
  const pagedOrders = sortedOrders.slice((page - 1) * pageSize, page * pageSize);

  // Track expanded orders
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  if (isLoading) return <OrdersListSkeleton />;

  if (orders.length === 0) return (
    <Card className="border-dashed border-2">
      <CardContent className="py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No orders found</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          You haven't placed any orders yet. Start by submitting a new order request.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Filter Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/50 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{orders.length} {orders.length === 1 ? 'order' : 'orders'} found</span>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-border/30">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={sortKey}
                  onValueChange={(value: 'date' | 'total_amount' | 'status') => setSortKey(value)}
                >
                  <SelectTrigger className="border-0 bg-transparent h-auto p-0 w-auto min-w-[80px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="total_amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDir === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-border/30">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="border-0 bg-transparent h-auto p-0 w-auto min-w-[70px] text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {pagedOrders.map((order, index) => {
              const orderKey = `${order.is_request}-${order.id}`;
              const isExpanded = expandedOrderId === orderKey;

              return (
                <motion.div
                  key={orderKey}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`
                    overflow-hidden transition-all duration-200
                    ${isExpanded
                      ? 'ring-2 ring-blue-500/30 shadow-lg'
                      : 'hover:shadow-md hover:border-border/80'}
                    border-border/50
                  `}>
                    {/* Order Header */}
                    <div className="p-4 md:p-5">
                      <div className="flex flex-col gap-4">
                        {/* Top Row: Order Info & Status */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                order.is_request 
                                  ? 'bg-amber-100 dark:bg-amber-900/30' 
                                  : 'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                {order.is_request
                                  ? <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                  : <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                }
                              </div>
                              <div>
                                <h3 className="font-semibold text-base">
                                  {order.is_request
                                    ? `Request #${order.id}`
                                    : `Order #${order.id}`}
                                </h3>
                                <p className="text-xs text-muted-foreground">{order.order_type || 'Print Order'}</p>
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{getStatusBadge(order.status)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Current Status: {order.status}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Amount Display (Mobile: visible in header) */}
                          <div className="flex items-center gap-1.5 sm:hidden">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold text-lg">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Row: Meta Info & Action */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.date)}</span>
                            </div>
                            {order.delivery_date && (
                              <div className="flex items-center gap-1.5">
                                <Truck className="h-4 w-4" />
                                <span>Due: {formatDate(order.delivery_date)}</span>
                              </div>
                            )}
                            {/* Amount Display (Desktop) */}
                            <div className="hidden sm:flex items-center gap-1.5 font-medium text-foreground">
                              <IndianRupee className="h-4 w-4" />
                              <span>{formatCurrency(order.total_amount)}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant={isExpanded ? "default" : "outline"}
                              size="sm"
                              className="flex-1 sm:flex-none gap-2"
                              onClick={() => toggleOrderExpansion(orderKey)}
                            >
                              <Eye className="h-4 w-4" />
                              {isExpanded ? 'Hide Details' : 'View Details'}
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            {(order.status === 'Completed' || order.status === 'Delivered') && !order.is_request && typeof onQuickReorder === 'function' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1 sm:flex-none gap-2"
                                onClick={() => {
                                  let productInfo = null;
                                  if (order.order_type) {
                                    productInfo = products.find(p => p.category === order.order_type);
                                  }
                                  const reorderData = {
                                    ...order,
                                    productId: productInfo ? String(productInfo.id) : undefined,
                                    product_name: productInfo ? productInfo.name : undefined,
                                  };
                                  onQuickReorder(reorderData);
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="p-4 md:p-6 space-y-5">
                              {/* Rejection Reason Alert */}
                              {order.rejection_reason && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 flex items-start gap-3"
                                >
                                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h4 className="font-semibold">Rejection Reason</h4>
                                    <p className="text-sm mt-1 opacity-90">{order.rejection_reason}</p>
                                  </div>
                                </motion.div>
                              )}

                              {/* Main Content Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Left Column: Timeline/Status */}
                                {!order.is_request ? (
                                  <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/30 shadow-sm">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      Order Activity
                                    </h4>
                                    <div className="max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                      <OrderActivityTimeline orderId={order.id} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
                                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      This request is awaiting review by our team.
                                    </p>
                                  </div>
                                )}

                                {/* Right Column: Payment & Details */}
                                <div className="space-y-4">
                                  {/* Payment Card */}
                                  <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/30 shadow-sm">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                                      <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      Payment Details
                                    </h4>
                                    <div className="space-y-2.5">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Total Amount</span>
                                        <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Amount Paid</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(order.amount_received)}</span>
                                      </div>
                                      <div className="h-px bg-border/50 my-2" />
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Balance Due</span>
                                        <span className={`font-bold text-lg ${order.balance_amount > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>
                                          {formatCurrency(order.balance_amount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Details Card */}
                                  <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/30 shadow-sm">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      Order Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium">{order.order_type || '-'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Quantity</span>
                                        <span className="font-medium">{order.quantity}</span>
                                      </div>
                                      {order.notes && (
                                        <div className="pt-2 border-t border-border/30">
                                          <span className="text-muted-foreground block mb-1">Notes</span>
                                          <p className="text-foreground/80">{order.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Service Charge Display for requests */}
                              {order.is_request && (
                                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/30 shadow-sm">
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

                              {/* Order Chat Section */}
                              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border/30 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                      <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm">Need help with this order?</h4>
                                      <p className="text-xs text-muted-foreground">Chat with our support team</p>
                                    </div>
                                  </div>
                                  <OrderChat
                                    orderId={order.id}
                                    orderNumber={`#${order.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center pt-4"
          >
            <Pagination>
              <PaginationContent className="bg-white dark:bg-slate-900/50 rounded-xl p-2 border border-border/50 shadow-sm">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={page === i + 1}
                      onClick={e => { e.preventDefault(); setPage(i + 1); }}
                      className={page === i + 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
