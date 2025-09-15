// src/components/PaymentManagementTable.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { 
  Search, Filter, Download, RefreshCw, Edit, Trash2, Eye, 
  Calendar, DollarSign, User, FileText, ArrowUpDown, 
  CheckSquare, Square, MoreHorizontal, Loader2, AlertTriangle,
  Plus, Minus, CreditCard, Clock, TrendingUp, TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  customer_id: string;
  order_id: number;
  amount_paid: number;
  due_date: string;
  status: 'Paid' | 'Partial' | 'Due' | 'Overdue';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  customer_name?: string;
  customer_phone?: string;
  order_total_amount: number;
  order_amount_paid: number;
  order_balance_due: number;
}

interface GroupedPayment {
  order_id: number;
  customer_name: string;
  customer_phone: string;
  order_total_amount: number;
  order_amount_paid: number;
  order_balance_due: number;
  status: 'Paid' | 'Partial' | 'Due' | 'Overdue';
  payments: Payment[];
}

interface PaymentHistory {
  id: string;
  payment_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_data?: any; // UPDATED: Renamed from old_values for consistency with DB schema
  new_data?: any; // Renamed from new_values to match DB schema (though new_values was already jsonb)
  changed_by: string;
  changed_at: string;
  notes?: string;
}

type SortField = 'created_at' | 'amount_paid' | 'order_total_amount' | 'due_date' | 'status' | 'customer_name';
type SortOrder = 'asc' | 'desc';

