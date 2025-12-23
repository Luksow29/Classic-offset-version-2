// src/components/products/ProductForm.tsx
import React, { useState, useEffect } from 'react';
// import Card from '../ui/Card'; // Removed
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';
import { Product } from './types';
import { supabase } from '@/lib/supabaseClient';

interface ProductFormProps {
  editingProduct: Product | null;
  onSave: (productData: Omit<Product, 'id' | 'created_at'> & { image_url?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ editingProduct, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit_price: '',
    description: '',
    category: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        unit_price: String(editingProduct.unit_price || ''),
        description: editingProduct.description || '',
        category: editingProduct.category || '',
        image_url: editingProduct.image_url || '',
      });
      if (editingProduct.image_url) {
        // Handle both absolute (http) and relative (storage path) URLs
        const previewUrl = editingProduct.image_url.startsWith('http')
          ? editingProduct.image_url
          : supabase.storage.from('product_images').getPublicUrl(editingProduct.image_url).data.publicUrl;
        setImagePreview(previewUrl);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({ name: '', unit_price: '', description: '', category: '', image_url: '' });
      setImagePreview(null);
    }
  }, [editingProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName; // Removed 'public/' prefix

    const { error } = await supabase.storage
      .from('product_images')
      .upload(filePath, imageFile);

    if (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image.');
      return null;
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit_price || !formData.category) {
      alert("Please fill all required fields.");
      return;
    }

    let imageUrl = formData.image_url;
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        // Handle upload failure
        return;
      }
    }

    onSave({
      name: formData.name,
      unit_price: parseFloat(formData.unit_price),
      description: formData.description,
      category: formData.category,
      image_url: imageUrl,
    });
  };

  const categoryOptions = [
    { value: 'Business Cards', label: 'Business Cards' }, { value: 'Invitation Cards', label: 'Invitation Cards' },
    { value: 'Flyers', label: 'Flyers' }, { value: 'Brochures', label: 'Brochures' },
    { value: 'Posters', label: 'Posters' }, { value: 'Banners', label: 'Banners' },
    { value: 'Booklets', label: 'Booklets' },
  ];

  return (
    <div className="space-y-4">
      {/* Header removed, Modal title handles it */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" label="Product Name *" value={formData.name} onChange={handleChange} required disabled={isLoading} />
        <Input id="unit_price" label="Unit Price (₹) *" type="number" step="0.01" value={formData.unit_price} onChange={handleChange} required disabled={isLoading} />
        <Select id="category" label="Category *" value={formData.category} onChange={handleChange} options={categoryOptions} required disabled={isLoading} placeholder="Select a category" />
        <TextArea id="description" label="Description" value={formData.description} onChange={handleChange} disabled={isLoading} />

        <div>
          <label htmlFor="product_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
          <div className="mt-1 flex items-center">
            {imagePreview && (
              <img src={imagePreview} alt="Product Preview" className="w-20 h-20 object-cover rounded-md mr-4" />
            )}
            <div className="flex-1">
              <Input id="product_image" type="file" onChange={handleImageChange} accept="image/*" disabled={isLoading} />
              <p className="text-xs text-gray-500 mt-1">Upload a JPG, PNG, or GIF. Max size 2MB.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Update Product' : 'Save Product')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
