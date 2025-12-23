import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import Button from '../ui/Button';
import MaterialFormModal from './MaterialFormModal';
import MaterialViewModal from './MaterialViewModal';
import MaterialTransactionModal from './MaterialTransactionModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import ComprehensiveMaterialView from './ComprehensiveMaterialView';
import MaterialHistory from './MaterialHistory';
import { LayoutDashboard, History, Plus, Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface Material {
  id: string;
  material_name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_phone?: string;
  unit_of_measurement: string;
  current_quantity: number;
  minimum_stock_level: number;
  cost_per_unit: number;
  storage_location?: string;
  purchase_date?: string;
  last_purchase_date?: string;
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  total_value: number;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
}

export interface MaterialTransaction {
  id: string;
  material_id: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
  notes?: string;
  transaction_date: string;
  created_by?: string;
}

const MaterialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected items
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [transactionMaterial, setTransactionMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Handle URL queries for tab switching if needed
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'history') setActiveTab('history');
    else setActiveTab('dashboard');
  }, [location.search]);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const handledError = handleSupabaseError(error, {
          operation: 'select_materials',
          table: 'materials_with_details'
        });
        if (handledError) throw handledError;
      }

      setMaterials(data || []);
    } catch (err: any) {
      console.error('Materials fetch error:', err);
      toast.error('Failed to fetch materials.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('material_categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      // toast.error('Failed to fetch categories'); // Silent fail or log
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      // toast.error('Failed to fetch suppliers'); // Silent fail or log
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
    fetchSuppliers();
  }, [fetchMaterials, fetchCategories, fetchSuppliers]);

  const handleSave = async (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'stock_status' | 'total_value'>) => {
    setFormLoading(true);
    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('materials')
          .update({ ...materialData, version: editingMaterial.version + 1 })
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success('Material updated successfully');
      } else {
        const { error } = await supabase.from('materials').insert([materialData]);
        if (error) throw error;
        toast.success('Material created successfully');
      }

      setShowFormModal(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err: any) {
      if (err.code === '23505') {
        toast.error('A material with this name already exists');
      } else {
        toast.error(err.message || 'Failed to save material');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setShowFormModal(true);
  };

  const handleView = (material: Material) => {
    setViewingMaterial(material);
    setShowViewModal(true);
  };

  const handleTransaction = (material: Material) => {
    setTransactionMaterial(material);
    setShowTransactionModal(true);
  };

  const handleDeleteRequest = (material: Material) => {
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    setFormLoading(true);
    try {
      const { error } = await supabase.from('materials').update({ is_active: false }).eq('id', materialToDelete.id);
      if (error) throw error;
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete material');
    } finally {
      setFormLoading(false);
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    }
  };

  const handleTransactionSuccess = () => {
    setShowTransactionModal(false);
    setTransactionMaterial(null);
    fetchMaterials();
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setShowFormModal(true);
  }

  const handleTabChange = (tab: 'dashboard' | 'history') => {
    setActiveTab(tab);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Materials Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track inventory, manage suppliers, and monitor stock levels.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={handleAddMaterial} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Add Material
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            <LayoutDashboard className="w-4 h-4" />
            Inventory Dashboard
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            <History className="w-4 h-4" />
            Transaction History
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'dashboard' ? (
          <ComprehensiveMaterialView
            materials={materials}
            categories={categories}
            suppliers={suppliers}
            loading={loading}
            onRefresh={fetchMaterials}
            onEdit={handleEdit}
            onView={handleView}
            onTransaction={handleTransaction}
            onDelete={handleDeleteRequest}
          />
        ) : (
          <MaterialHistory />
        )}
      </div>

      {/* Modals */}
      <MaterialFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSave}
        editingMaterial={editingMaterial}
        categories={categories}
        suppliers={suppliers}
        isLoading={formLoading}
      />

      <MaterialViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        material={viewingMaterial}
      />

      <MaterialTransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        material={transactionMaterial}
        onSuccess={handleTransactionSuccess}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${materialToDelete?.material_name}"? This action will mark the material as inactive.`}
        confirmText="Delete"
        isLoading={formLoading}
      />
    </div>
  );
};

export default MaterialsPage;