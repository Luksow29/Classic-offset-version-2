import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    Package,
    DollarSign,
    BarChart3,
    PieChart,
    BrainCircuit,
    Timer,
    Activity,
    Edit // Imported for the table action
} from 'lucide-react';
import { Material, MaterialCategory, Supplier } from './MaterialsPage';
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';
import { useResponsiveViewMode } from '../../hooks/useResponsiveViewMode';
import MaterialGridCard from './MaterialGridCard';
import { motion, AnimatePresence } from 'framer-motion';
import { List, LayoutGrid } from 'lucide-react';

interface ComprehensiveMaterialViewProps {
    materials: Material[];
    categories: MaterialCategory[];
    suppliers: Supplier[];
    loading: boolean;
    onRefresh: () => void;
    onEdit: (material: Material) => void;
    onView: (material: Material) => void;
    onTransaction: (material: Material) => void;
    onDelete: (material: Material) => void;
}

interface MaterialPrediction {
    materialId: string;
    dailyUsageRate: number;
    daysUntilStockout: number;
    status: 'healthy' | 'low' | 'critical' | 'overstock';
}

const ComprehensiveMaterialView: React.FC<ComprehensiveMaterialViewProps> = ({
    materials,
    categories,
    suppliers,
    loading,
    onRefresh,
    onEdit,
    onView,
    onTransaction,
    onDelete,
}) => {
    const { viewMode, setViewMode } = useResponsiveViewMode();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [predictions, setPredictions] = useState<Record<string, MaterialPrediction>>({});
    const [calculatingPredictions, setCalculatingPredictions] = useState(false);

    const [filters, setFilters] = useState({
        category: '',
        supplier: '',
        stockStatus: '',
        search: ''
    });

    useEffect(() => {
        if (materials.length > 0) {
            calculatePredictions();
        }
    }, [materials]);

    const calculatePredictions = async () => {
        setCalculatingPredictions(true);
        try {
            // 1. Fetch usage history for last 30 days for ALL materials
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: usageData, error } = await supabase
                .from('order_materials')
                .select('material_id, quantity_used, created_at')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (error) {
                console.error('Error fetching usage data:', error);
                // Don't throw, just continue with 0 usage to prevent crashing UI
            }

            // 2. Aggregate usage by material
            const usageByMaterial: Record<string, number> = {};
            if (usageData) {
                usageData.forEach((usage: any) => {
                    usageByMaterial[usage.material_id] = (usageByMaterial[usage.material_id] || 0) + usage.quantity_used;
                });
            }

            // 3. Calculate metrics for each material
            const newPredictions: Record<string, MaterialPrediction> = {};

            materials.forEach(material => {
                const totalUsage30Days = usageByMaterial[material.id] || 0;
                const dailyUsageRate = totalUsage30Days / 30;
                const currentStock = material.current_quantity;
                const reorderPoint = material.minimum_stock_level;

                let daysUntilStockout = 999;
                if (dailyUsageRate > 0) {
                    daysUntilStockout = currentStock / dailyUsageRate;
                }

                let status: MaterialPrediction['status'] = 'healthy';
                // Safe check for 0 reorder point to avoid division by zero or weird logic if needed
                if (currentStock <= reorderPoint * 0.5) status = 'critical';
                else if (currentStock <= reorderPoint) status = 'low';
                else if (currentStock > reorderPoint * 3) status = 'overstock';

                newPredictions[material.id] = {
                    materialId: material.id,
                    dailyUsageRate,
                    daysUntilStockout,
                    status
                };
            });

            setPredictions(newPredictions);
        } catch (err) {
            console.error('Error calculating predictions:', err);
        } finally {
            setCalculatingPredictions(false);
        }
    };

    // Derived state: Smart Insights
    const insights = useMemo(() => {
        const criticalItems = materials.filter(m => predictions[m.id]?.status === 'critical');

        const fastMovingItems = materials
            .filter(m => (predictions[m.id]?.dailyUsageRate || 0) > 0)
            .sort((a, b) => (predictions[b.id]?.dailyUsageRate || 0) - (predictions[a.id]?.dailyUsageRate || 0))
            .slice(0, 3);

        // Potential stockouts in next 7 days
        const stockoutRisk = materials.filter(m => {
            const days = predictions[m.id]?.daysUntilStockout;
            return days !== undefined && days <= 7 && m.current_quantity > 0; // Filter out already empty items
        });

        return { criticalItems, fastMovingItems, stockoutRisk };
    }, [materials, predictions]);

    // Derived state: Filtered materials
    const filteredMaterials = useMemo(() => {
        return materials.filter(material => {
            const matchesCategory = !filters.category || material.category_name === filters.category;
            const matchesSupplier = !filters.supplier || material.supplier_name === filters.supplier;
            const matchesStatus = !filters.stockStatus || material.stock_status === filters.stockStatus;
            const matchesSearch = !filters.search ||
                material.material_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                (material.description && material.description.toLowerCase().includes(filters.search.toLowerCase()));

            return matchesCategory && matchesSupplier && matchesStatus && matchesSearch;
        });
    }, [materials, filters]);

    // Derived state: Pagination
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
    const paginatedMaterials = filteredMaterials.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Derived state: Summary Stats
    const summary = useMemo(() => {
        const totalValue = materials.reduce((sum, m) => sum + (m.total_value || 0), 0);
        const lowStock = materials.filter(m => m.stock_status === 'LOW_STOCK').length;
        const outStock = materials.filter(m => m.stock_status === 'OUT_OF_STOCK').length;
        return { total: materials.length, totalValue, lowStock, outStock };
    }, [materials]);

    // Derived state: Chart Data
    const stockStatusData = useMemo(() => {
        const statusCounts = { IN_STOCK: 0, LOW_STOCK: 0, OUT_OF_STOCK: 0 };
        materials.forEach(m => {
            if (statusCounts[m.stock_status] !== undefined) {
                statusCounts[m.stock_status]++;
            }
        });

        return [
            { name: 'In Stock', value: statusCounts.IN_STOCK, color: '#10B981' },
            { name: 'Low Stock', value: statusCounts.LOW_STOCK, color: '#F59E0B' },
            { name: 'Out of Stock', value: statusCounts.OUT_OF_STOCK, color: '#EF4444' }
        ].filter(item => item.value > 0);
    }, [materials]);

    const categoryValueData = useMemo(() => {
        const catMap: Record<string, number> = {};
        materials.forEach(m => {
            const cat = m.category_name || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + m.total_value;
        });

        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [materials]);

    // Filter Options
    const categoryOptions = useMemo(() =>
        categories.map(cat => ({ value: cat.name, label: cat.name })),
        [categories]
    );

    const supplierOptions = useMemo(() =>
        suppliers.map(sup => ({ value: sup.name, label: sup.name })),
        [suppliers]
    );

    const stockStatusOptions = [
        { value: 'IN_STOCK', label: 'In Stock' },
        { value: 'LOW_STOCK', label: 'Low Stock' },
        { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
    ];

    const clearFilters = () => {
        setFilters({ category: '', supplier: '', stockStatus: '', search: '' });
        setCurrentPage(1);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Category', 'Supplier', 'Quantity', 'Unit', 'Cost', 'Total Value', 'Status', 'Location'];
        const csvData = filteredMaterials.map(m => [
            m.material_name,
            m.category_name || '-',
            m.supplier_name || '-',
            m.current_quantity,
            m.unit_of_measurement,
            m.cost_per_unit,
            m.total_value,
            m.stock_status,
            m.storage_location || '-'
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `materials-inventory-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* 1. Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Materials</span>
                        <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> Active Items
                    </p>
                </Card>

                <Card className="p-4 border-l-4 border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50/50 dark:from-gray-800 dark:to-yellow-900/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Alerts</span>
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.lowStock}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                        <div
                            className="bg-yellow-500 h-1.5 rounded-full"
                            style={{ width: `${summary.total ? (summary.lowStock / summary.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50/50 dark:from-gray-800 dark:to-red-900/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Out of Stock</span>
                        <Package className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.outStock}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                        <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${summary.total ? (summary.outStock / summary.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</span>
                        <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalValue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 mt-1">Estimated Inventory Value</p>
                </Card>
            </div>

            {/* 2. Smart Insights Section */}
            {/* 2. Smart Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className={`border-l-4 ${insights.stockoutRisk.length > 0 ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10'}`}>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {insights.stockoutRisk.length > 0 ? (
                                <BrainCircuit className="w-5 h-5 text-red-600 dark:text-red-400" />
                            ) : (
                                <BrainCircuit className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                            <h3 className={`font-bold ${insights.stockoutRisk.length > 0 ? 'text-red-900 dark:text-red-300' : 'text-green-900 dark:text-green-300'}`}>
                                Predictive Stockout Risk
                            </h3>
                        </div>
                        <p className={`text-sm mb-3 ${insights.stockoutRisk.length > 0 ? 'text-red-700 dark:text-red-200' : 'text-green-700 dark:text-green-200'}`}>
                            {insights.stockoutRisk.length > 0
                                ? <>Based on 30-day usage trends, the following items may deplete <strong>within 7 days</strong>:</>
                                : <>Inventory levels are healthy. No stockout risks detected for the next 7 days based on current usage.</>
                            }
                        </p>
                        <div className="space-y-2">
                            {insights.stockoutRisk.slice(0, 3).map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-red-100 dark:border-red-900/30 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.material_name}</span>
                                        <span className="text-xs text-gray-500">({item.current_quantity} {item.unit_of_measurement} left)</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-red-600 font-bold text-sm">
                                        <Timer className="w-3 h-3" />
                                        {Math.round(predictions[item.id]?.daysUntilStockout || 0)} days
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-blue-900 dark:text-blue-300">Fastest Moving Inventory</h3>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                            Top items with highest daily consumption rates:
                        </p>
                        <div className="space-y-2">
                            {insights.fastMovingItems.length > 0 ? insights.fastMovingItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.material_name}</span>
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-900 dark:text-white">{predictions[item.id]?.dailyUsageRate.toFixed(1)}</span>
                                        <span className="text-xs text-gray-500 ml-1">{item.unit_of_measurement}/day</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 italic">No significant usage detected recently.</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* 3. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4 w-full flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> Stock Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                            <Pie
                                data={stockStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stockStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4 w-full flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Top Categories by Value
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={categoryValueData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                            <RechartsTooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                                {categoryValueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'][index % 5]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* 4. Filter Bar */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Inventory List</h3>
                        <div className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {filteredMaterials.length} items
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted p-1 rounded-lg border border-border/50 mr-2">
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
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToCSV}>
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <Input
                            id="search-materials"
                            placeholder="Search by name or desc..."
                            value={filters.search}
                            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setCurrentPage(1); }}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>

                    <Select
                        id="category-filter"
                        label=""
                        options={categoryOptions}
                        value={filters.category}
                        onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setCurrentPage(1); }}
                        placeholder="All Categories"
                    />

                    <Select
                        id="supplier-filter"
                        label=""
                        options={supplierOptions}
                        value={filters.supplier}
                        onChange={(e) => { setFilters({ ...filters, supplier: e.target.value }); setCurrentPage(1); }}
                        placeholder="All Suppliers"
                    />

                    <Select
                        id="stock-status-filter"
                        label=""
                        options={stockStatusOptions}
                        value={filters.stockStatus}
                        onChange={(e) => { setFilters({ ...filters, stockStatus: e.target.value }); setCurrentPage(1); }}
                        placeholder="All Status"
                    />

                    <Button variant="ghost" onClick={clearFilters} className="w-full text-sm h-9" disabled={!Object.values(filters).some(Boolean)}>
                        Clear Filters
                    </Button>
                </div>

                {/* 5. Inventory Table / Grid */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {viewMode === 'list' ? (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700"
                            >
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Material Name</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Category</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Supplier</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Quantity</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Value (₹)</th>
                                                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Status</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginatedMaterials.length > 0 ? paginatedMaterials.map((material) => (
                                                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3 max-w-[200px]">
                                                        <div className="font-medium text-gray-900 dark:text-white truncate" title={material.material_name}>
                                                            {material.material_name}
                                                        </div>
                                                        {material.description && <div className="text-xs text-gray-500 truncate" title={material.description}>{material.description}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{material.category_name || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{material.supplier_name || '-'}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="font-medium text-gray-900 dark:text-white">{material.current_quantity} <span className="text-gray-500 text-xs">{material.unit_of_measurement}</span></div>
                                                        <div className="text-xs text-gray-500">Min: {material.minimum_stock_level}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                        ₹ {material.total_value.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                                ${material.stock_status === 'IN_STOCK' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                material.stock_status === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {material.stock_status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => onView(material)} className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50" title="View Details">
                                                                <Search className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => onEdit(material)} className="h-8 w-8 p-0 hover:text-indigo-600 hover:bg-indigo-50" title="Edit Material">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => onTransaction(material)} className="h-8 w-8 p-0 hover:text-green-600 hover:bg-green-50" title="Record Transaction">
                                                                <DollarSign className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <Package className="w-12 h-12 text-gray-300 mb-3" />
                                                            <p>No materials found matching your filters.</p>
                                                            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-primary">
                                                                Clear all filters
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            >
                                {paginatedMaterials.length > 0 ? paginatedMaterials.map(material => (
                                    <MaterialGridCard
                                        key={material.id}
                                        material={material}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onTransaction={onTransaction}
                                        onDelete={onDelete}
                                    />
                                )) : (
                                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col items-center justify-center">
                                            <Package className="w-12 h-12 text-gray-300 mb-3" />
                                            <p>No materials found matching your filters.</p>
                                            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-primary">
                                                Clear all filters
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 6. Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} entries
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ComprehensiveMaterialView;
