import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';
import ComprehensiveProductView from './ComprehensiveProductView';
import ProductViewModal from './ProductViewModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import Modal from '../ui/Modal';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';

import { Product } from './types';

const ProductMaster: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [formLoading, setFormLoading] = useState(false);

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
    try {
      const performSave = async () => {
        const { error } = await (editingProduct
          ? supabase.from('products').update(productData).eq('id', editingProduct.id)
          : supabase.from('products').insert(productData));
        if (error) throw error;
      };

      await toast.promise(
        performSave(),
        {
          loading: editingProduct ? 'Updating product...' : 'Adding product...',
          success: `Product ${editingProduct ? 'updated' : 'added'} successfully!`,
          error: (err) => err.message || 'Failed to save product.'
        }
      );

      fetchProducts();
      setIsAddModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setFormLoading(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
      if (error) throw error;

      toast.success(`Product "${productToDelete.name}" deleted.`);
      fetchProducts();
      setProductToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          Products & Services
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Manage your catalog of items and services offered to customers.
        </p>
      </div>

      {/* Main Content */}
      <ComprehensiveProductView
        products={products}
        loading={loading}
        onAdd={() => setIsAddModalOpen(true)}
        onView={setViewingProduct}
        onEdit={(product) => {
          setEditingProduct(product);
          setIsAddModalOpen(true);
        }}
        onDelete={setProductToDelete}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        size="lg"
      >
        <div className="pt-4">
          <ProductForm
            editingProduct={editingProduct}
            onSave={handleSave}
            onCancel={() => {
              setIsAddModalOpen(false);
              setEditingProduct(null);
            }}
            isLoading={formLoading}
          />
        </div>
      </Modal>

      {/* View Modal */}
      <ProductViewModal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        isLoading={formLoading}
      />
    </div>
  );
};

export default ProductMaster;
