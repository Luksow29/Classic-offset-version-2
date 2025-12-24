// src/components/orders/StatusOverview.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { Package, Loader2, AlertTriangle, CheckCircle, Search, Clock, ArrowRight, User, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// தரவிற்கான வகைகள்
interface StatusHistoryItem {
  status: string;
  updated_by: string;
  updated_at: string;
}
interface OrderWithStatus {
  order_id: number;
  customer_name: string;
  latest_status: string;
  last_updated_by: string;
  last_updated_at: string;
  history: StatusHistoryItem[] | null;
}

// ஸ்டேட்டஸ்-க்கு ஏற்ப வண்ணம் மற்றும் ஐகான்கள்
const statusConfig: Record<string, { className: string; icon: React.ReactNode; timelineColor: string; label: string }> = {
  Pending: {
    className: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
    icon: <Loader2 size={12} className="animate-spin" />,
    timelineColor: 'bg-amber-400',
    label: 'Pending'
  },
  Design: {
    className: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
    icon: <AlertTriangle size={12} />,
    timelineColor: 'bg-blue-400',
    label: 'In Design'
  },
  Printing: {
    className: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-100',
    icon: <Package size={12} />,
    timelineColor: 'bg-purple-400',
    label: 'Printing'
  },
  Delivered: {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    icon: <CheckCircle size={12} />,
    timelineColor: 'bg-emerald-400',
    label: 'Delivered'
  },
};

// Fallback for unknown statuses
const defaultStatusConfig = {
  className: 'bg-gray-50 text-gray-600 border-gray-200 ring-gray-100',
  icon: <Clock size={12} />,
  timelineColor: 'bg-gray-300',
  label: 'Unknown'
};

const statuses = ['All', 'Pending', 'Design', 'Printing', 'Delivered'];

const StatusOverview: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStatusOverview = useCallback(async () => {
    setError(null);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_name');

      if (ordersError) throw ordersError;

      const { data: statusLogsData, error: statusLogsError } = await supabase
        .from('order_status_log')
        .select('*')
        .order('updated_at', { ascending: false });

      if (statusLogsError) throw statusLogsError;

      const ordersWithStatus = ordersData.map(order => {
        const history = statusLogsData.filter(log => log.order_id === order.id);
        // Only consider orders that have a status, or default to Pending if in the system but no log
        const latestStatus = history[0] || { status: 'Pending', updated_by: 'System', updated_at: new Date().toISOString() };

        return {
          order_id: order.id,
          customer_name: order.customer_name,
          latest_status: latestStatus.status,
          last_updated_by: latestStatus.updated_by,
          last_updated_at: latestStatus.updated_at,
          history: history,
        };
      });

      // Show most recent updates first
      ordersWithStatus.sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime());

      setOrders(ordersWithStatus);
    } catch (err: any) {
      setError(err.message || "Failed to load status overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusOverview();

    const channel = supabase.channel('order_status_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_log' },
        (payload) => {
          console.log('New status change received!', payload);
          fetchStatusOverview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatusOverview]);

  const filteredOrders = useMemo(() => {
    const statusFilterLower = statusFilter.toLowerCase();
    return orders
      .filter(order => {
        if (statusFilterLower === 'all') return true;
        return (order.latest_status || '').toLowerCase() === statusFilterLower;
      })
      .filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.order_id).includes(searchTerm)
      );
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-3 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* Header Section - Compact on Mobile */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 cursor-pointer"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Clock size={16} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
          </motion.div>
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
              Status Overview
            </h1>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Realtime timeline of active print jobs.</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
          <input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-28 sm:w-64 pl-7 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs - Compact on Mobile */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-0.5 sm:p-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 w-fit">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`
                    relative px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200
                    ${statusFilter === status
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}
                `}
          >
            {statusFilter === status && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md sm:rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{status}</span>
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-100">
          <AlertTriangle className="mx-auto h-12 w-12 mb-3 text-red-400" />
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No orders found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {statusFilter === 'All' ? 'There are no visible orders at the moment.' : `No orders match the "${statusFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => {
              const statusStyle = statusConfig[order.latest_status] || defaultStatusConfig;

              return (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                >
                  <div className="group h-full flex flex-col bg-white dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-6 pb-4 border-b border-gray-50 dark:border-gray-700/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Link to={`/orders/${order.order_id}`} className="group-hover:text-primary-600 transition-colors">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              Order #{order.order_id}
                              <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-500" />
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <User size={14} />
                            {order.customer_name}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ring-1 ring-inset ${statusStyle.className}`}>
                          {statusStyle.icon}
                          {order.latest_status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Clock size={12} />
                        <span>Updated {dayjs(order.last_updated_at).fromNow()}</span>
                        <span>•</span>
                        <span>by {order.last_updated_by}</span>
                      </div>
                    </div>

                    {/* Timeline Body */}
                    <div className="flex-1 p-6 pt-4 bg-gray-50/50 dark:bg-gray-800/30">
                      <div className="space-y-6 pl-2 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[5px] top-2 bottom-4 w-[2px] bg-gray-200 dark:bg-gray-700"></div>

                        {(order.history || []).slice(0, 3).map((entry, idx) => (
                          <div key={idx} className="relative pl-6">
                            {/* Dot */}
                            <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm z-10 
                                        ${(statusConfig[entry.status] || defaultStatusConfig).timelineColor}`}
                            />

                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {entry.status}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                <Calendar size={10} />
                                {dayjs(entry.updated_at).format('MMM D, h:mm A')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {order.history && order.history.length > 3 && (
                          <div className="pl-6 pt-2">
                            <Link to={`/orders/${order.order_id}`} className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline">
                              + {order.history.length - 3} more updates
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default StatusOverview;
