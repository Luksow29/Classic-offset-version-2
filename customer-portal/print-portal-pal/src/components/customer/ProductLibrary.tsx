import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, ShoppingBag, ZoomIn, Loader2, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-800"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
                    {categories.map(category => (
                        <Button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            className="rounded-full whitespace-nowrap"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold">No products found</p>
                    <p>Try adjusting your search or category filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card
                                    className="h-full overflow-hidden group cursor-pointer border-0 ring-1 ring-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
                                        {product.image_url ? (
                                            <img
                                                src={getImageUrl(product.image_url)!}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                <ShoppingBag className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                                            <span className="text-white font-medium flex items-center gap-2">
                                                <ZoomIn className="w-4 h-4" /> View Details
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-2 text-left">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-1 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {product.name}
                                            </h3>
                                            <Badge variant="secondary" className="whitespace-nowrap">
                                                ₹{product.unit_price.toFixed(2)}
                                            </Badge>
                                        </div>
                                        {product.category && (
                                            <Badge variant="outline" className="text-xs">
                                                {product.category}
                                            </Badge>
                                        )}
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">
                                            {product.description || 'No description available'}
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-inner">
                                {selectedProduct.image_url ? (
                                    <img
                                        src={getImageUrl(selectedProduct.image_url)!}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300">
                                        <ShoppingBag className="w-20 h-20" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 text-left">
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {selectedProduct.category && (
                                            <Badge variant="secondary">
                                                {selectedProduct.category}
                                            </Badge>
                                        )}
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700">
                                            Price: ₹{selectedProduct.unit_price.toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Description</h4>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {selectedProduct.description || 'No detailed description available for this product.'}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                    <Button onClick={() => setSelectedProduct(null)} variant="outline" className="flex-1">
                                        Close
                                    </Button>
                                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
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
