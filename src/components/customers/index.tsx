// src/components/customers/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Customer } from '@/types';
import { useUser } from '@/context/UserContext';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import CustomerStatsWidgets from './CustomerStatsWidgets';
import CustomersFilterBar from './CustomersFilterBar';
import CustomerListTable from './CustomerListTable';
import CustomerGridCard from './CustomerGridCard';
import CustomerFormModal from './CustomerFormModal';
import CustomerDetailsModal from './CustomerDetailsModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { Loader2 } from 'lucide-react';

const CustomersPage: React.FC = () => {
  const { userProfile } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = useState<string>('joined_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('customer_summary').select('*');

      // Apply Filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (tagFilter) {
        query = query.contains('tags', [tagFilter]);
      }

      // Apply Sort
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        const handled = handleSupabaseError(fetchError, { operation: 'select', table: 'customer_summary' });
        if (handled) throw handled;
        throw fetchError;
      }

      setCustomers(data || []);
    } catch (err: any) {
      console.error('Customer fetch error:', err);
      setError('Failed to load customers');
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tagFilter, sortField, sortOrder, refreshKey]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc'); // Default to asc for new field
    }
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setIsFormModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_customer_and_related_data', { p_customer_id: customerToDelete.id });
      if (error) throw error;
      toast.success('Customer deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteModal(false);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header & Stats */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your client base and view insights</p>
        </div>

        <CustomerStatsWidgets customers={customers} />
      </div>

      {/* Filters & Actions */}
      <CustomersFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalResults={customers.length}
        onAddNew={() => { setEditingCustomer(null); setIsFormModalOpen(true); }}
      />

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading customers...</p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'list' ? (
              <CustomerListTable
                customers={customers}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                onEdit={(c) => { setEditingCustomer(c); setIsFormModalOpen(true); }}
                onDelete={(c) => { setCustomerToDelete(c); setShowDeleteModal(true); }}
                onView={(c) => setSelectedCustomerForDetails(c)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {customers.map(customer => (
                  <CustomerGridCard
                    key={customer.id}
                    customer={customer}
                    onView={(c) => setSelectedCustomerForDetails(c)}
                    onEdit={(c) => { setEditingCustomer(c); setIsFormModalOpen(true); }}
                    onDelete={(c) => { setCustomerToDelete(c); setShowDeleteModal(true); }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {isFormModalOpen && (
        <CustomerFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleSuccess}
          customerToEdit={editingCustomer}
        />
      )}

      {selectedCustomerForDetails && (
        <CustomerDetailsModal
          customerId={selectedCustomerForDetails.id}
          customerName={selectedCustomerForDetails.name}
          isOpen={!!selectedCustomerForDetails}
          onClose={() => setSelectedCustomerForDetails(null)}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Customer"
          description={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.`}
          confirmText="Delete Customer"
        />
      )}
    </div>
  );
};

export default CustomersPage;
