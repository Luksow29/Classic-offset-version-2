import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MaterialTable from './MaterialTable';
import MaterialFormModal from './MaterialFormModal';
import MaterialViewModal from './MaterialViewModal';
import MaterialTransactionModal from './MaterialTransactionModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import StockAlertsCard from './StockAlertsCard';
import { Plus, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

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

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    stockStatus: '',
    search: ''
  });

  const fetchMaterials = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let query = supabase
        .from('materials_with_details')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category_name', filters.category);
      }
      if (filters.supplier) {
        query = query.eq('supplier_name', filters.supplier);
      }
      if (filters.stockStatus) {
        query = query.eq('stock_status', filters.stockStatus);
      }
      if (filters.search) {
        query = query.or(`material_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Pagination
      const limit = 10;
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;
      
      if (error) {
        const handledError = handleSupabaseError(error, { 
          operation: 'select_materials', 
          table: 'materials_with_details' 
        });
        if (handledError) throw handledError;
      }
      
      setMaterials(data || []);
      setTotalPages(Math.ceil((count || 0) / limit));
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Materials fetch error:', err);
      toast.error('Failed to fetch materials. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      toast.error('Failed to fetch categories');
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      toast.error('Failed to fetch suppliers');
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
          .update({
            ...materialData,
            version: editingMaterial.version + 1
          })
          .eq('id', editingMaterial.id);
        
        if (error) throw error;
        toast.success('Material updated successfully');
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([materialData]);
        
        if (error) throw error;
        toast.success('Material created successfully');
      }
      
      setShowFormModal(false);
      setEditingMaterial(null);
      fetchMaterials(currentPage);
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
      const { error } = await supabase
        .from('materials')
        .update({ is_active: false })
        .eq('id', materialToDelete.id);
      
      if (error) throw error;
      
      toast.success('Material deleted successfully');
      fetchMaterials(currentPage);
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
    fetchMaterials(currentPage);
  };

  // Calculate summary statistics
  const totalMaterials = materials.length;
  const lowStockCount = materials.filter(m => m.stock_status === 'LOW_STOCK').length;
  const outOfStockCount = materials.filter(m => m.stock_status === 'OUT_OF_STOCK').length;
  const totalValue = materials.reduce((sum, m) => sum + m.total_value, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📦 Materials Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Comprehensive material inventory and tracking system</p>
        </div>
        <Button onClick={() => { setEditingMaterial(null); setShowFormModal(true); }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Material
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalMaterials}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-green-600">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Alerts */}
      <StockAlertsCard />

      {/* Materials Table */}
      <MaterialTable
        materials={materials}
        categories={categories}
        suppliers={suppliers}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        filters={filters}
        onFiltersChange={setFilters}
        onPageChange={(page) => fetchMaterials(page)}
        onEdit={handleEdit}
        onView={handleView}
        onTransaction={handleTransaction}
        onDelete={handleDeleteRequest}
      />

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