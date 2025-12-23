import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import {
  History, Package, ShoppingCart, Calendar, User, FileText,
  Filter, Download, RefreshCw, TrendingDown, TrendingUp,
  RotateCcw, Loader2, AlertTriangle, Search, Activity, DollarSign
} from 'lucide-react';

interface StockTransaction {
  id: string;
  item_name: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'USAGE';
  quantity: number;
  unit_of_measurement: string;
  used_for?: string;
  notes?: string;
  transaction_date: string;
  source: 'existing_stock' | 'materials';
  category?: string;
  supplier_name?: string;
  reference_number?: string;
  user_name?: string;
  cost_per_unit?: number;
  total_cost?: number;
}

interface FilterState {
  source: string;
  transactionType: string;
  category: string;
  startDate: string;
  endDate: string;
  search: string;
}

const StockHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    source: '',
    transactionType: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      const transactionPromises = [];

      // Fetch existing stock usage logs
      transactionPromises.push(
        supabase
          .from('stock_usage_log')
          .select(`
            id, used_quantity, used_for, used_at,
            stock:stock_id (
              item_name, category
            )
          `)
          .order('used_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((log: any) => ({
              id: `usage_${log.id}`,
              item_name: log.stock?.item_name || 'Unknown Item',
              transaction_type: 'USAGE' as const,
              quantity: log.used_quantity,
              unit_of_measurement: 'pieces',
              used_for: log.used_for,
              notes: undefined, // No notes column in stock_usage_log
              transaction_date: log.used_at,
              source: 'existing_stock' as const,
              category: log.stock?.category
            }));
          })
      );

      // Fetch material transactions
      transactionPromises.push(
        supabase
          .from('material_transactions')
          .select(`
            id, transaction_type, quantity, unit_cost, total_cost, 
            reference_number, notes, transaction_date,
            materials:material_id (
              material_name, unit_of_measurement, category:material_categories(name),
              supplier:suppliers(name)
            )
          `)
          .order('transaction_date', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((transaction: any) => ({
              id: `material_${transaction.id}`,
              item_name: transaction.materials?.material_name || 'Unknown Material',
              transaction_type: transaction.transaction_type,
              quantity: transaction.quantity,
              unit_of_measurement: transaction.materials?.unit_of_measurement || 'pieces',
              notes: transaction.notes,
              transaction_date: transaction.transaction_date,
              source: 'materials' as const,
              category: transaction.materials?.category?.name,
              supplier_name: transaction.materials?.supplier?.name,
              reference_number: transaction.reference_number,
              cost_per_unit: transaction.unit_cost,
              total_cost: transaction.total_cost
            }));
          })
      );

      const results = await Promise.all(transactionPromises);
      const allTransactions = results.flat();

      // Sort by date (most recent first)
      allTransactions.sort((a, b) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      setTransactions(allTransactions);

      // Extract unique categories for filter
      const uniqueCategories = [...new Set(allTransactions.map(t => t.category).filter(Boolean))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSource = !filters.source || transaction.source === filters.source;
      const matchesType = !filters.transactionType || transaction.transaction_type === filters.transactionType;
      const matchesCategory = !filters.category || transaction.category === filters.category;
      const matchesSearch = !filters.search ||
        transaction.item_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.used_for?.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(filters.search.toLowerCase());

      let matchesDateRange = true;
      if (filters.startDate || filters.endDate) {
        const transactionDate = new Date(transaction.transaction_date);
        if (filters.startDate) {
          matchesDateRange = matchesDateRange && transactionDate >= new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDateRange = matchesDateRange && transactionDate <= endDate;
        }
      }

      return matchesSource && matchesType && matchesCategory && matchesSearch && matchesDateRange;
    });
  }, [transactions, filters]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const inTransactions = filteredTransactions.filter(t => t.transaction_type === 'IN').length;
    const outTransactions = filteredTransactions.filter(t => ['OUT', 'USAGE'].includes(t.transaction_type)).length;
    const adjustments = filteredTransactions.filter(t => t.transaction_type === 'ADJUSTMENT').length;
    const totalValue = filteredTransactions.reduce((sum, t) => sum + (t.total_cost || 0), 0);

    return { totalTransactions, inTransactions, outTransactions, adjustments, totalValue };
  }, [filteredTransactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'OUT':
      case 'USAGE':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'ADJUSTMENT':
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'OUT':
      case 'USAGE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Item Name', 'Source', 'Type', 'Quantity', 'Unit',
      'Category', 'Used For', 'Reference', 'Cost', 'Notes'
    ];

    const csvData = filteredTransactions.map(transaction => [
      new Date(transaction.transaction_date).toLocaleDateString(),
      transaction.item_name,
      transaction.source === 'existing_stock' ? 'Existing Stock' : 'Materials',
      transaction.transaction_type,
      transaction.quantity,
      transaction.unit_of_measurement,
      transaction.category || '-',
      transaction.used_for || '-',
      transaction.reference_number || '-',
      transaction.total_cost ? `₹${transaction.total_cost}` : '-',
      transaction.notes || '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      source: '',
      transactionType: '',
      category: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading transaction history...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Stock History
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchTransactionHistory} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">TOTAL</div>
            </div>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-200">{summary.totalTransactions}</div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-900/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="text-xs font-semibold text-green-600 dark:text-green-400">STOCK IN</div>
            </div>
            <div className="text-xl font-bold text-green-800 dark:text-green-200">{summary.inTransactions}</div>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-900/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">STOCK OUT</div>
            </div>
            <div className="text-xl font-bold text-red-800 dark:text-red-200">{summary.outTransactions}</div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-900/50">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">ADJUSTMENTS</div>
            </div>
            <div className="text-xl font-bold text-purple-800 dark:text-purple-200">{summary.adjustments}</div>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">VALUE</div>
            </div>
            <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200">₹{summary.totalValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 p-4 bg-muted/40 rounded-lg">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <Input
              id="search-history"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Select
            id="source-filter"
            label=""
            options={[
              { value: 'existing_stock', label: 'Existing Stock' },
              { value: 'materials', label: 'Materials' }
            ]}
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            placeholder="All Sources"
          />

          <Select
            id="type-filter"
            label=""
            options={[
              { value: 'IN', label: 'Stock In' },
              { value: 'OUT', label: 'Stock Out' },
              { value: 'USAGE', label: 'Usage' },
              { value: 'ADJUSTMENT', label: 'Adjustment' }
            ]}
            value={filters.transactionType}
            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
            placeholder="All Types"
          />

          <Select
            id="category-filter"
            label=""
            options={categories.map(cat => ({ value: cat, label: cat }))}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            placeholder="All Categories"
          />

          <Input
            id="start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="Start Date"
            className="h-9 text-sm"
          />

          <div className="flex gap-2">
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              placeholder="End Date"
              className="flex-1 h-9 text-sm"
            />
            <Button onClick={clearFilters} variant="outline" size="sm" title="Clear Filters">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Transaction History Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left font-medium">Used For / Reference</th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                  <th className="px-4 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.transaction_date).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{transaction.item_name}</div>
                        <div className="text-xs text-gray-500">
                          {transaction.category && `${transaction.category} • `}
                          {transaction.unit_of_measurement}
                          {transaction.supplier_name && ` • ${transaction.supplier_name}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${transaction.source === 'existing_stock'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                        {transaction.source === 'existing_stock' ? (
                          <><Package className="w-3 h-3 inline mr-1" />Existing</>
                        ) : (
                          <><ShoppingCart className="w-3 h-3 inline mr-1" />Materials</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getTransactionColor(transaction.transaction_type)}`}>
                        {getTransactionIcon(transaction.transaction_type)}
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${['OUT', 'USAGE'].includes(transaction.transaction_type) ? 'text-red-600' :
                          transaction.transaction_type === 'IN' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                        {['OUT', 'USAGE'].includes(transaction.transaction_type) ? '-' : '+'}
                        {transaction.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        {transaction.used_for && (
                          <div className="text-gray-900 dark:text-white text-sm">{transaction.used_for}</div>
                        )}
                        {transaction.reference_number && (
                          <div className="text-xs text-gray-500">Ref: {transaction.reference_number}</div>
                        )}
                        {!transaction.used_for && !transaction.reference_number && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {transaction.total_cost ? (
                        <span className="font-medium text-green-600">₹{transaction.total_cost.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        {transaction.notes ? (
                          <span className="text-gray-600 dark:text-gray-300 text-sm" title={transaction.notes}>
                            {transaction.notes.length > 50 ? `${transaction.notes.substring(0, 50)}...` : transaction.notes}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StockHistory;