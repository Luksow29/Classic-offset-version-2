import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabase/client';
import { Search, ShoppingBag, ZoomIn, Package, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
    id: number;
    name: string;
    unit_price: number;
    description?: string;
    category?: string;
    image_url?: string;
    created_at: string;
}

// Skeleton Components
const ProductCardSkeleton = () => (
    <Card className="overflow-hidden border border-gray-100 dark:border-gray-800">
        <Skeleton className="aspect-[4/3] w-full" />
        <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
            </div>
        </CardContent>
    </Card>
);

const LibrarySkeleton = () => (
    <div className="space-y-6">
        {/* Filter Bar Skeleton */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <Skeleton className="h-10 w-full md:w-96 rounded-lg" />
                <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-9 w-20 rounded-full" />
                    ))}
                </div>
            </div>
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <ProductCardSkeleton />
                </motion.div>
            ))}
        </div>
    </div>
);

const ProductLibrary: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
        return ['All', ...Array.from(cats)].sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        // Remove any leading slashes to prevent double slash issues
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;

        const { data } = supabase.storage.from('product_images').getPublicUrl(cleanPath);
        return data.publicUrl;
    };

    if (loading) {
        return <LibrarySkeleton />;
    }

    return (
        <div className="space-y-5">
            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
            >
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search designs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                        <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
                        {categories.map(category => (
                            <Button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                variant={selectedCategory === category ? "default" : "outline"}
                                size="sm"
                                className={`rounded-full whitespace-nowrap text-xs ${
                                    selectedCategory === category 
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-0' 
                                        : ''
                                }`}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredProducts.length}</span> designs
                    {searchTerm && <span> for "<span className="font-medium">{searchTerm}</span>"</span>}
                </p>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No designs found</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                            Try adjusting your search or category filter to find what you're looking for.
                        </p>
                        <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
                            Clear Filters
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.03, duration: 0.2 }}
                            >
                                <Card
                                    className="h-full overflow-hidden group cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-sm hover:shadow-xl transition-all duration-300"
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                        {product.image_url ? (
                                            <img
                                                src={getImageUrl(product.image_url)!}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="p-4 rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                                </div>
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <span className="text-white font-medium flex items-center gap-2 text-sm">
                                                <ZoomIn className="w-4 h-4" /> View Details
                                            </span>
                                        </div>
                                        {/* Category Badge */}
                                        {product.category && (
                                            <div className="absolute top-3 left-3">
                                                <Badge className="bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 backdrop-blur-sm border-0 text-xs">
                                                    {product.category}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                {product.name}
                                            </h3>
                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 whitespace-nowrap text-xs">
                                                ₹{product.unit_price.toFixed(0)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {product.description || 'Premium quality print template'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
                                {selectedProduct.image_url ? (
                                    <img
                                        src={getImageUrl(selectedProduct.image_url)!}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="p-6 rounded-full bg-gray-200 dark:bg-gray-700">
                                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5 text-left">
                                <div className="flex flex-wrap gap-2">
                                    {selectedProduct.category && (
                                        <Badge variant="secondary" className="text-sm">
                                            {selectedProduct.category}
                                        </Badge>
                                    )}
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-sm">
                                        ₹{selectedProduct.unit_price.toFixed(0)}
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {selectedProduct.description || 'Premium quality print template ready for your customization.'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                    <Button onClick={() => setSelectedProduct(null)} variant="outline" className="flex-1">
                                        Close
                                    </Button>
                                    <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                                        Enquire Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductLibrary;
