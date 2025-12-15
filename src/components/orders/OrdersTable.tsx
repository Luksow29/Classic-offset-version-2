// src/components/orders/OrdersTable.tsx

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import OrderStatusStepper from './OrderStatusStepper';
import UpdateStatusModal from './UpdateStatusModal';
import OrderDetailsModal from './OrderDetailsModal';
import EditOrderModal from './EditOrderModal';
import DeleteOrderModal from './DeleteOrderModal';
import BulkActionsModal from './BulkActionsModal';
import {
  AlertTriangle, FileX, Search, MessageCircle, Eye, Edit, Trash2,
  MoreHorizontal, Download, RefreshCw, ArrowUpDown, Calendar, Clock, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OrdersTableOrder, OrdersTableProps, SortField, SortOrder, Status } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton Loading Component
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800/50 last:border-0">
    <td className="px-6 py-4"><div className="w-5 h-5 bg-gray-200 dark:bg-zinc-800 rounded-md" /></td>
    <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 dark:bg-zinc-800 rounded-md" /></td>
    <td className="px-6 py-4">
      <div className="h-5 w-32 bg-gray-200 dark:bg-zinc-800 rounded-md mb-2" />
      <div className="h-3 w-24 bg-gray-100 dark:bg-zinc-900 rounded-md" />
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-24 bg-gray-200 dark:bg-zinc-800 rounded-md mb-2" />
      <div className="h-3 w-16 bg-gray-100 dark:bg-zinc-900 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-800 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />)}
      </div>
    </td>
  </tr>
);

const SkeletonCard = () => (
  <div className="animate-pulse p-5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 mb-4">
    <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent rounded-full mb-4 opacity-50" />
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded-md mb-2" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-zinc-900 rounded-md mb-1" />
          <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-900 rounded-full" />
        </div>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />)}
      </div>
    </div>
    <div className="flex items-center gap-2 mb-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full" />)}
    </div>
    <div className="h-px bg-gray-100 dark:bg-zinc-800 my-4" />
    <div className="flex justify-between items-center">
      <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        <div className="w-20 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
      </div>
    </div>
  </div>
);

