
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData } from '../types';

interface Product {
    id: number;
    name: string;
    unit_price: number;
    category: string;
    image_url?: string;
}

interface ProductSpecsStepProps {
    data: OrderFormData;
    updateData: (data: Partial<OrderFormData>) => void;
}

const ProductSpecsStep: React.FC<ProductSpecsStepProps> = ({ data, updateData }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data: productData, error } = await supabase
                .from('products')
                .select('id, name, unit_price, category, image_url');

            if (productData) {
                // Process images to get public URLs
                const productsWithImages = productData.map(product => {
                    let imageUrl = product.image_url;
                    if (imageUrl && !imageUrl.startsWith('http')) {
                        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
                        const { data: { publicUrl } } = supabase.storage.from('product_images').getPublicUrl(cleanPath);
                        imageUrl = publicUrl;
                    }
                    return { ...product, image_url: imageUrl };
                });

                setProducts(productsWithImages);
            }
            setLoading(false);
        };
        fetchProducts();
    }, []);

    const filteredProducts = data.orderType
        ? products.filter(p => p.category === data.orderType)
        : [];

    const handleProductSelect = (productId: string) => {
        const product = products.find(p => String(p.id) === productId);
        if (product) {
            updateData({
                productId: String(product.id),
                productName: product.name,
                unitPrice: product.unit_price
            });
        }
    };

    const selectedProduct = products.find(p => String(p.id) === data.productId);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {/* Urgency Selection - Added to align with Main App */}
                    <div className="space-y-2">
                        <Label className="text-base">Urgency Level</Label>
                        <Select
                            value={data.urgency}
                            onValueChange={(val) => updateData({ urgency: val })}
                        >
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select Urgency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Normal">🟢 Normal</SelectItem>
                                <SelectItem value="Urgent">🟡 Urgent</SelectItem>
                                <SelectItem value="Rush">🔴 Rush Order</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-2">
                        <Label className="text-base">Product ({data.orderType}) *</Label>
                        <Select
                            value={data.productId}
                            onValueChange={handleProductSelect}
                        >
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder={`Select Product from ${data.orderType}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)} className="py-2">
                                            <div className="flex items-center gap-3">
                                                {p.image_url && (
                                                    <img
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        className="h-10 w-10 object-cover rounded shadow-sm"
                                                    />
                                                )}
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium">{p.name}</span>
                                                    <span className="text-xs text-muted-foreground">₹{p.unit_price}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No products found in this category</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selected Product Preview */}
                    {selectedProduct && selectedProduct.image_url && (
                        <div className="flex justify-center py-2">
                            <img
                                src={selectedProduct.image_url}
                                alt={selectedProduct.name}
                                className="max-h-48 rounded-lg shadow-md object-contain border bg-white"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Delivery Date */}
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-base">Required Delivery Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "h-12 pl-3 text-left font-normal",
                                            !data.deliveryDate && "text-muted-foreground"
                                        )}
                                    >
                                        {data.deliveryDate ? (
                                            format(data.deliveryDate, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={data.deliveryDate}
                                        onSelect={(date) => updateData({ deliveryDate: date })}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Design Needed */}
                    <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                        <Checkbox
                            id="design"
                            checked={data.designNeeded}
                            onCheckedChange={(checked) => updateData({ designNeeded: checked as boolean })}
                        />
                        <Label htmlFor="design" className="text-base cursor-pointer">
                            I need design services for this order
                        </Label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSpecsStep;
