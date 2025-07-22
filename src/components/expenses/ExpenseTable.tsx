import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Edit, Trash2, Search, FileX, Calendar, Tag, CreditCard, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Expense } from './Expenses';

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

type SortField = 'date' | 'amount' | 'expense_type' | 'paid_to';
type SortOrder = 'asc' | 'desc';

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, loading, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique categories and payment methods for filters
  const { categories, paymentMethods } = useMemo(() => {
    const cats = [...new Set(expenses.map(exp => exp.expense_type))].sort();
    const methods = [...new Set(expenses.map(exp => exp.payment_method))].sort();
    return {
      categories: cats.map(cat => ({ value: cat, label: cat })),
      paymentMethods: methods.map(method => ({ value: method, label: method }))
    };
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses;

    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.expense_type.toLowerCase().includes(lowercasedTerm) ||
        exp.paid_to.toLowerCase().includes(lowercasedTerm) ||
        (exp.notes && exp.notes.toLowerCase().includes(lowercasedTerm))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(exp => exp.expense_type === categoryFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter) {
      filtered = filtered.filter(exp => exp.payment_method === paymentMethodFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [expenses, searchTerm, categoryFilter, paymentMethodFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredAndSortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPaymentMethodFilter('');
    setSortField('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary-600 transition-colors"
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
      )}
    </button>
  );

  const TableSkeleton = () => (
    <div className="p-4">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileX className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No expenses found</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        {searchTerm || categoryFilter || paymentMethodFilter
          ? 'No expenses match your current filters.'
          : 'Get started by adding your first expense.'}
      </p>
      {(searchTerm || categoryFilter || paymentMethodFilter) && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
          Clear Filters
        </Button>
      )}
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedExpenses.length)} of {filteredAndSortedExpenses.length} expenses
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      {/* Header with Search and Filters */}
      <div className="p-4 border-b dark:border-gray-700 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="text-lg font-semibold">Expense Records</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={16} />
            {filteredAndSortedExpenses.length} of {expenses.length} expenses
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <Input
              id="search-expenses"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            id="category-filter"
            label=""
            options={categories}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Categories"
          />
          <Select
            id="payment-method-filter"
            label=""
            options={paymentMethods}
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Payment Methods"
          />
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>
      
      {loading ? <TableSkeleton /> : (
        <div>
          {/* Mobile View */}
          <div className="md:hidden p-4 space-y-3">
            {paginatedExpenses.length > 0 ? paginatedExpenses.map(exp => (
              <div key={exp.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800 dark:text-white">{exp.paid_to}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="icon" size="sm" onClick={() => onEdit(exp)} title="Edit">
                      <Edit size={16} />
                    </Button>
                    <Button variant="icon" size="sm" onClick={() => onDelete(exp)} title="Delete">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="font-bold text-lg text-red-500 dark:text-red-400 mb-2">
                  ₹{exp.amount.toLocaleString('en-IN')}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="flex items-center gap-2">
                    <Tag size={14}/> {exp.expense_type}
                  </p>
                  <p className="flex items-center gap-2">
                    <CreditCard size={14}/> {exp.payment_method}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar size={14}/> {new Date(exp.date).toLocaleDateString('en-GB')}
                  </p>
                  {exp.notes && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                      {exp.notes}
                    </p>
                  )}
                </div>
              </div>
            )) : <EmptyState />}
          </div>

          {/* Desktop View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    <SortButton field="date">Date</SortButton>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    <SortButton field="paid_to">Paid To</SortButton>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    <SortButton field="expense_type">Category</SortButton>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                    <SortButton field="amount">Amount</SortButton>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedExpenses.length > 0 ? paginatedExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {new Date(exp.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {exp.paid_to}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs">
                        {exp.expense_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-500 dark:text-red-400 text-right">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {exp.payment_method}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                      {exp.notes ? (
                        <span className="truncate block\" title={exp.notes}>
                          {exp.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(exp)}
                        title="Edit expense"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(exp)}
                        title="Delete expense"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination />
        </div>
      )}
    </Card>
  );
};

export default ExpenseTable;