const OrdersTable: React.FC<OrdersTableProps> = ({ highlightOrderId }) => {
  const [orders, setOrders] = useState<OrdersTableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrdersTableOrder | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [detailsOrderId, setDetailsOrderId] = useState<number | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('order_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection states
  const [selectedOrders, setSelectedOrders] = useState<OrdersTableOrder[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, customer_id, order_type, quantity, date, delivery_date, total_amount, 
          amount_received, balance_amount, is_deleted,
          customers!inner(name, phone)
        `);

      if (highlightOrderId) {
        query = query.eq('id', highlightOrderId);
      } else {
        if (!showDeleted) {
          query = query.or('is_deleted.is.null,is_deleted.eq.false');
        }
        query = query.order('id', { ascending: false });
      }

      const { data: ordersData, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const orderIds = ordersData?.map(o => o.id) || [];
      const { data: statusData, error: statusError } = await supabase
        .from('order_status_log')
        .select('order_id, status, updated_at')
        .in('order_id', orderIds)
        .order('updated_at', { ascending: false });

      if (statusError) throw statusError;

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showDeleted, highlightOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClearHighlight = () => {
    navigate('/orders', { replace: true });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectOrder = (order: OrdersTableOrder) => {
    setSelectedOrders(prev => {
      const isSelected = prev.some(o => o.order_id === order.order_id);
      if (isSelected) {
        return prev.filter(o => o.order_id !== order.order_id);
      } else {
        return [...prev, order];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredAndSortedOrders);
    }
    setSelectAll(!selectAll);
  };

  const filteredAndSortedOrders = useMemo(() => {
    if (highlightOrderId && orders.length > 0) return orders;
    const filtered = orders.filter(order => {
      const matchesSearch =
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.order_id).includes(searchQuery);
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesDate = !dateFilter || order.date.startsWith(dateFilter);
      return matchesSearch && matchesStatus && matchesDate;
    });
    filtered.sort((a, b) => {
      type OrderValue = string | number | boolean | null | undefined;
      let aValue: OrderValue = a[sortField as keyof OrdersTableOrder];
      let bValue: OrderValue = b[sortField as keyof OrdersTableOrder];
      if (sortField === 'date' || sortField === 'delivery_date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      if (sortOrder === 'asc') return (aValue ?? 0) > (bValue ?? 0) ? 1 : -1;
      else return (aValue ?? 0) < (bValue ?? 0) ? 1 : -1;
    });
    return filtered;
  }, [orders, searchQuery, statusFilter, dateFilter, sortField, sortOrder, highlightOrderId]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, showDeleted]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  useEffect(() => {
    setSelectAll(
      filteredAndSortedOrders.length > 0 &&
      selectedOrders.length === filteredAndSortedOrders.length
    );
  }, [selectedOrders, filteredAndSortedOrders]);


  const handleStatusUpdate = (order: OrdersTableOrder) => { setSelectedOrder(order); setShowUpdateModal(true); };
  const handleViewDetails = (orderId: number) => { setDetailsOrderId(orderId); setShowDetailsModal(true); };
  const handleEditOrder = (order: OrdersTableOrder) => { setSelectedOrder(order); setShowEditModal(true); };
  const handleDeleteOrder = (order: OrdersTableOrder) => { setSelectedOrder(order); setShowDeleteModal(true); };
  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Order Type', 'Quantity', 'Order Date', 'Delivery Date', 'Status', 'Total Amount'];
    const csvData = filteredAndSortedOrders.map(order => [
      order.order_id, order.customer_name, order.order_type, order.quantity,
      new Date(order.date).toLocaleDateString(), new Date(order.delivery_date).toLocaleDateString(),
      order.status, order.total_amount ? `₹${order.total_amount}` : 'N/A'
    ]);
    const csvContent = [headers, ...csvData].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold">
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
    </button>
  );

  // Skeleton Loading UI
  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-zinc-950 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden"
    >
      {/* Header Skeleton */}
      <div className="p-6 space-y-6 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            <div>
              <div className="h-7 w-40 bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-100 dark:bg-zinc-900 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        </div>
        {/* Filter Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-1">
          <div className="md:col-span-2 h-11 bg-gray-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
          <div className="h-11 bg-gray-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
          <div className="h-11 bg-gray-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
          <div className="h-11 bg-gray-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden p-4">
        {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-900/50">
            <tr>
              {['', 'Order', 'Customer', 'Details', 'Dates', 'Status', 'Actions'].map((h, i) => (
                <th key={i} className="px-6 py-4 text-left">
                  {h ? <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" /> : <div className="w-5 h-5 bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  if (error) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300 text-center rounded-3xl border border-red-200/60 dark:border-red-800/60 backdrop-blur-xl"
    >
      <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-2xl w-fit mx-auto mb-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <p className="font-bold text-xl mb-2">Error Loading Orders</p>
      <p className="text-sm opacity-80">{error}</p>
      <Button onClick={fetchOrders} variant="outline" className="mt-4">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-900 backdrop-blur-2xl rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-6 space-y-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Orders</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{filteredAndSortedOrders.length} of {orders.length} orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchOrders}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
              <AnimatePresence>
                {selectedOrders.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/30"
                  >
                    Bulk Actions ({selectedOrders.length})
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {highlightOrderId ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-2xl flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Search className="w-4 h-4" />
                </div>
                <p className="font-medium text-sm">Showing details for highlighted Order #{highlightOrderId}</p>
              </div>
              <Button onClick={handleClearHighlight} variant="ghost" size="sm" className="flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-800/50"><X size={16} /> Clear</Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-5 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute top-1/2 left-4 -translate-y-1/2" />
                <Input
                  id="search"
                  placeholder="Search by Order ID, Customer, or Type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl h-11 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <Select
                label="Status"
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Pending', label: '🔴 Pending' },
                  { value: 'Design', label: '🟡 Design' },
                  { value: 'Printing', label: '🔵 Printing' },
                  { value: 'Delivered', label: '🟢 Delivered' }
                ]}
              />
              <Input
                id="dateFilter"
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl h-11 text-gray-900 dark:text-white"
              />
              <div className="flex items-center gap-3 justify-end bg-white dark:bg-gray-900 px-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <label htmlFor="showDeleted" className="text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">Show Deleted</label>
                <input
                  type="checkbox"
                  id="showDeleted"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 rounded-xl border border-gray-200 dark:border-gray-700 h-11">
                <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Per page:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="flex-1 bg-transparent border-none text-sm font-semibold text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mobile View - Card Layout */}
        <div className="md:hidden p-4 space-y-4">
          <AnimatePresence>
            {paginatedOrders.length > 0 ? paginatedOrders.map((order, index) => {
              const statusColors: Partial<Record<Status, string>> = {
                Pending: 'from-yellow-500 to-orange-500', Design: 'from-blue-500 to-cyan-500',
                Printing: 'from-purple-500 to-pink-500', Delivered: 'from-green-500 to-emerald-500',
                pending: 'from-yellow-500 to-orange-500', confirmed: 'from-blue-500 to-cyan-500',
                in_progress: 'from-purple-500 to-pink-500', completed: 'from-green-500 to-emerald-500',
                cancelled: 'from-red-500 to-rose-500', delivered: 'from-green-500 to-emerald-500'
              };
              const statusBg: Partial<Record<Status, string>> = {
                Pending: 'bg-yellow-100 dark:bg-yellow-900/30', Design: 'bg-blue-100 dark:bg-blue-900/30',
                Printing: 'bg-purple-100 dark:bg-purple-900/30', Delivered: 'bg-green-100 dark:bg-green-900/30',
              };
              return (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative p-5 rounded-2xl shadow-lg border overflow-hidden ${order.is_deleted ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 opacity-60' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                >
                  {/* Status Gradient Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusColors[order.status as Status] || 'from-gray-400 to-gray-500'}`} />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.some(o => o.order_id === order.order_id)}
                        onChange={() => handleSelectOrder(order)}
                        className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      />
                      <div>
                        <Link to={`/invoices/${order.order_id}`} className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:underline">#{order.order_id}</Link>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBg[order.status as Status] || 'bg-gray-100 dark:bg-gray-700'}`}>
                            {order.order_type}
                          </span>
                          <span className="text-xs text-gray-500">• Qty: {order.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleViewDetails(order.order_id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"><Eye size={18} className="text-gray-500" /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEditOrder(order)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"><Edit size={18} className="text-gray-500" /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteOrder(order)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"><Trash2 size={18} className="text-red-500" /></motion.button>
                    </div>
                  </div>

                  <div className="mb-4"><OrderStatusStepper currentStatus={order.status as 'Pending' | 'Design' | 'Printing' | 'Delivered'} /></div>

                  <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Balance:</span>
                      <span className="font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">₹{order.balance_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.customer_phone && (
                        <a href={`https://wa.me/91${order.customer_phone}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                          <MessageCircle size={18} />
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(order)} className="rounded-xl">Update</Button>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white/60 dark:bg-gray-800/60 rounded-2xl backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40"
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl w-fit mx-auto mb-4">
                  <FileX className="w-12 h-12 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">No orders found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop View - Table Layout */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
              <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-4"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-800" /></th>
                <th className="px-5 py-4"><SortButton field="order_id">Order</SortButton></th>
                <th className="px-5 py-4"><SortButton field="customer_name">Customer</SortButton></th>
                <th className="px-5 py-4">Details</th>
                <th className="px-5 py-4"><SortButton field="date">Dates</SortButton></th>
                <th className="px-5 py-4 w-72">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-zinc-800/50">
              {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                <tr key={order.order_id} className={`hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all duration-200 ${order.is_deleted ? 'opacity-50 bg-red-50 dark:bg-red-950/10' : ''} ${selectedOrders.some(o => o.order_id === order.order_id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <td className="px-5 py-4"><input type="checkbox" checked={selectedOrders.some(o => o.order_id === order.order_id)} onChange={() => handleSelectOrder(order)} className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-800" /></td>
                  <td className="px-5 py-4">
                    <Link to={`/invoices/${order.order_id}`} className="font-bold text-lg text-blue-600 dark:text-blue-400 hover:underline">#{order.order_id}</Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{order.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{order.customer_phone}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-700 dark:text-gray-300">{order.order_type}</div>
                    <div className="text-xs text-gray-500 mt-0.5 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full w-fit">Qty: {order.quantity}</div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800/50 px-2 py-1 rounded-lg w-fit">
                        <Calendar size={12} className="text-gray-400" />
                        <span>{new Date(order.date).toLocaleDateString('en-GB')}</span>
                      </div>
                      {order.delivery_date && (
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800/50 px-2 py-1 rounded-lg w-fit">
                          <Clock size={12} className="text-gray-400" />
                          <span>{new Date(order.delivery_date).toLocaleDateString('en-GB')}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4"><OrderStatusStepper currentStatus={order.status as 'Pending' | 'Design' | 'Printing' | 'Delivered'} /></td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleViewDetails(order.order_id)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400" title="View Details"><Eye size={18} /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEditOrder(order)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-500" title="Edit Order"><Edit size={18} /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleStatusUpdate(order)} className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-purple-500" title="Update Status"><MoreHorizontal size={18} /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteOrder(order)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500" title="Delete Order"><Trash2 size={18} /></motion.button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={7} className="text-center py-20">
                <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-fit mx-auto mb-4">
                  <FileX className="w-16 h-16 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">No Orders Found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </td></tr>}
            </tbody>
          </table>
        </div>

        {filteredAndSortedOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Info Text */}
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {selectedOrders.length > 0 ? (
                  <>Showing <span className="text-gray-900 dark:text-gray-200 font-bold">{selectedOrders.length}</span> selected of </>
                ) : null}
                Showing <span className="font-bold text-gray-900 dark:text-gray-200">{startIndex + 1}-{Math.min(endIndex, filteredAndSortedOrders.length)}</span> of <span className="font-bold text-gray-900 dark:text-gray-200">{filteredAndSortedOrders.length}</span> results
              </span>

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-400"
                    title="First Page"
                  >
                    <ChevronsLeft size={18} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-400"
                    title="Previous Page"
                  >
                    <ChevronLeft size={18} />
                  </motion.button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalPages <= 5) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, arr) => (
                        <React.Fragment key={page}>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="text-gray-400 px-1">...</span>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => goToPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${currentPage === page
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                                : 'hover:bg-white dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            {page}
                          </motion.button>
                        </React.Fragment>
                      ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-400"
                    title="Next Page"
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-400"
                    title="Last Page"
                  >
                    <ChevronsRight size={18} />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {showUpdateModal && selectedOrder && <UpdateStatusModal order={selectedOrder} isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} onStatusUpdated={() => { fetchOrders(); setShowUpdateModal(false); }} />}
      {showDetailsModal && detailsOrderId && <OrderDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} orderId={detailsOrderId} />}
      {showEditModal && selectedOrder && <EditOrderModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} order={selectedOrder} onOrderUpdated={() => { fetchOrders(); setShowEditModal(false); }} />}
      {showDeleteModal && selectedOrder && <DeleteOrderModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} order={selectedOrder} onOrderDeleted={() => { fetchOrders(); setShowDeleteModal(false); }} />}
      {showBulkModal && <BulkActionsModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} selectedOrders={selectedOrders} onBulkActionComplete={() => { fetchOrders(); setSelectedOrders([]); setShowBulkModal(false); }} />}
    </>
  );
};

export default OrdersTable;