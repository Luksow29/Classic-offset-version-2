// @ts-nocheck
// src/components/products/ProductMaster.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';
import ProductViewModal from './ProductViewModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export interface Product {
  id: number;
  name: string;
  unit_price: number;
  description?: string;
  category?: string;
  created_at: string;
  image_url?: string;
}

export interface ProductFormData {
  name: string;
  unit_price: number;
  description?: string;
  category?: string;
  image_url?: string;
}

const ProductMaster: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSave = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    setFormLoading(true);
    const promise = editingProduct
      ? supabase.from('products').update(productData).eq('id', editingProduct.id)
      : supabase.from('products').insert(productData);

    toast.promise(
      promise,
      {
        loading: editingProduct ? 'Updating product...' : 'Adding product...',
        success: (result) => {
          if (result.error) {
            throw result.error;
          }
          setEditingProduct(null);
          fetchProducts();
          setFormLoading(false);
          return `Product "${productData.name}" ${editingProduct ? 'updated' : 'added'}!`;
        },
        error: (err) => {
          setFormLoading(false);
          return err.message || 'Failed to save product.';
        },
      }
    );
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    document.getElementById('product-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
  };
  
  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    const productToDeleteName = productToDelete.name;
    const productToDeleteId = productToDelete.id;

    setFormLoading(true);
    
    const promise = supabase.from('products').delete().eq('id', productToDeleteId);
    
    toast.promise(promise, {
        loading: 'Deleting product...',
        success: (result) => {
            if (result.error) throw result.error;
            fetchProducts();
            setFormLoading(false);
            setProductToDelete(null);
            return `Product "${productToDeleteName}" deleted.`;
        },
        error: (err) => {
            setFormLoading(false);
            setProductToDelete(null);
            return err.message || 'Failed to delete product.'
        }
    });
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📦 Products & Services</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all items you offer to customers.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
           <ProductTable 
                products={products}
                loading={loading}
                onView={handleView}
                onEdit={handleEdit} 
                onDelete={handleDeleteRequest}
            />
        </div>
        <div className="lg:col-span-1" id="product-form-card">
            <ProductForm
                editingProduct={editingProduct}
                onSave={handleSave}
                onCancel={() => setEditingProduct(null)}
                isLoading={formLoading}
            />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={formLoading}
      />

      <ProductViewModal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
      />
    </div>
  );
};

export default ProductMaster;
