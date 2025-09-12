// @ts-nocheck
// src/components/customers/CustomerTable.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CustomerDetailsModal from './CustomerDetailsModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { Eye, Edit, Trash2, Loader2, AlertTriangle, Search, UserPlus, Star, ChevronLeft, ChevronRight, ArrowUpDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import ImportExportCustomers from './enhancements/ImportExportCustomers';
import { Customer } from '@/types';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CustomerTableProps {
  onAddNew: () => void;
  onEdit: (customer: Customer) => void;
  onDataChange: () => void;
}

type SortField = 'name' | 'joined_date' | 'total_orders' | 'total_paid' | 'balance_due';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const CustomerTable: React.FC<CustomerTableProps> = ({ onAddNew, onEdit, onDataChange }) => {
  const { userProfile } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  const [sortField, setSortField] = useState<SortField>('joined_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const parentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tagFilter, sortField, sortOrder]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('customer_summary').select('*', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (tagFilter) {
        query = query.contains('tags', [tagFilter]);
      }

      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        const handledError = handleSupabaseError(fetchError, { 
          operation: 'select_customers', 
          table: 'customer_summary' 
        });
        if (handledError) throw handledError;
      }

      console.log('CustomerTable - Raw customer data:', data);
      console.log('CustomerTable - First customer structure:', data?.[0]);

      setCustomers(data || []);
      setTotalCustomers(count || 0);

    } catch (err: any) {
      console.error('Customer fetch error:', err);
      setError('Failed to load customers. Please check your permissions.');
      toast.error('Failed to load customers. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tagFilter, sortField, sortOrder, currentPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, onDataChange]);

  const totalPages = Math.ceil(totalCustomers / ITEMS_PER_PAGE);

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    setLoading(true);
    try {
      const { error: deleteError } = await supabase.rpc('delete_customer_and_related_data', { p_customer_id: customerToDelete.id });
      if (deleteError) throw deleteError;
      toast.success('Customer deleted successfully!');
      fetchCustomers(); // Refetch data
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err: any) {
      toast.error(`Failed to delete customer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => {
        setSortField(field);
        setSortOrder(prev => (sortField === field && prev === 'asc' ? 'desc' : 'asc'));
      }}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-primary' : ''} />
    </button>
  );

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
  });

  return (
    <Card>
      <div className="p-4 border-b space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-1/3">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
            <Input id="search-customers" placeholder="Search by name, phone, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
        <ImportExportCustomers />
        <Button onClick={onAddNew} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add New Customer
        </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input id="tag-filter" label="Filter by Tag" placeholder="e.g., VIP, Wholesale" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
          <Button onClick={() => { setSearchQuery(''); setTagFilter(''); }} variant="outline" className="self-end">
            Clear Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Loading customers...</span></div>
      ) : error ? (
        <div className="p-6 bg-destructive/10 text-destructive text-center"><AlertTriangle className="w-10 h-10 mx-auto mb-2" /><p className="font-semibold">Error Loading Customers</p><p className="text-sm">{error}</p></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" /><p className="font-semibold text-lg">No customers found.</p><p className="text-sm">Try adjusting your filters or add a new customer.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground"><SortButton field="name">Customer</SortButton></th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tags</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground"><SortButton field="total_orders">Orders</SortButton></th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground"><SortButton field="balance_due">Balance Due</SortButton></th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground"><SortButton field="joined_date">Joined</SortButton></th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    {(customer.total_spent || 0) > 10000 && <Star size={14} className="text-yellow-500 fill-current" title="Premium Customer"/>}
                    {customer.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground"><div>{customer.phone}</div><div className="text-xs">{customer.email}</div></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags?.map(tag => <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">{tag}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{customer.total_orders || 0}</td>
                  <td className={`px-4 py-3 text-right font-bold ${(customer.balance_due || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{((customer.balance_due || 0)).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(customer.joined_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" title="View Details" onClick={() => {
                      console.log('Opening customer details for:', customer);
                      console.log('Customer ID:', customer.id);
                      console.log('Customer Name:', customer.name);
                      setSelectedCustomerForDetails(customer);
                    }}><Eye size={16} /></Button>
                    <Button variant="ghost" size="sm" title="Edit Customer" onClick={() => onEdit(customer)}><Edit size={16} /></Button>
                    <Button variant="ghost" size="sm" title="Delete Customer" onClick={() => handleDeleteCustomer(customer)}><Trash2 size={16} className="text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 0 && (
        <div className="flex justify-between items-center p-4 border-t">
           <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({totalCustomers} total)</span>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} variant="outline" size="sm"><ChevronLeft size={16} /> Prev</Button>
            <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} variant="outline" size="sm">Next <ChevronRight size={16} /></Button>
          </div>
        </div>
      )}

      {selectedCustomerForDetails && <CustomerDetailsModal customerId={selectedCustomerForDetails.id} customerName={selectedCustomerForDetails.name} isOpen={!!selectedCustomerForDetails} onClose={() => setSelectedCustomerForDetails(null)} />}
      {showDeleteModal && <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Delete Customer" description={`Delete ${customerToDelete?.name}? This is irreversible.`} confirmText="Delete" />}
    </Card>
  );
};

export default CustomerTable;
