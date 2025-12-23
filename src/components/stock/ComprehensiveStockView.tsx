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
  MapPin, Hash, Loader2, RefreshCw, ShoppingCart, DollarSign, List, LayoutGrid
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useResponsiveViewMode } from '../../hooks/useResponsiveViewMode';
import StockGridCard from './StockGridCard';
import { motion, AnimatePresence } from 'framer-motion';

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

  // View Mode
  const { viewMode, setViewMode } = useResponsiveViewMode();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;

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

  // Pagination Logic
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, locationFilter, sourceFilter]);

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

  const chartData = useMemo(() => {
    const statusData = [
      { name: 'In Stock', value: summary.totalItems - summary.lowStockItems - summary.outOfStockItems, color: '#22c55e' },
      { name: 'Low Stock', value: summary.lowStockItems, color: '#eab308' },
      { name: 'Out of Stock', value: summary.outOfStockItems, color: '#ef4444' }
    ];

    const categoryMap = stockItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Start with top 5

    return { statusData, categoryData };
  }, [summary, stockItems]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading unified stock inventory...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row - EXISTING CODE PRESERVED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary.totalItems}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Package size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500 bg-gradient-to-br from-card to-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">₹{summary.totalValue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500 bg-gradient-to-br from-card to-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary.lowStockItems}</h3>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-purple-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Movements (7d)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary.recentMovements}</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row - EXISTING CODE PRESERVED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 h-[300px]">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Stock Status</h3>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 h-[300px]">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Top 5 Categories (Count)</h3>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>


      {/* Main Stock Table/Grid */}
      <Card>
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Unified Stock Inventory
              </h3>
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
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-3 relative">
              <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
              <Input
                id="search-stock"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="lg:col-span-2">
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
                className="h-9"
              />
            </div>

            <div className="lg:col-span-2">
              <Select
                id="category-filter"
                label=""
                options={filterOptions.categories}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder="All Categories"
                className="h-9"
              />
            </div>

            <div className="lg:col-span-2">
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
                className="h-9"
              />
            </div>

            <div className="lg:col-span-2">
              <Select
                id="location-filter"
                label=""
                options={filterOptions.locations}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="All Locations"
                className="h-9"
              />
            </div>

            <div className="lg:col-span-1 flex justify-end gap-2">
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

              {(searchTerm || categoryFilter || statusFilter || locationFilter || sourceFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setStatusFilter('');
                    setLocationFilter('');
                    setSourceFilter('');
                  }}
                  className="h-9 w-9 p-0"
                  title="Clear Filters"
                >
                  <RefreshCw className="w-4 h-4 rotate-45" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
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
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        className="px-4 py-3 text-left font-medium cursor-pointer hover:text-primary transition-colors"
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
                        className="px-4 py-3 text-right font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          setSortField('balance');
                          setSortOrder(sortField === 'balance' && sortOrder === 'desc' ? 'asc' : 'desc');
                        }}
                      >
                        Current Stock
                      </th>
                      <th className="px-4 py-3 text-center font-medium">Level</th>
                      <th className="px-4 py-3 text-center font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Value</th>
                      <th className="px-4 py-3 text-left font-medium">Last Updated</th>
                      <th className="px-4 py-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedItems.map((item) => {
                      const status = getStockStatusStyling(item.stock_status);
                      const percentage = getStockPercentage(item);

                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-foreground">{item.item_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.unit_of_measurement}
                                {item.supplier_name && ` • ${item.supplier_name}`}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${item.source === 'existing_stock'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                              }`}>
                              {item.source === 'existing_stock' ? 'Existing' : 'Materials'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-foreground">{item.balance}</div>
                            {item.minimum_threshold > 0 && (
                              <div className="text-xs text-muted-foreground">Min: {item.minimum_threshold}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${percentage > 50 ? 'bg-green-500' :
                                  percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${status.bgColor.replace('bg-', 'border-').replace('/30', '/50')} ${status.color} bg-opacity-20`}>
                              {item.stock_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            ₹{item.total_value.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(item.last_updated).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowUpdateModal(true);
                              }}
                              title="Update Quantity"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
                {paginatedItems.map((item) => (
                  <StockGridCard
                    key={item.id}
                    item={item}
                    onUpdate={(item) => {
                      setSelectedItem(item);
                      setShowUpdateModal(true);
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {paginatedItems.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No stock items found.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredAndSortedItems.length > 0 && (
          <div className="px-4 py-4 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)}</span> of <span className="font-medium text-foreground">{filteredAndSortedItems.length}</span> results
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                <span className="text-sm py-1 px-3 bg-background border border-border rounded-md font-medium text-foreground">
                  Page {currentPage} of {Math.ceil(filteredAndSortedItems.length / itemsPerPage)}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredAndSortedItems.length / itemsPerPage)))}
                disabled={currentPage >= Math.ceil(filteredAndSortedItems.length / itemsPerPage)}
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Update Quantity Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Stock - ${selectedItem?.item_name}`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-secondary rounded-lg border border-border/50">
            <p className="text-sm font-medium">
              Current Stock: <span className="text-primary">{selectedItem?.balance} {selectedItem?.unit_of_measurement}</span>
            </p>
          </div>

          <Select
            id="update-type"
            label="Update Action"
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value as 'add' | 'subtract' | 'set')}
            options={[
              { value: 'add', label: 'Add to Stock (+)' },
              { value: 'subtract', label: 'Remove from Stock (-)' },
              { value: 'set', label: 'Set Exact Amount (=)' }
            ]}
          />

          <Input
            id="update-quantity"
            label="Quantity"
            type="number"
            value={updateQuantity}
            onChange={(e) => setUpdateQuantity(e.target.value)}
            placeholder="Enter quantity"
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuantity} disabled={!updateQuantity}>
              Confirm Update
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComprehensiveStockView;