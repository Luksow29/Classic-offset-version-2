import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { PackagePlus, CheckCircle2, AlertCircle } from 'lucide-react';

const StockForm: React.FC = () => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity_in: '',
    quantity_used: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { item_name, category, quantity_in, quantity_used } = formData;

    const { error } = await supabase.from('stock').insert([
      {
        item_name,
        category,
        quantity_in: Number(quantity_in),
        quantity_used: Number(quantity_used || 0),
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to add stock: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Stock added successfully!' });
      setFormData({ item_name: '', category: '', quantity_in: '', quantity_used: '' });
    }

    setLoading(false);
  };

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-primary" />
          Add New Stock Item
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            required
            placeholder="e.g. Printer Paper A4"
          />
          <Input
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Office Supplies"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Initial Quantity"
              name="quantity_in"
              type="number"
              value={formData.quantity_in}
              onChange={handleChange}
              required
              placeholder="0"
            />
            <Input
              label="Used Quantity"
              name="quantity_used"
              type="number"
              value={formData.quantity_used}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Stock Item'}
          </Button>

          {message && (
            <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default StockForm;
