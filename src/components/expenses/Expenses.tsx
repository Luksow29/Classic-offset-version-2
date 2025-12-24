// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ExpenseTable from './ExpenseTable';
import ExpenseFormModal from './ExpenseFormModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { Plus, Wallet, TrendingUp, Loader2, DollarSign, Tag, CreditCard } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface Expense {
  id: string;
  date: string;
  expense_type: string;
  paid_to: string;
  amount: number;
  payment_method: string;
  notes?: string;
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSave = async (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
    const promise = editingExpense
      ? supabase.from('expenses').update(expenseData).eq('id', editingExpense.id)
      : supabase.from('expenses').insert([expenseData]);

    await toast.promise(promise, {
      loading: 'Saving expense...',
      success: `Expense ${editingExpense ? 'updated' : 'added'} successfully!`,
      error: (err) => err.message || 'Failed to save expense.',
    });

    const { error } = await promise;
    if (!error) {
      setShowFormModal(false);
      setEditingExpense(null);
      fetchExpenses();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowFormModal(true);
  };

  const handleDeleteRequest = (expense: Expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    const promise = supabase.from('expenses').delete().eq('id', expenseToDelete.id);
    await toast.promise(promise, {
      loading: 'Deleting expense...',
      success: 'Expense deleted successfully.',
      error: (err) => err.message || "Failed to delete expense."
    });

    const { error } = await promise;
    if (!error) {
      fetchExpenses();
    }
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  // --- Statistics & Charts Data ---

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Monthly Expenses (Current Month)
    const now = new Date();
    const currentMonthExpenses = expenses.filter(exp =>
      isWithinInterval(new Date(exp.date), {
        start: startOfMonth(now),
        end: endOfMonth(now)
      })
    ).reduce((sum, exp) => sum + exp.amount, 0);

    // Group by Category
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.expense_type] = (acc[exp.expense_type] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Find Top Category
    let topCategory = { name: 'N/A', amount: 0 };
    Object.entries(byCategory).forEach(([name, amount]) => {
      if (amount > topCategory.amount) {
        topCategory = { name, amount };
      }
    });

    // Chart Data: Categories
    const categoryChartData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Chart Data: Trend (Last 30 Days)
    const trendMap = new Map<string, number>();
    for (let i = 30; i >= 0; i--) {
      trendMap.set(format(subDays(new Date(), i), 'MMM dd'), 0);
    }
    expenses.forEach(exp => {
      const dateStr = format(new Date(exp.date), 'MMM dd');
      if (trendMap.has(dateStr)) {
        trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + exp.amount);
      }
    });
    const trendChartData = Array.from(trendMap.entries()).map(([date, amount]) => ({ date, amount }));

    return { total, currentMonthExpenses, topCategory, categoryChartData, trendChartData };
  }, [expenses]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            Expense Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage all your business expenses.</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setShowFormModal(true); }} className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" /> Record Expense
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-2 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase">Total</p>
              <h3 className="text-sm sm:text-xl lg:text-3xl font-bold text-foreground mt-0.5 sm:mt-2">₹{(metrics.total / 1000).toFixed(0)}k</h3>
            </div>
            <div className="p-1.5 sm:p-3 bg-primary/10 rounded-lg text-primary">
              <DollarSign size={14} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-orange-500/5 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase">Month</p>
              <h3 className="text-sm sm:text-xl lg:text-3xl font-bold text-foreground mt-0.5 sm:mt-2">₹{(metrics.currentMonthExpenses / 1000).toFixed(0)}k</h3>
            </div>
            <div className="p-1.5 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <TrendingUp size={14} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-purple-500/5 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase">Top</p>
              <h3 className="text-xs sm:text-lg lg:text-2xl font-bold text-foreground mt-0.5 sm:mt-2 truncate max-w-[60px] sm:max-w-[150px]" title={metrics.topCategory.name}>{metrics.topCategory.name}</h3>
            </div>
            <div className="p-1.5 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
              <Tag size={14} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Expense Trends (Last 30 Days)</h3>
          <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trendChartData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px', border: '1px solid var(--border)' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Donut Chart */}
        <Card className="p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Expenses by Category</h3>
          <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={metrics.categoryChartData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {metrics.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px', border: '1px solid var(--border)' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <ExpenseFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSave}
        editingExpense={editingExpense}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete this expense? (${expenseToDelete?.expense_type} - ₹${expenseToDelete?.amount})`}
        confirmText="Delete"
      />
    </div>
  );
};

export default Expenses;
