import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Expense } from './Expenses';
import { logActivity } from '@/lib/activityLogger';
import { useUser } from '@/context/UserContext';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id'>) => Promise<void>;
  editingExpense: Expense | null;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
}) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    expense_type: '',
    paid_to: '',
    amount: '',
    payment_method: 'Cash',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or editing expense changes
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setFormData({
          date: editingExpense.date,
          expense_type: editingExpense.expense_type,
          paid_to: editingExpense.paid_to,
          amount: String(editingExpense.amount),
          payment_method: editingExpense.payment_method,
          notes: editingExpense.notes || '',
        });
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          expense_type: '',
          paid_to: '',
          amount: '',
          payment_method: 'Cash',
          notes: '',
        });
      }
      setError(null);
    }
  }, [isOpen, editingExpense]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.date) return 'Date is required';
    if (!formData.expense_type) return 'Expense type is required';
    if (!formData.paid_to.trim()) return 'Paid to field is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) return 'Amount must be greater than zero';
    if (!formData.payment_method) return 'Payment method is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        date: formData.date,
        expense_type: formData.expense_type,
        paid_to: formData.paid_to.trim(),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || undefined,
      };
      await onSave(expenseData);

      // Log activity
      const userName = userProfile?.name || 'Admin';
      const activityMessage = editingExpense
        ? `Updated an expense of ₹${expenseData.amount.toLocaleString('en-IN')} for "${expenseData.expense_type}"`
        : `Added a new expense: ₹${expenseData.amount.toLocaleString('en-IN')} for "${expenseData.expense_type}" paid to ${expenseData.paid_to}`;
      await logActivity(activityMessage, userName);

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const expenseTypeOptions = [
    { value: 'Rent', label: 'Rent' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Materials', label: 'Materials' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Salaries', label: 'Salaries' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Miscellaneous', label: 'Miscellaneous' },
  ];

  const paymentMethodOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Debit Card', label: 'Debit Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Check', label: 'Check' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="date"
            label="Date *"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <Select
            id="expense_type"
            label="Expense Type *"
            options={expenseTypeOptions}
            value={formData.expense_type}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Select expense type"
          />
        </div>

        <Input
          id="paid_to"
          label="Paid To *"
          value={formData.paid_to}
          onChange={handleChange}
          required
          disabled={loading}
          placeholder="e.g., TNEB, Vendor Name, Employee Name"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="amount"
            label="Amount (₹) *"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="e.g., 5000"
          />
          <Select
            id="payment_method"
            label="Payment Method *"
            options={paymentMethodOptions}
            value={formData.payment_method}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <TextArea
          id="notes"
          label="Notes (Optional)"
          value={formData.notes}
          onChange={handleChange}
          disabled={loading}
          placeholder="Any additional details about this expense..."
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              editingExpense ? 'Update Expense' : 'Save Expense'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseFormModal;
