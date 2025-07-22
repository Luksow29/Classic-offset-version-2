import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { 
  Search, Filter, Download, Printer, Eye, Edit, AlertTriangle, 
  TrendingUp, TrendingDown, Package, BarChart3, Calendar,
  MapPin, Hash, Loader2, RefreshCw, Plus, Minus, ShoppingCart
} from 'lucide-react';

interface StockItem {
  id: string;
  item_name: string;
  category: string;
  current_quantity: number;
  quantity_used?: number;
  balance: number;
  storage_location?: string;
  minimum_threshold: number;
  last_updated: string;
  unit_of_measurement: string;
  cost_per_unit?: number;
  source: 'existing_stock' | 'materials';
  supplier_name?: string;
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  total_value: number;
}

interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
  existingStockItems: number;
  materialsItems: number;
}

const ComprehensiveStockView: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortField, setSortField] = useState<keyof StockItem>('item_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateType, setUpdateType] = useState<'add' | 'subtract' | 'set'>('add');

  // Fetch unified stock data from both sources
  const fetchStockData = async () => {
    setLoading(true);
    try {
      // Fetch existing stock data
      const { data: existingStock, error: existingError } = await supabase
        .from('stock')
        .select('*')
        .order('item_name');

      if (existingError) throw existingError;

      // Fetch materials data
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials_with_details')
        .select('*')
        .order('material_name');

      if (materialsError) throw materialsError;

      // Process existing stock data
      const processedExistingStock: StockItem[] = (existingStock || []).map(item => ({
        id: `existing_${item.id}`,
        item_name: item.item_name,
        category: item.category || 'Uncategorized',
        current_quantity: item.quantity_in || 0,
        quantity_used: item.quantity_used || 0,
        balance: (item.quantity_in || 0) - (item.quantity_used || 0),
        storage_location: item.storage_location || 'Not specified',
        minimum_threshold: 100, // Default threshold for existing stock
        last_updated: item.updated_at || item.created_at,
        unit_of_measurement: 'pieces', // Default unit for existing stock
        cost_per_unit: 0,
        source: 'existing_stock' as const,
        stock_status: ((item.quantity_in || 0) - (item.quantity_used || 0)) <= 0 ? 'OUT_OF_STOCK' :
                     ((item.quantity_in || 0) - (item.quantity_used || 0)) <= 100 ? 'LOW_STOCK' : 'IN_STOCK',
        total_value: ((item.quantity_in || 0) - (item.quantity_used || 0)) * 10 // Estimated value
      }));

      // Process materials data
      const processedMaterials: StockItem[] = (materialsData || []).map(item => ({
        id: `material_${item.id}`,
        item_name: item.material_name,
        category: item.category_name || 'Uncategorized',
        current_quantity: item.current_quantity || 0,
        balance: item.current_quantity || 0,
        storage_location: item.storage_location || 'Not specified',
        minimum_threshold: item.minimum_stock_level || 0,
        last_updated: item.updated_at || item.created_at,
        unit_of_measurement: item.unit_of_measurement || 'pieces',
        cost_per_unit: item.cost_per_unit || 0,
        source: 'materials' as const,
        supplier_name: item.supplier_name,
        stock_status: item.stock_status as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK',
        total_value: item.total_value || 0
      }));

      // Combine both datasets
      const combinedStock = [...processedExistingStock, ...processedMaterials];
      setStockItems(combinedStock);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const categories = [...new Set(stockItems.map(item => item.category))].filter(Boolean);
    const locations = [...new Set(stockItems.map(item => item.storage_location))].filter(Boolean);
    
    return {
      categories: categories.map(cat => ({ value: cat, label: cat })),
      locations: locations.map(loc => ({ value: loc, label: loc }))
    };
  }, [stockItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = stockItems.filter(item => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesLocation = !locationFilter || item.storage_location === locationFilter;
      const matchesSource = !sourceFilter || item.source === sourceFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'low_stock') {
        matchesStatus = item.stock_status === 'LOW_STOCK';
      } else if (statusFilter === 'out_of_stock') {
        matchesStatus = item.stock_status === 'OUT_OF_STOCK';
      } else if (statusFilter === 'in_stock') {
        matchesStatus = item.stock_status === 'IN_STOCK';
      }

      return matchesSearch && matchesCategory && matchesLocation && matchesSource && matchesStatus;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [stockItems, searchTerm, categoryFilter, statusFilter, locationFilter, sourceFilter, sortField, sortOrder]);

  // Calculate summary statistics
  const summary: StockSummary = useMemo(() => {
    const totalItems = stockItems.length;
    const existingStockItems = stockItems.filter(item => item.source === 'existing_stock').length;
    const materialsItems = stockItems.filter(item => item.source === 'materials').length;
    const lowStockItems = stockItems.filter(item => item.stock_status === 'LOW_STOCK').length;
    const outOfStockItems = stockItems.filter(item => item.stock_status === 'OUT_OF_STOCK').length;
    const totalValue = stockItems.reduce((sum, item) => sum + item.total_value, 0);
    const recentMovements = stockItems.filter(item => {
      const lastUpdate = new Date(item.last_updated);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastUpdate > weekAgo;
    }).length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      recentMovements,
      existingStockItems,
      materialsItems
    };
  }, [stockItems]);

  // Get stock status styling
  const getStockStatusStyling = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' };
      case 'LOW_STOCK':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
      case 'IN_STOCK':
        return { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  // Get stock level percentage
  const getStockPercentage = (item: StockItem) => {
    if (item.source === 'existing_stock') {
      const maxStock = item.current_quantity || 1;
      return Math.min((item.balance / maxStock) * 100, 100);
    } else {
      // For materials, use minimum threshold as reference
      const threshold = item.minimum_threshold || 1;
      return Math.min((item.balance / (threshold * 2)) * 100, 100);
    }
  };

  // Handle quantity update
  const handleUpdateQuantity = async () => {
    if (!selectedItem || !updateQuantity) return;

    const quantity = parseInt(updateQuantity);
    
    try {
      if (selectedItem.source === 'existing_stock') {
        // Update existing stock table
        const stockId = selectedItem.id.replace('existing_', '');
        let newQuantityUsed = selectedItem.quantity_used || 0;

        if (updateType === 'add') {
          newQuantityUsed = Math.max(0, newQuantityUsed - quantity);
        } else if (updateType === 'subtract') {
          newQuantityUsed = newQuantityUsed + quantity;
        } else if (updateType === 'set') {
          newQuantityUsed = selectedItem.current_quantity - quantity;
        }

        const { error } = await supabase
          .from('stock')
          .update({ quantity_used: newQuantityUsed })
          .eq('id', stockId);

        if (error) throw error;
      } else {
        // Update materials table via transaction
        const materialId = selectedItem.id.replace('material_', '');
        let transactionType: 'IN' | 'OUT' | 'ADJUSTMENT' = 'ADJUSTMENT';
        let transactionQuantity = quantity;

        if (updateType === 'add') {
          transactionType = 'IN';
        } else if (updateType === 'subtract') {
          transactionType = 'OUT';
        } else if (updateType === 'set') {
          transactionType = 'ADJUSTMENT';
          transactionQuantity = quantity;
        }

        const { error } = await supabase
          .from('material_transactions')
          .insert({
            material_id: materialId,
            transaction_type: transactionType,
            quantity: transactionQuantity,
            notes: `Stock update via comprehensive view - ${updateType}`
          });

        if (error) throw error;
      }

      await fetchStockData();
      setShowUpdateModal(false);
      setUpdateQuantity('');
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    }
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Item Name', 'Category', 'Current Stock', 'Unit', 'Status', 'Location', 'Source', 'Supplier', 'Value', 'Last Updated'];
    const csvData = filteredAndSortedItems.map(item => [
      item.item_name,
      item.category,
      item.balance,
      item.unit_of_measurement,
      item.stock_status.replace('_', ' '),
      item.storage_location,
      item.source === 'existing_stock' ? 'Existing Stock' : 'Materials',
      item.supplier_name || '-',
      `₹${item.total_value.toLocaleString()}`,
      new Date(item.last_updated).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unified-stock-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading unified stock inventory...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.totalItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.lowStockItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{summary.outOfStockItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-green-600">₹{summary.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Recent Activity</p>
              <p className="text-2xl font-bold text-purple-600">{summary.recentMovements}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Existing Stock</p>
              <p className="text-2xl font-bold text-indigo-600">{summary.existingStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-cyan-500" />
            <div>
              <p className="text-sm text-gray-500">Materials</p>
              <p className="text-2xl font-bold text-cyan-600">{summary.materialsItems}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Stock View */}
      <Card>
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold">📋 Unified Stock Inventory</h3>
              <p className="text-sm text-gray-500">Combined view of existing stock and materials inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchStockData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-1" />
                Print Labels
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
              <Input
                id="search-stock"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              id="source-filter"
              label=""
              options={[
                { value: 'existing_stock', label: 'Existing Stock' },
                { value: 'materials', label: 'Materials' }
              ]}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              placeholder="All Sources"
            />
            
            <Select
              id="category-filter"
              label=""
              options={filterOptions.categories}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="All Categories"
            />
            
            <Select
              id="status-filter"
              label=""
              options={[
                { value: 'in_stock', label: 'In Stock' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Status"
            />
            
            <Select
              id="location-filter"
              label=""
              options={filterOptions.locations}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="All Locations"
            />
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
                setLocationFilter('');
                setSourceFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Stock Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setSortField('item_name');
                    setSortOrder(sortField === 'item_name' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Item Name
                </th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th 
                  className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setSortField('balance');
                    setSortOrder(sortField === 'balance' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  Current Stock
                </th>
                <th className="px-4 py-3 text-center font-medium">Stock Level</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-4 py-3 text-left font-medium">Last Updated</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedItems.map((item) => {
                const status = getStockStatusStyling(item.stock_status);
                const percentage = getStockPercentage(item);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{item.item_name}</div>
                        <div className="text-xs text-gray-500">
                          {item.unit_of_measurement}
                          {item.supplier_name && ` • ${item.supplier_name}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.source === 'existing_stock' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {item.source === 'existing_stock' ? 'Existing' : 'Materials'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.category}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{item.balance}</div>
                      {item.minimum_threshold > 0 && (
                        <div className="text-xs text-gray-500">Min: {item.minimum_threshold}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage > 50 ? 'bg-green-500' : 
                            percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-center mt-1">{percentage.toFixed(0)}%</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {item.stock_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{item.storage_location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      ₹{item.total_value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {new Date(item.last_updated).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowUpdateModal(true);
                          }}
                          title="Update Quantity"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View History"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Mark for Reorder"
                        >
                          <Hash className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredAndSortedItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stock items found matching your filters.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Update Quantity Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Stock - ${selectedItem?.item_name}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Current Stock:</strong> {selectedItem?.balance} {selectedItem?.unit_of_measurement}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              <strong>Source:</strong> {selectedItem?.source === 'existing_stock' ? 'Existing Stock' : 'Materials Inventory'}
            </p>
            {selectedItem?.minimum_threshold && selectedItem.minimum_threshold > 0 && (
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Minimum Threshold:</strong> {selectedItem.minimum_threshold} {selectedItem.unit_of_measurement}
              </p>
            )}
          </div>
          
          <Select
            id="update-type"
            label="Update Type"
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value as 'add' | 'subtract' | 'set')}
            options={[
              { value: 'add', label: 'Add to Stock' },
              { value: 'subtract', label: 'Remove from Stock' },
              { value: 'set', label: 'Set Exact Amount' }
            ]}
          />
          
          <Input
            id="update-quantity"
            label="Quantity"
            type="number"
            value={updateQuantity}
            onChange={(e) => setUpdateQuantity(e.target.value)}
            placeholder="Enter quantity"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuantity} disabled={!updateQuantity}>
              Update Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComprehensiveStockView;