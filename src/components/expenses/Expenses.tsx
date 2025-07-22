// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ExpenseTable from './ExpenseTable';
import ExpenseFormModal from './ExpenseFormModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { Plus, Wallet, TrendingUp, Loader2 } from 'lucide-react';

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

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">💸 Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track and manage all your expenses.</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setShowFormModal(true); }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      <Card>
        <div className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Expenses Logged</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">₹{totalExpenses.toLocaleString('en-IN')}</p>
        </div>
      </Card>

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
