// src/components/orders/StatusOverview.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Package, Clock, Loader2, AlertTriangle, FileText, CheckCircle, Search } from 'lucide-react';
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
const statusConfig: Record<string, { className: string; icon: React.ReactNode; timelineColor: string }> = {
  Pending: { className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: <Loader2 size={14} className="animate-spin" />, timelineColor: 'bg-red-400' },
  Design: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <AlertTriangle size={14} />, timelineColor: 'bg-yellow-400' },
  Printing: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: <Package size={14} />, timelineColor: 'bg-blue-400' },
  Delivered: { className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: <CheckCircle size={14} />, timelineColor: 'bg-green-400' },
};
const statuses = ['All', 'Pending', 'Design', 'Printing'];

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

      setOrders(ordersWithStatus);
    } catch (err: any) {
      setError(err.message || "Failed to load status overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusOverview(); // ஆரம்பத்தில் தரவைப் பெற

    // ✅ Realtime புதுப்பிப்புகளுக்கு subscribe செய்யவும்
    const channel = supabase.channel('order_status_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_log' },
        (payload) => {
          console.log('New status change received!', payload);
          // ஒரு புதிய நிலை மாற்றம் ஏற்பட்டால், முழுப் பட்டியலையும் மீண்டும் பெறவும்
          fetchStatusOverview();
        }
      )
      .subscribe();

    // cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatusOverview]);

  const filteredOrders = useMemo(() => {
    const statusFilterLower = statusFilter.toLowerCase();
    return orders
      .filter(order => {
        if (statusFilterLower === 'all') return true;
        // Compare status case-insensitively
        return (order.latest_status || '').toLowerCase() === statusFilterLower;
      })
      .filter(order => 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.order_id).includes(searchTerm)
      );
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Package size={24} className="text-primary-600" />
                Status Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Realtime timeline of all active orders.</p>
        </div>
        <div className="w-full sm:w-auto sm:max-w-xs relative">
            <Input 
                id="search-status"
                type="search"
                placeholder="Search Order# or Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={16} className="text-gray-400"/>}
                className="pl-9"
            />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(status => (
            <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
            >
                {status}
            </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {Array(3).fill(0).map((_, i) => <div key={i} className="p-6 bg-gray-200 dark:bg-gray-700 rounded-lg h-40"></div>)}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-red-600 bg-red-50"><AlertTriangle className="mx-auto h-10 w-10 mb-2" />{error}</Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30">
          <CheckCircle className="mx-auto h-12 w-12 mb-3" />
          <h3 className="text-lg font-semibold">All Caught Up!</h3>
          <p className="text-sm">{statusFilter === 'All' ? 'There are no pending orders.' : `No orders with status "${statusFilter}".`}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order, index) => (
              <motion.div key={order.order_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <Card className="p-0 overflow-hidden flex flex-col h-full">
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-start gap-2">
                      <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                        <Link to={`/orders/${order.order_id}`} className="hover:underline">Order #{order.order_id}</Link>
                        <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">{order.customer_name}</span>
                      </h2>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 whitespace-nowrap ${statusConfig[order.latest_status]?.className || 'bg-gray-100 text-gray-600'}`}>
                        {statusConfig[order.latest_status]?.icon}
                        {order.latest_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Last update {dayjs(order.last_updated_at).fromNow()} by <span className="font-medium text-gray-700 dark:text-gray-300">{order.last_updated_by}</span>
                    </p>
                  </div>
                  <div className="flex-grow px-4 sm:px-5 pb-4">
                    <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4 space-y-4">
                        {(order.history || []).map((entry, idx) => (
                            <div key={idx} className="relative">
                                <div className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-4 border-white dark:border-gray-800 ${statusConfig[entry.status]?.timelineColor || 'bg-gray-300'}`}></div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{entry.status}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">by {entry.updated_by} • {dayjs(entry.updated_at).fromNow()}</p>
                            </div>
                        ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default StatusOverview;
