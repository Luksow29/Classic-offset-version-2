import React, { useEffect, useState, useMemo } from 'react';
import { OrdersTableOrder, OrdersTableProps, SortField, SortOrder, Status } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, FileX, Eye, Edit, Trash2,
  MoreHorizontal, Download, RefreshCw, ArrowUpDown, Calendar, Clock, ChevronsLeft,
  ChevronLeft, ChevronRight, ChevronsRight
} from 'lucide-react';

import Button from '../ui/Button';
import OrderStatusStepper from './OrderStatusStepper';
import UpdateStatusModal from './UpdateStatusModal';
import OrderDetailsModal from './OrderDetailsModal';
import EditOrderModal from './EditOrderModal';
import DeleteOrderModal from './DeleteOrderModal';
import BulkActionsModal from './BulkActionsModal';
import OrdersFilterBar from './OrdersFilterBar';
import OrderGridCard from './OrderGridCard';

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

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, isLoading, onRefresh, highlightOrderId }) => {
  const navigate = useNavigate();

  // View Mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  // Handlers
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

  const handleSelectAll = (filteredOrders: OrdersTableOrder[]) => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders);
    }
    setSelectAll(!selectAll);
  };

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    if (highlightOrderId && orders.length > 0) return orders.filter(o => String(o.order_id) === highlightOrderId);

    let filtered = orders.filter(order => {
      if (order.is_deleted && !showDeleted) return false;
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
  }, [orders, searchQuery, statusFilter, dateFilter, sortField, sortOrder, highlightOrderId, showDeleted]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, showDeleted]);

  // Sync Select All
  useEffect(() => {
    setSelectAll(
      filteredAndSortedOrders.length > 0 &&
      selectedOrders.length === filteredAndSortedOrders.length
    );
  }, [selectedOrders, filteredAndSortedOrders]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };


  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold">
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
    </button>
  );

  if (isLoading) return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <OrdersFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showDeleted={showDeleted}
        setShowDeleted={setShowDeleted}
        totalResults={filteredAndSortedOrders.length}
      />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAndSortedOrders.length} orders
        </p>
        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          {selectedOrders.length > 0 && (
            <Button onClick={() => setShowBulkModal(true)} variant="primary" size="sm">
              Bulk Actions ({selectedOrders.length})
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4"><input type="checkbox" checked={selectAll} onChange={() => handleSelectAll(filteredAndSortedOrders)} className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-white dark:bg-gray-800" /></th>
                    <th className="px-6 py-4"><SortButton field="order_id">Order</SortButton></th>
                    <th className="px-6 py-4"><SortButton field="customer_name">Customer</SortButton></th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4"><SortButton field="date">Date</SortButton></th>
                    <th className="px-6 py-4 w-64">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                    <motion.tr
                      layout
                      key={order.order_id}
                      className={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedOrders.some(o => o.order_id === order.order_id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${order.is_deleted ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4"><input type="checkbox" checked={selectedOrders.some(o => o.order_id === order.order_id)} onChange={() => handleSelectOrder(order)} className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-white dark:bg-gray-800" /></td>
                      <td className="px-6 py-4">
                        <Link to={`/invoices/${order.order_id}`} className="font-bold text-gray-900 dark:text-white hover:text-primary">#{order.order_id}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {order.order_type}
                          <span className="w-1 h-1 rounded-full bg-gray-400" />
                          Qty: {order.quantity}
                        </div>
                        <div className="mt-1 font-semibold text-gray-900 dark:text-white text-xs">₹{order.total_amount?.toLocaleString()}</div>

                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar size={12} className="text-gray-400" />
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                        {order.delivery_date && (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                            <Clock size={12} />
                            {new Date(order.delivery_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><OrderStatusStepper currentStatus={order.status as 'Pending' | 'Design' | 'Printing' | 'Delivered'} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleViewDetails(order.order_id)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary transition-colors shadow-sm"><Eye size={16} /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEditOrder(order)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-500 transition-colors shadow-sm"><Edit size={16} /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleStatusUpdate(order)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-purple-500 transition-colors shadow-sm"><MoreHorizontal size={16} /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteOrder(order)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileX className="w-16 h-16 mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Orders Found</h3>
                          <p className="text-sm">Try adjusting your filters or search query</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {paginatedOrders.map(order => (
              <OrderGridCard
                key={order.order_id}
                order={order}
                onView={handleViewDetails}
                onEdit={handleEditOrder}
                onDelete={handleDeleteOrder}
                onStatusUpdate={handleStatusUpdate}
                isSelected={selectedOrders.some(o => o.order_id === order.order_id)}
                onSelect={handleSelectOrder}
              />
            ))}
            {paginatedOrders.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <FileX className="w-16 h-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Orders Found</h3>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Footer */}
      {paginatedOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="w-10 h-10 p-0 flex items-center justify-center rounded-xl"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple logic to show a window of pages logic would be better but keeping it simple for now
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                if (p > totalPages) p = i + 1; // Fallback

                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${currentPage === p
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="w-10 h-10 p-0 flex items-center justify-center rounded-xl"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showUpdateModal && selectedOrder && <UpdateStatusModal order={selectedOrder} isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} onStatusUpdated={() => { onRefresh(); setShowUpdateModal(false); }} />}
      {showDetailsModal && detailsOrderId && <OrderDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} orderId={detailsOrderId} />}
      {showEditModal && selectedOrder && <EditOrderModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} order={selectedOrder} onOrderUpdated={() => { onRefresh(); setShowEditModal(false); }} />}
      {showDeleteModal && selectedOrder && <DeleteOrderModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} order={selectedOrder} onOrderDeleted={() => { onRefresh(); setShowDeleteModal(false); }} />}
      {showBulkModal && <BulkActionsModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} selectedOrders={selectedOrders} onBulkActionComplete={() => { onRefresh(); setSelectedOrders([]); setShowBulkModal(false); }} />}

    </div>
  );
};

export default OrdersTable;