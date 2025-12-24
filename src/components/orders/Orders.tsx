import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import UnifiedOrderWizard from './UnifiedOrderWizard';
import OrdersTable from './OrdersTable';
import OrderStatsWidgets from './OrderStatsWidgets';
import { Package, Plus, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { hasAnyStaffRole } from '@/lib/rbac';
import { supabase } from '@/lib/supabaseClient';
import { OrdersTableOrder } from '@/types';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage');
  const [searchParams] = useSearchParams();
  const { userProfile } = useUser();
  const canCreateOrder = hasAnyStaffRole(userProfile?.role, ['owner', 'manager', 'office']);

  const highlightOrderId = searchParams.get('highlight');

  // Lifted State
  const [orders, setOrders] = useState<OrdersTableOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, customer_id, order_type, quantity, date, delivery_date, total_amount, 
          amount_received, balance_amount, is_deleted,
          customers!inner(name, phone)
        `)
        .order('id', { ascending: false });

      const { data: ordersData, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const orderIds = ordersData?.map(o => o.id) || [];
      const { data: statusData } = await supabase
        .from('order_status_log')
        .select('order_id, status, updated_at')
        .in('order_id', orderIds)
        .order('updated_at', { ascending: false });

      const latestStatusMap: Record<number, string> = {};
      statusData?.forEach((log) => {
        if (log.order_id && !latestStatusMap[log.order_id]) {
          latestStatusMap[log.order_id] = log.status;
        }
      });

      const ordersWithStatus = ordersData?.map((order) => {
        const customer = order.customers as unknown as { name: string; phone?: string } | null;
        return {
          order_id: order.id,
          customer_name: customer?.name || 'Unknown Customer',
          customer_phone: customer?.phone || undefined,
          order_type: order.order_type,
          quantity: order.quantity,
          date: order.date,
          delivery_date: order.delivery_date,
          total_amount: order.total_amount,
          amount_received: order.amount_received,
          balance_amount: order.balance_amount,
          is_deleted: order.is_deleted,
          status: latestStatusMap[order.id] || 'Pending',
        };
      }) || [];

      setOrders(ordersWithStatus);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime Subscriptions
  useRealtimeTable({
    tableName: 'orders',
    onInsert: () => { console.log('New order received, refreshing...'); fetchOrders(); },
    onUpdate: () => { console.log('Order updated, refreshing...'); fetchOrders(); },
    onDelete: () => { console.log('Order deleted, refreshing...'); fetchOrders(); }
  });

  useRealtimeTable({
    tableName: 'order_status_log',
    onInsert: () => { console.log('Status update received, refreshing...'); fetchOrders(); }
  });

  useEffect(() => {
    if (highlightOrderId) {
      setActiveTab('manage');
    }
  }, [highlightOrderId]);

  useEffect(() => {
    if (!canCreateOrder && activeTab === 'add') {
      setActiveTab('manage');
    }
  }, [activeTab, canCreateOrder]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 transition-colors">

      {/* Premium Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-8 space-y-3 sm:space-y-8">

        {/* Header - Compact on Mobile */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <Package className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Orders</h1>
              <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage and track all customer orders</p>
            </div>
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === 'manage'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
            >
              <List size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Manage</span>
            </button>
            {canCreateOrder && (
              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === 'add'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
              >
                <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'manage' ? (
            <motion.div
              key="manage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <OrderStatsWidgets orders={orders} />
              <OrdersTable
                orders={orders}
                isLoading={loading}
                onRefresh={fetchOrders}
                highlightOrderId={highlightOrderId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <UnifiedOrderWizard onSuccess={() => { fetchOrders(); setActiveTab('manage'); }} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Orders;
