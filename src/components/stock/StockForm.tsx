import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const StockForm: React.FC = () => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity_in: '',
    quantity_used: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    setMessage('');

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
      setMessage('❌ Failed to add stock: ' + error.message);
    } else {
      setMessage('✅ Stock added successfully!');
      setFormData({ item_name: '', category: '', quantity_in: '', quantity_used: '' });
    }

    setLoading(false);
  };

  return (
    <Card title=" Add New Stock Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name"
          name="item_name"
          value={formData.item_name}
          onChange={handleChange}
          required
        />
        <Input
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
        />
        <Input
          label="Quantity In"
          name="quantity_in"
          type="number"
          value={formData.quantity_in}
          onChange={handleChange}
          required
        />
        <Input
          label="Quantity Used"
          name="quantity_used"
          type="number"
          value={formData.quantity_used}
          onChange={handleChange}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Stock'}
        </Button>
        {message && <p className="text-sm text-center">{message}</p>}
      </form>
    </Card>
  );
};

export default StockForm;
