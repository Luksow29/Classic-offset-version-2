import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  Eye,
  Loader2,
  AlertTriangle,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';

interface InvoiceRow {
  order_id: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  order_date?: string; // Assuming the view has this or we might need to add it
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Due' | 'Partial'>('All');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: viewError } = await supabase
          .from('all_order_summary')
          .select('order_id, customer_name, customer_phone, total_amount, amount_paid, balance_due')
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
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Invoices & Billing
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage payments, track revenue, and view invoice history.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-primary bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collected</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.collected.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.outstanding.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invoices</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingCount}</h3>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Controls & Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search customer, phone or order ID..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Paid', 'Partial', 'Due'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterStatus === status
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

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
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p>No invoices found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InvoiceList;