const PaymentManagementTable: React.FC = () => {
  const { user } = useUser();
  const [groupedPayments, setGroupedPayments] = useState<GroupedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Selection states
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Modal states
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    amount_paid: '',
    due_date: '',
    status: '',
    payment_method: '',
    notes: ''
  });
  
  // Payment history
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('order_payments_view')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (error) throw error;

  const grouped = (data || []).reduce((acc, item) => {
        const orderId = item.order_id;
        if (!acc[orderId]) {
          acc[orderId] = {
            order_id: orderId,
    customer_name: item.customer_name || 'Unknown',
    customer_phone: item.customer_phone || '',
    order_total_amount: Number(item.order_total_amount ?? 0),
    order_amount_paid: Number(item.order_amount_paid ?? 0),
    order_balance_due: Number(item.order_balance_due ?? 0),
    status: item.order_status || 'Due',
            payments: [],
          };
        }
        if (item.payment_id) {
          acc[orderId].payments.push({
            id: item.payment_id,
            customer_id: item.customer_id,
            order_id: item.order_id,
    amount_paid: Number(item.payment_amount ?? 0),
    due_date: item.payment_due_date || new Date().toISOString().split('T')[0],
    status: item.payment_status || 'Due',
            payment_method: item.payment_method,
            notes: item.payment_notes,
            created_at: item.payment_created_at,
            updated_at: item.payment_updated_at,
            customer_name: item.customer_name,
            customer_phone: item.customer_phone,
    order_total_amount: Number(item.order_total_amount ?? 0),
    order_amount_paid: Number(item.order_amount_paid ?? 0),
    order_balance_due: Number(item.order_balance_due ?? 0),
          });
        }
        return acc;
      }, {} as Record<number, GroupedPayment>);

      setGroupedPayments(Object.values(grouped));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  const fetchPaymentHistory = async (paymentId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('payment_id', paymentId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    return groupedPayments.filter(group => {
      const matchesSearch =
        group.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(group.order_id).includes(searchQuery);

      const matchesStatus = !statusFilter || group.status === statusFilter;

      // Additional filtering logic can be added here if needed

      return matchesSearch && matchesStatus;
    });
  }, [groupedPayments, searchQuery, statusFilter]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Handle selection
  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments([]);
    } else {
      const allPaymentIds = filteredAndSortedPayments.flatMap(g => g.payments.map(p => p.id));
      setSelectedPayments(allPaymentIds);
    }
    setSelectAll(!selectAll);
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Handle edit
  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditForm({
      amount_paid: String(payment.amount_paid),
      due_date: payment.due_date,
      status: payment.status,
      payment_method: payment.payment_method || '',
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPayment || !user?.id) return;

    try {
      // Update the orders table for the due date (delivery_date)
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ delivery_date: editForm.due_date })
        .eq('id', editingPayment.order_id);

      if (orderUpdateError) throw orderUpdateError;

      const updatedPaymentData = {
        amount_paid: parseFloat(editForm.amount_paid),
        status: editForm.status as 'Paid' | 'Partial' | 'Due' | 'Overdue',
        payment_method: editForm.payment_method,
        notes: editForm.notes,
        updated_at: new Date().toISOString()
      };

      const { data, error, count } = await supabase
        .from('payments')
        .update(updatedPaymentData)
        .eq('id', editingPayment.id)
        .select();

      if (error) throw error;

      if (count && count > 0) {
        const { error: historyError } = await supabase.from('payment_history').insert({
          payment_id: editingPayment.id,
          action: 'UPDATE',
          old_data: editingPayment,
          new_data: {
            ...editingPayment,
            ...updatedPaymentData,
            due_date: editForm.due_date, // Log the updated due date
          },
          changed_by: user.id,
          notes: 'Payment updated via management interface'
        });

        if (historyError) {
          console.error('Failed to log payment history:', historyError);
        }
      } else {
        throw new Error('Payment record not found or could not be updated');
      }

      toast.success('Payment updated successfully');
      setShowEditModal(false);
      setEditingPayment(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment');
    }
  };

  // Handle view
  const handleView = (payment: Payment) => {
    setViewingPayment(payment);
    setShowViewModal(true);
    fetchPaymentHistory(payment.id);
  };

  // Handle delete
  const handleDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete || !user?.id) return;

    try {
      // First, delete all payment history records for this payment
      const { error: historyDeleteError } = await supabase
        .from('payment_history')
        .delete()
        .eq('payment_id', paymentToDelete.id);

      if (historyDeleteError) throw historyDeleteError;

      // Then delete the payment record
      const { error: paymentDeleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentToDelete.id);

      if (paymentDeleteError) throw paymentDeleteError;

      toast.success('Payment deleted successfully');
      setShowDeleteModal(false);
      setPaymentToDelete(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payment');
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedPayments.length === 0 || !user?.id) return;

    try {
      // First, delete all payment history records for these payments
      const { error: historyDeleteError } = await supabase
        .from('payment_history')
        .delete()
        .in('payment_id', selectedPayments);

      if (historyDeleteError) throw historyDeleteError;

      // Then delete the payment records
      const { error: paymentsDeleteError } = await supabase
        .from('payments')
        .delete()
        .in('id', selectedPayments);

      if (paymentsDeleteError) throw paymentsDeleteError;

      toast.success(`${selectedPayments.length} payments deleted successfully`);
      setSelectedPayments([]);
      setSelectAll(false);
      setShowBulkModal(false);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payments');
    }
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Payment ID', 'Customer', 'Order ID', 'Order Total', 'Amount Paid', 'Balance Due', 'Status', 'Due Date', 'Payment Method', 'Created Date'];
    const allPayments = filteredAndSortedPayments.flatMap(g => g.payments);
    const csvData = allPayments.map(payment => [
      payment.id,
      payment.customer_name,
      payment.order_id,
      `₹${payment.order_total_amount}`,
      `₹${payment.amount_paid}`,
      `₹${payment.order_balance_due}`,
      payment.status,
      new Date(payment.due_date).toLocaleDateString(),
      payment.payment_method || '-',
      new Date(payment.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Due':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
    </button>
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading payments...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">Error Loading Payments</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold">💳 Payment Management</h3>
              <p className="text-sm text-gray-500">Comprehensive payment tracking and management</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchPayments} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              {selectedPayments.length > 0 && (
                <Button onClick={() => setShowBulkModal(true)} variant="destructive" size="sm">
                  Delete Selected ({selectedPayments.length})
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
              <Input
                id="search-payments"
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              id="status-filter"
              label=""
              options={[
                { value: 'Paid', label: 'Paid' },
                { value: 'Partial', label: 'Partial' },
                { value: 'Due', label: 'Due' },
                { value: 'Overdue', label: 'Overdue' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Status"
            />

            <Input
              id="date-filter"
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by month"
            />

            <Input
              id="min-amount"
              type="number"
              placeholder="Min amount"
              value={amountFilter.min}
              onChange={(e) => setAmountFilter({ ...amountFilter, min: e.target.value })}
            />

            <Input
              id="max-amount"
              type="number"
              placeholder="Max amount"
              value={amountFilter.max}
              onChange={(e) => setAmountFilter({ ...amountFilter, max: e.target.value })}
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setDateFilter('');
                setAmountFilter({ min: '', max: '' });
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <SortButton field="customer_name">Customer</SortButton>
                </th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton field="order_total_amount">Order Total</SortButton>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton field="amount_paid">Amount Paid</SortButton>
                </th>
                <th className="px-4 py-3 text-right font-medium">Balance Due</th>
                <th className="px-4 py-3 text-center font-medium">
                  <SortButton field="status">Status</SortButton>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <SortButton field="due_date">Due Date</SortButton>
                </th>
                <th className="px-4 py-3 text-left font-medium">Method</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedPayments.map((group) => (
                <React.Fragment key={group.order_id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => toggleOrderExpansion(group.order_id)}>
                        {expandedOrders.has(group.order_id) ? <Minus size={14} /> : <Plus size={14} />}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{group.customer_name}</div>
                          <div className="text-xs text-gray-500">{group.customer_phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/invoices/${group.order_id}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        #{group.order_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(group.order_total_amount ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">₹{Number(group.order_amount_paid ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">₹{Number(group.order_balance_due ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                        {group.status}
                      </span>
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                  {expandedOrders.has(group.order_id) && (
                    <>
                      {group.payments.map(payment => (
                        <tr key={payment.id} className="bg-gray-50 dark:bg-gray-800">
                          <td className="px-4 py-3 pl-12">
                            <input
                              type="checkbox"
                              checked={selectedPayments.includes(payment.id)}
                              onChange={() => handleSelectPayment(payment.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td colSpan={3}></td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">₹{Number(payment.amount_paid ?? 0).toLocaleString('en-IN')}</td>
                          <td></td>
                          <td></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{new Date(payment.due_date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              <span>{payment.payment_method || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleView(payment)} title="View Details">
                                <Eye size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(payment)} title="Edit Payment">
                                <Edit size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(payment)} title="Delete Payment">
                                <Trash2 size={14} className="text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedPayments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payments found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredAndSortedPayments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                Showing {filteredAndSortedPayments.length} of {groupedPayments.length} orders
                {selectedPayments.length > 0 && ` • ${selectedPayments.length} selected`}
              </span>
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span>Total Value: ₹{filteredAndSortedPayments.reduce((sum, g) => sum + Number(g.order_amount_paid ?? 0), 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Payment - ${editingPayment?.customer_name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="amount_paid"
              label="Amount Paid (₹)"
              type="number"
              step="0.01"
              value={editForm.amount_paid}
              onChange={(e) => setEditForm({ ...editForm, amount_paid: e.target.value })}
            />
            <Input
              id="due_date"
              label="Due Date"
              type="date"
              value={editForm.due_date}
              onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="status"
              label="Status"
              options={[
                { value: 'Paid', label: 'Paid' },
                { value: 'Partial', label: 'Partial' },
                { value: 'Due', label: 'Due' },
                { value: 'Overdue', label: 'Overdue' }
              ]}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />
            <Select
              id="payment_method"
              label="Payment Method"
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Credit Card', label: 'Credit Card' },
                { value: 'Check', label: 'Check' }
              ]}
              value={editForm.payment_method}
              onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder="Add any notes about this payment..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Payment Details - ${viewingPayment?.customer_name}`}
        size="2xl"
      >
        {viewingPayment && (
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-white">Payment Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment ID:</span>
                    <span className="font-medium">{viewingPayment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID:</span>
                    <Link 
                      to={`/invoices/${viewingPayment.order_id}`} 
                      className="text-primary-600 hover:underline"
                    >
                      #{viewingPayment.order_id}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Total:</span>
                    <span className="font-medium">₹{viewingPayment.order_total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-medium text-green-600">₹{viewingPayment.amount_paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Balance Due:</span>
                    <span className="font-medium text-red-600">₹{viewingPayment.order_balance_due.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingPayment.status)}`}>
                      {viewingPayment.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-white">Customer & Dates</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-medium">{viewingPayment.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{viewingPayment.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium">{new Date(viewingPayment.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{new Date(viewingPayment.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-medium">{viewingPayment.payment_method || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {viewingPayment.notes && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {viewingPayment.notes}
                </p>
              </div>
            )}

            {/* Payment History */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Payment History</h4>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="ml-2 text-sm">Loading history...</span>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {paymentHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <div>
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-gray-500 ml-2">{entry.notes}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.changed_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No history available</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Payment"
        description={`Are you sure you want to delete this payment? This action cannot be undone.`}
        confirmText="Delete Payment"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Payments"
        description={`Are you sure you want to delete ${selectedPayments.length} selected payments? This action cannot be undone.`}
        confirmText={`Delete ${selectedPayments.length} Payments`}
      />
    </>
  );
};

export default PaymentManagementTable;
