import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import {
    Search,
    Plus,
    Package,
    LayoutGrid,
    List,
    Eye,
    Edit,
    Trash2,
    Tag,
    DollarSign,
    MoreHorizontal
} from 'lucide-react';
import { Product } from './types';

interface ComprehensiveProductViewProps {
    products: Product[];
    loading: boolean;
    onAdd: () => void;
    onView: (product: Product) => void;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
}

const ComprehensiveProductView: React.FC<ComprehensiveProductViewProps> = ({
    products,
    loading,
    onAdd,
    onView,
    onEdit,
    onDelete
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category).filter(Boolean));
        return Array.from(cats).map(c => ({ value: c as string, label: c as string }));
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, categoryFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = products.length;
        const totalVal = products.reduce((sum, p) => sum + (p.unit_price || 0), 0); // Not real inventory value, just sum of unit prices? Or maybe generic stat.
        // Better stat: items with images? items per category?
        // Let's just do count and categories count.
        const catCount = categories.length;
        const avgPrice = total > 0 ? totalVal / total : 0;
        return { total, catCount, avgPrice };
    }, [products, categories]);

    const EmptyState = () => (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                {searchTerm || categoryFilter
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by adding your first product to the catalog."}
            </p>
            {(searchTerm || categoryFilter) ? (
                <Button variant="outline" onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}>
                    Clear Filters
                </Button>
            ) : (
                <Button onClick={onAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-l-4 border-l-primary bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-primary/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.catCount}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Unit Price</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.avgPrice.toFixed(0)}</h3>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Controls & List */}
            <Card className="flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-1 gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <Select
                                id="category-filter"
                                label="" // Empty label as it's in a bar
                                placeholder="All Categories"
                                options={categories}
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <Button onClick={onAdd}>
                            <Plus className="w-4 h-4 mr-2" /> Add Product
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Category</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Unit Price</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {product.image_url ? (
                                                                <img
                                                                    src={product.image_url.startsWith('http') ? product.image_url : supabase.storage.from('product_images').getPublicUrl(product.image_url).data.publicUrl}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                            {product.description && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{product.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                        {product.category || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    ₹{product.unit_price.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" onClick={() => onView(product)} className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4 text-gray-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => onEdit(product)} className="h-8 w-8 p-0">
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => onDelete(product)} className="h-8 w-8 p-0">
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md group">
                                        <div className="aspect-square rounded-md bg-gray-100 dark:bg-gray-700 mb-3 overflow-hidden">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url.startsWith('http') ? product.image_url : supabase.storage.from('product_images').getPublicUrl(product.image_url).data.publicUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-10 h-10 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white truncate" title={product.name}>{product.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                ₹{product.unit_price}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
                                            <Button variant="ghost" size="sm" onClick={() => onView(product)} className="h-7 px-2">
                                                View
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(product)} className="h-7 px-2 text-blue-600">
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};
import { supabase } from '@/lib/supabaseClient';

export default ComprehensiveProductView;
