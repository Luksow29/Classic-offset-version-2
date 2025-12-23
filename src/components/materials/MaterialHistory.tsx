import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import {
    History, Calendar, Filter, Download, RefreshCw,
    TrendingDown, TrendingUp, RotateCcw, Loader2, AlertTriangle, Search, Activity, DollarSign
} from 'lucide-react';

interface MaterialTransaction {
    id: string;
    material_name: string;
    transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    unit_of_measurement: string;
    unit_cost?: number;
    total_cost?: number;
    reference_number?: string;
    notes?: string;
    transaction_date: string;
    category_name?: string;
    supplier_name?: string;
    created_at: string;
}

interface FilterState {
    transactionType: string;
    category: string;
    startDate: string;
    endDate: string;
    search: string;
}

const MaterialHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        transactionType: '',
        category: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    const fetchTransactionHistory = async () => {
        setLoading(true);
        try {
            // Fetch material transactions with joined material details
            const { data, error } = await supabase
                .from('material_transactions')
                .select(`
          id, transaction_type, quantity, unit_cost, total_cost, 
          reference_number, notes, transaction_date, created_at,
          materials:material_id (
            material_name, unit_of_measurement, 
            category:material_categories(name),
            supplier:suppliers(name)
          )
        `)
                .order('transaction_date', { ascending: false });

            if (error) throw error;

            const formattedTransactions = (data || []).map((t: any) => ({
                id: t.id,
                material_name: t.materials?.material_name || 'Unknown Material',
                transaction_type: t.transaction_type,
                quantity: t.quantity,
                unit_of_measurement: t.materials?.unit_of_measurement || 'units',
                unit_cost: t.unit_cost,
                total_cost: t.total_cost,
                reference_number: t.reference_number,
                notes: t.notes,
                transaction_date: t.transaction_date,
                created_at: t.created_at,
                category_name: t.materials?.category?.name,
                supplier_name: t.materials?.supplier?.name
            }));

            setTransactions(formattedTransactions);

            // Extract unique categories for filter
            const uniqueCategories = [...new Set(formattedTransactions.map((t: MaterialTransaction) => t.category_name).filter(Boolean))];
            setCategories(uniqueCategories as string[]);

        } catch (error) {
            console.error('Error fetching material history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactionHistory();
    }, []);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            const matchesType = !filters.transactionType || transaction.transaction_type === filters.transactionType;
            const matchesCategory = !filters.category || transaction.category_name === filters.category;
            const matchesSearch = !filters.search ||
                transaction.material_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                transaction.reference_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
                transaction.notes?.toLowerCase().includes(filters.search.toLowerCase());

            let matchesDateRange = true;
            if (filters.startDate || filters.endDate) {
                const transactionDate = new Date(transaction.transaction_date);
                if (filters.startDate) {
                    matchesDateRange = matchesDateRange && transactionDate >= new Date(filters.startDate);
                }
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    matchesDateRange = matchesDateRange && transactionDate <= endDate;
                }
            }

            return matchesType && matchesCategory && matchesSearch && matchesDateRange;
        });
    }, [transactions, filters]);

    // Calculate summary
    const summary = useMemo(() => {
        const totalTransactions = filteredTransactions.length;
        const stockIn = filteredTransactions.filter(t => t.transaction_type === 'IN').length;
        const stockOut = filteredTransactions.filter(t => t.transaction_type === 'OUT').length;
        const adjustments = filteredTransactions.filter(t => t.transaction_type === 'ADJUSTMENT').length;
        const totalValue = filteredTransactions.reduce((sum, t) => sum + (t.total_cost || 0), 0);

        return { totalTransactions, stockIn, stockOut, adjustments, totalValue };
    }, [filteredTransactions]);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'IN': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'OUT': return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'IN': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'OUT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const clearFilters = () => {
        setFilters({ transactionType: '', category: '', startDate: '', endDate: '', search: '' });
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Material', 'Category', 'Type', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Reference', 'Notes'];
        const csvData = filteredTransactions.map(t => [
            new Date(t.transaction_date).toLocaleDateString(),
            t.material_name,
            t.category_name || '-',
            t.transaction_type,
            t.quantity,
            t.unit_of_measurement,
            t.unit_cost || '-',
            t.total_cost || '-',
            t.reference_number || '-',
            t.notes || '-'
        ]);

        const csvContent = [headers, ...csvData].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `material-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Card>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2">Loading history...</span>
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
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Material Transaction History</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={fetchTransactionHistory} variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                        </Button>
                        <Button onClick={exportToCSV} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" /> Export CSV
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
                        <div className="text-xl font-bold text-green-800 dark:text-green-200">{summary.stockIn}</div>
                    </div>

                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-900/50">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <div className="text-xs font-semibold text-red-600 dark:text-red-400">STOCK OUT</div>
                        </div>
                        <div className="text-xl font-bold text-red-800 dark:text-red-200">{summary.stockOut}</div>
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
                        <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200">₹{summary.totalValue.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-muted/40 rounded-lg">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <Input
                            id="search-history"
                            placeholder="Search by material, ref, notes..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>

                    <Select
                        id="type-filter"
                        label=""
                        options={[
                            { value: 'IN', label: 'Stock In' },
                            { value: 'OUT', label: 'Stock Out' },
                            { value: 'ADJUSTMENT', label: 'Adjustment' }
                        ]}
                        value={filters.transactionType}
                        onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                        placeholder="All Types"
                    />

                    <Select
                        id="category-filter"
                        label=""
                        options={categories.map(c => ({ value: c, label: c }))}
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        placeholder="All Categories"
                    />

                    <div className="flex gap-2 col-span-1 md:col-span-2 lg:col-span-2">
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="h-9 text-sm"
                        />
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="h-9 text-sm"
                        />
                        <Button onClick={clearFilters} variant="outline" size="sm" title="Clear Filters">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="overflow-x-auto rounded-md border border-gray-100 dark:border-gray-700">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Material</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Quantity</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total Cost</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ref / Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{new Date(t.transaction_date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{t.material_name}</div>
                                        <div className="text-xs text-gray-500">{t.category_name}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTransactionColor(t.transaction_type)}`}>
                                            {getTransactionIcon(t.transaction_type)}
                                            {t.transaction_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-medium ${t.transaction_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                                            {t.transaction_type === 'OUT' ? '-' : '+'}{t.quantity} {t.unit_of_measurement}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {t.total_cost ? `₹${t.total_cost.toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{t.reference_number || '-'}</div>
                                        {t.notes && <div className="text-xs text-gray-500 max-w-[200px] truncate">{t.notes}</div>}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <AlertTriangle className="w-8 h-8 opacity-50 mb-2" />
                                            <p>No transactions found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
};

export default MaterialHistory;
