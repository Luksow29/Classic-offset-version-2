import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2, AlertCircle, Plus, Minus, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { Material } from './MaterialsPage';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface MaterialTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  onSuccess: () => void;
}

const MaterialTransactionModal: React.FC<MaterialTransactionModalProps> = ({
  isOpen,
  onClose,
  material,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    transaction_type: 'IN',
    quantity: '',
    unit_cost: '',
    total_cost: '',
    reference_number: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && material) {
      setFormData({
        transaction_type: 'IN',
        quantity: '',
        unit_cost: String(material.cost_per_unit),
        total_cost: '',
        reference_number: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setError(null);
    }
  }, [isOpen, material]);

  // Calculate total cost when quantity or unit cost changes
  React.useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitCost = parseFloat(formData.unit_cost) || 0;
    const totalCost = quantity * unitCost;

    if (quantity > 0 && unitCost > 0) {
      setFormData(prev => ({ ...prev, total_cost: totalCost.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, total_cost: '' }));
    }
  }, [formData.quantity, formData.unit_cost]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.transaction_type) return 'Transaction type is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) return 'Quantity must be greater than zero';
    if (formData.transaction_type === 'OUT' && material) {
      const requestedQuantity = parseFloat(formData.quantity);
      if (requestedQuantity > material.current_quantity) {
        return `Cannot remove ${requestedQuantity} ${material.unit_of_measurement}. Only ${material.current_quantity} available.`;
      }
    }
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

    if (!material) return;

    setLoading(true);
    try {
      const transactionData = {
        material_id: material.id,
        transaction_type: formData.transaction_type,
        quantity: parseFloat(formData.quantity),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
        reference_number: formData.reference_number.trim() || null,
        notes: formData.notes.trim() || null,
        transaction_date: formData.transaction_date,
      };

      const { error } = await supabase
        .from('material_transactions')
        .insert([transactionData]);

      if (error) throw error;

      toast.success(`Transaction recorded successfully`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const transactionTypeOptions = [
    { value: 'IN', label: 'Stock In (Add)' },
    { value: 'OUT', label: 'Stock Out (Remove)' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'IN': return <Plus className="w-4 h-4 text-green-500" />;
      case 'OUT': return <Minus className="w-4 h-4 text-red-500" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  if (!isOpen || !material) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={null}
      size="lg"
    >
      <div className="flex items-center gap-3 mb-6 p-1">
        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <ArrowRightLeft className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Transaction</h2>
          <p className="text-sm text-gray-500">
            Update stock for "{material.material_name}"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Current Stock Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-sm text-blue-700 dark:text-blue-300">Currently Available</span>
          <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{material.current_quantity} {material.unit_of_measurement}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Transaction Type *
            </label>
            <div className="relative">
              <select
                id="transaction_type"
                value={formData.transaction_type}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white transition-all appearance-none"
              >
                {transactionTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getTransactionIcon(formData.transaction_type)}
              </div>
            </div>
          </div>

          <Input
            id="transaction_date"
            label="Transaction Date *"
            type="date"
            value={formData.transaction_date}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            id="quantity"
            label={`Quantity (${material.unit_of_measurement}) *`}
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantity}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="0.00"
          />

          <Input
            id="unit_cost"
            label="Unit Cost (₹)"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost}
            onChange={handleChange}
            disabled={loading}
            placeholder="0.00"
          />

          <Input
            id="total_cost"
            label="Total Cost (₹)"
            type="number"
            step="0.01"
            min="0"
            value={formData.total_cost}
            onChange={handleChange}
            disabled={loading}
            placeholder="Auto-calculated"
          />
        </div>

        <Input
          id="reference_number"
          label="Reference Number"
          value={formData.reference_number}
          onChange={handleChange}
          disabled={loading}
          placeholder="e.g., PO-2024-001, Invoice #123"
        />

        <TextArea
          id="notes"
          label="Notes"
          value={formData.notes}
          onChange={handleChange}
          disabled={loading}
          placeholder="Additional notes about this transaction..."
          rows={3}
        />

        {/* Transaction Preview */}
        {formData.quantity && !isNaN(parseFloat(formData.quantity)) && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm border border-gray-100 dark:border-gray-600">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">New Quantity Preview</h4>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current: {material.current_quantity}</span>
              <span className="text-gray-400">→</span>
              <span className={`font-bold ${formData.transaction_type === 'IN' ? 'text-green-600' :
                  formData.transaction_type === 'OUT' ? 'text-red-600' : 'text-blue-600'
                }`}>
                {formData.transaction_type === 'IN'
                  ? (material.current_quantity + parseFloat(formData.quantity)).toFixed(2)
                  : formData.transaction_type === 'OUT'
                    ? (material.current_quantity - parseFloat(formData.quantity)).toFixed(2)
                    : parseFloat(formData.quantity).toFixed(2)
                }
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
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
            className="min-w-[120px]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MaterialTransactionModal;