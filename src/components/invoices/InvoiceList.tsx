import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useResponsiveViewMode } from '../../hooks/useResponsiveViewMode';

import {
  Eye,
  Loader2,
  AlertTriangle,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  LayoutGrid,
  List
} from 'lucide-react';
import InvoiceGridCard from './InvoiceGridCard';
import Pagination from '../ui/Pagination';

interface InvoiceRow {
  order_id: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  order_date?: string;
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Due' | 'Partial'>('All');

  // View Mode & Pagination
  const { viewMode, setViewMode } = useResponsiveViewMode();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: viewError } = await supabase
          .from('all_order_summary')
          .select('order_id, customer_name, customer_phone, total_amount, amount_paid, balance_due, order_date')
          .order('order_id', { ascending: false });

        if (viewError) throw viewError;

        setInvoices(data || []);
      } catch (err: any) {
        console.error('Error fetching invoice data:', err);
        setError(`Failed to load invoices. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const collected = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const outstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
    const pendingCount = invoices.filter(inv => inv.balance_due > 0).length;
    return { totalRevenue, collected, outstanding, pendingCount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (filterStatus !== 'All') {
      result = result.filter(inv => {
        if (filterStatus === 'Paid') return inv.balance_due <= 0;
        if (filterStatus === 'Due') return inv.balance_due > 0 && inv.amount_paid === 0;
        if (filterStatus === 'Partial') return inv.balance_due > 0 && inv.amount_paid > 0;
        return true;
      });
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.customer_name?.toLowerCase().includes(lowercasedTerm) ||
        inv.customer_phone?.includes(lowercasedTerm) ||
        String(inv.order_id).includes(lowercasedTerm)
      );
    }
    return result;
  }, [invoices, searchTerm, filterStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, viewMode]);


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-gray-500">Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Error Loading Invoices</h3>
          <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Header - Compact on Mobile */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <FileText className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Invoices</h1>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm hidden sm:block">Manage payments and track revenue.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - 3 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-primary bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-primary/10 rounded-xl">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">₹{(stats.totalRevenue / 1000).toFixed(0)}k</h3>
          </div>
        </Card>
        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10 rounded-xl lg:block hidden">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Collected</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">₹{(stats.collected / 1000).toFixed(0)}k</h3>
          </div>
        </Card>
        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10 rounded-xl">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">₹{(stats.outstanding / 1000).toFixed(0)}k</h3>
          </div>
        </Card>
        <Card className="p-2 sm:p-4 border-l-2 sm:border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/10 rounded-xl">
          <div className="flex flex-col">
            <p className="text-[8px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pending</p>
            <h3 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.pendingCount}</h3>
          </div>
        </Card>
      </div>

      {/* Controls - Compact on Mobile */}
      <Card className="overflow-visible rounded-xl">
        <div className="p-2 sm:p-4 flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <Input
              placeholder="Search customer, phone or order ID..."
              className="pl-7 sm:pl-9 text-xs sm:text-sm py-1.5 sm:py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-1 sm:gap-2 items-center overflow-x-auto">
            {['All', 'Paid', 'Partial', 'Due'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm font-medium rounded-md sm:rounded-lg transition-colors whitespace-nowrap ${filterStatus === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {status}
              </button>
            ))}
            <div className="w-px h-4 sm:h-6 bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2" />
            <div className="flex p-0.5 sm:p-1 bg-gray-100 dark:bg-gray-800 rounded-md sm:rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 sm:p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="List View"
              >
                <List size={14} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 sm:p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Grid View"
              >
                <LayoutGrid size={14} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      <div className="space-y-6">
        {paginatedInvoices.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Invoice #</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Customer</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Paid</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Balance</th>
                        <th className="px-6 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {paginatedInvoices.map((inv) => (
                        <tr key={inv.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                          <td className="px-6 py-4 font-medium text-primary"> #{inv.order_id} </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{inv.customer_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{inv.customer_phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">₹{inv.total_amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">₹{inv.amount_paid.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-right font-bold ${inv.balance_due > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                            ₹{inv.balance_due.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${inv.balance_due <= 0
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                : inv.amount_paid > 0
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                              {inv.balance_due <= 0 ? 'Paid' : inv.amount_paid > 0 ? 'Partial' : 'Due'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/invoices/${inv.order_id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4 text-gray-500 hover:text-primary transition-colors" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedInvoices.map((inv) => (
                  <InvoiceGridCard key={inv.order_id} invoice={inv} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Invoices Found</h3>
            <p>Try adjusting your search or filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
