// src/components/products/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';
import { Product } from './ProductMaster';

interface ProductFormProps {
  editingProduct: Product | null;
  onSave: (productData: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ editingProduct, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit_price: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        unit_price: String(editingProduct.unit_price || ''),
        description: editingProduct.description || '',
        category: editingProduct.category || '',
      });
    } else {
      setFormData({ name: '', unit_price: '', description: '', category: '' });
    }
  }, [editingProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit_price || !formData.category) {
        alert("Please fill all required fields.");
        return;
    }
    onSave({
        ...formData,
        unit_price: parseFloat(formData.unit_price)
    });
  };

  const categoryOptions = [
    { value: 'Business Cards', label: 'Business Cards' }, { value: 'Invitation Cards', label: 'Invitation Cards' },
    { value: 'Flyers', label: 'Flyers' }, { value: 'Brochures', label: 'Brochures' },
    { value: 'Posters', label: 'Posters' }, { value: 'Banners', label: 'Banners' },
    { value: 'Booklets', label: 'Booklets' },
  ];

  return (
    <Card>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {editingProduct ? '✏️ Edit Product' : ' Add New Product'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="name" label="Product Name *" value={formData.name} onChange={handleChange} required disabled={isLoading} />
          <Input id="unit_price" label="Unit Price (₹) *" type="number" step="0.01" value={formData.unit_price} onChange={handleChange} required disabled={isLoading} />
          <Select id="category" label="Category *" value={formData.category} onChange={handleChange} options={categoryOptions} required disabled={isLoading} placeholder="Select a category" />
          <TextArea id="description" label="Description" value={formData.description} onChange={handleChange} disabled={isLoading} />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Update Product' : 'Save Product')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default ProductForm;