import React, { useMemo } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Eye, Edit, Trash2, Search, Filter, ArrowUpDown, Package2, AlertTriangle, CheckCircle, List, LayoutGrid } from 'lucide-react';
import { Material, MaterialCategory, Supplier } from './MaterialsPage';
import { useResponsiveViewMode } from '../../hooks/useResponsiveViewMode';
import MaterialGridCard from './MaterialGridCard';
import { motion, AnimatePresence } from 'framer-motion';

interface MaterialTableProps {
  materials: Material[];
  categories: MaterialCategory[];
  suppliers: Supplier[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  filters: {
    category: string;
    supplier: string;
    stockStatus: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  onPageChange: (page: number) => void;
  onEdit: (material: Material) => void;
  onView: (material: Material) => void;
  onTransaction: (material: Material) => void;
  onDelete: (material: Material) => void;
}

const MaterialTable: React.FC<MaterialTableProps> = ({
  materials,
  categories,
  suppliers,
  loading,
  currentPage,
  totalPages,
  filters,
  onFiltersChange,
  onPageChange,
  onEdit,
  onView,
  onTransaction,
  onDelete,
}) => {
  const { viewMode, setViewMode } = useResponsiveViewMode();

  const stockStatusOptions = [
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  ];

  const categoryOptions = useMemo(() =>
    categories.map(cat => ({ value: cat.name, label: cat.name })),
    [categories]
  );

  const supplierOptions = useMemo(() =>
    suppliers.map(sup => ({ value: sup.name, label: sup.name })),
    [suppliers]
  );

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'OUT_OF_STOCK':
        return <Package2 className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      supplier: '',
      stockStatus: '',
      search: ''
    });
  };

  const TableSkeleton = () => (
    <div className="p-4">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package2 className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No materials found</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        {Object.values(filters).some(f => f)
          ? 'No materials match your current filters.'
          : 'Get started by adding your first material.'}
      </p>
      {Object.values(filters).some(f => f) && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
          Clear Filters
        </Button>
      )}
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      {/* Header with Filters */}
      <div className="p-4 border-b dark:border-gray-700 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="text-lg font-semibold">Material Inventory</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {materials.length} results
            </div>
            <div className="flex items-center bg-muted p-1 rounded-lg border border-border/50">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <Input
              id="search-materials"
              placeholder="Search materials..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select
            id="category-filter"
            label=""
            options={categoryOptions}
            value={filters.category}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            placeholder="All Categories"
          />

          <Select
            id="supplier-filter"
            label=""
            options={supplierOptions}
            value={filters.supplier}
            onChange={(e) => onFiltersChange({ ...filters, supplier: e.target.value })}
            placeholder="All Suppliers"
          />

          <Select
            id="stock-status-filter"
            label=""
            options={stockStatusOptions}
            value={filters.stockStatus}
            onChange={(e) => onFiltersChange({ ...filters, stockStatus: e.target.value })}
            placeholder="All Stock Status"
          />

          <Button variant="outline" onClick={clearFilters} className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>

      {loading ? <TableSkeleton /> : (
        <div>
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto"
              >
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Material Name
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Supplier</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Unit Cost</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Total Value</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Stock Status</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {materials.length > 0 ? materials.map(material => (
                      <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{material.material_name}</div>
                            {material.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">{material.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {material.category_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {material.supplier_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {material.current_quantity} {material.unit_of_measurement}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {material.minimum_stock_level}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          ₹{material.cost_per_unit.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                          ₹{material.total_value.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(material.stock_status)}`}>
                            {getStockStatusIcon(material.stock_status)}
                            {material.stock_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onView(material)} title="View Material">
                              <Eye size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(material)} title="Edit Material">
                              <Edit size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onTransaction(material)} title="Add Transaction">
                              <ArrowUpDown size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDelete(material)} title="Delete Material">
                              <Trash2 size={14} className="text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
              >
                {materials.length > 0 ? materials.map(material => (
                  <MaterialGridCard
                    key={material.id}
                    material={material}
                    onView={onView}
                    onEdit={onEdit}
                    onTransaction={onTransaction}
                    onDelete={onDelete}
                  />
                )) : <div className="col-span-full"><EmptyState /></div>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          <Pagination />
        </div>
      )}
    </Card>
  );
};

export default MaterialTable;