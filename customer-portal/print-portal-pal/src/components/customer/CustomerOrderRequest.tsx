
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, ShoppingBag, Palette, StickyNote, CalendarIcon, Calculator, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Define the shape of the customer object being passed in
interface Customer {
    id: string;
    user_id: string;
    name: string;
    phone: string;
}

interface CustomerOrderRequestProps {
    customer: Customer;
    reorderData?: any;
    setReorderData?: (data: any) => void;
}

// Enhanced schema with more detailed fields
const OrderRequestSchema = z.object({
  orderType: z.string({ required_error: "Please select an order type." }),
  productId: z.string({ required_error: "Please select a product." }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  rate: z.coerce.number().optional(),
  subtotal: z.coerce.number().optional(),
  totalAmount: z.coerce.number().optional(),
  deliveryDate: z.date({ required_error: "Delivery date is required." }),
  designNeeded: z.boolean().default(false),
  notes: z.string().max(500, "Notes are too long.").optional(),
});

type OrderRequestFormValues = z.infer<typeof OrderRequestSchema>;

interface Product {
    id: number;
    name: string;
    unit_price: number;
    category: string;
    description?: string;
}

const CustomerOrderRequestForm: React.FC<CustomerOrderRequestProps> = ({ customer, reorderData, setReorderData }) => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [orderTypeOptions, setOrderTypeOptions] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const form = useForm<OrderRequestFormValues>({
        resolver: zodResolver(OrderRequestSchema),
        defaultValues: {
            orderType: '',
            productId: '',
            quantity: 1,
            rate: 0,
            subtotal: 0,
            totalAmount: 0,
            deliveryDate: undefined,
            designNeeded: false,
            notes: '',
        },
    });

    const { watch, setValue, control, handleSubmit } = form;
    const selectedOrderType = watch('orderType');
    const selectedProductId = watch('productId');
    const quantity = watch('quantity');
    const rate = watch('rate');

    // --- Robust pre-fill for Quick Re-order ---
    const [pendingProductId, setPendingProductId] = useState<string | null>(null);
    useEffect(() => {
        if (reorderData) {
            setValue('orderType', reorderData.order_type || '');
            setValue('quantity', reorderData.quantity || 1);
            setValue('designNeeded', reorderData.designNeeded ?? false);
            setValue('notes', reorderData.notes || '');
            setValue('deliveryDate', undefined); // Always blank

            // Save intended productId for after orderType is set
            let matchedProduct = null;
            if (products.length > 0) {
                if (reorderData.productId) {
                    matchedProduct = products.find(p => String(p.id) === String(reorderData.productId));
                }
                if (!matchedProduct && reorderData.product_name) {
                    matchedProduct = products.find(p => p.name === reorderData.product_name);
                }
            }
            if (matchedProduct) {
                setPendingProductId(String(matchedProduct.id));
            } else {
                setPendingProductId(null);
            }

            toast({ title: "Re-order Started", description: "Order details have been filled in. Please select a new delivery date." });
            if (setReorderData) setTimeout(() => setReorderData(null), 500); // Clear after pre-fill
        }
    }, [reorderData, setValue, setReorderData, toast, products]);

    // After orderType changes and filteredProducts update, set productId if pending
    useEffect(() => {
        if (pendingProductId && filteredProducts.some(p => String(p.id) === pendingProductId)) {
            setValue('productId', pendingProductId);
            setPendingProductId(null);
        }
    }, [filteredProducts, pendingProductId, setValue]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data, error } = await supabase.from('products').select('id, name, unit_price, category');
            if (error) {
                toast({ title: "Error", description: "Could not fetch products.", variant: "destructive" });
            } else if (data) {
                setProducts(data);
                const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
                setOrderTypeOptions(categories);
            }
        };
        fetchInitialData();
    }, [toast]);

    useEffect(() => {
        setFilteredProducts(
            selectedOrderType ? products.filter(p => p.category === selectedOrderType) : []
        );
        setValue('productId', '');
    }, [selectedOrderType, products, setValue]);

    // Calculate totals when quantity or rate changes
    useEffect(() => {
        if (rate && quantity) {
            const subtotal = rate * quantity;
            setValue('subtotal', subtotal);
            setValue('totalAmount', subtotal);
        } else {
            setValue('subtotal', 0);
            setValue('totalAmount', 0);
        }
    }, [rate, quantity, setValue]);

    // Update rate and product info when product is selected
    useEffect(() => {
        if (selectedProductId) {
            const product = products.find(p => p.id === parseInt(selectedProductId));
            if (product) {
                setSelectedProduct(product);
                setValue('rate', product.unit_price);
            }
        } else {
            setSelectedProduct(null);
            setValue('rate', 0);
        }
    }, [selectedProductId, products, setValue]);
    const onSubmit = async (values: OrderRequestFormValues) => {
        // **SOLUTION:** Include customer name and phone in the request_data
        const requestDataWithCustomerInfo = {
            ...values,
            deliveryDate: values.deliveryDate ? values.deliveryDate.toISOString() : null,
            date: new Date().toISOString().split('T')[0], // Add current date
            customerName: customer.name,
            customerPhone: customer.phone,
        };

        const payload = {
            customer_id: customer.id,
            user_id: customer.user_id,
            status: "pending_approval", // Explicitly set status
            request_data: requestDataWithCustomerInfo,
        };

        const { error } = await supabase.from('order_requests').insert(payload);

        if (error) {
            console.error("Submission Error:", error);
            toast({ title: "Submission Failed", description: `An error occurred: ${error.message}`, variant: "destructive" });
        } else {
            toast({ title: "Success!", description: "Your order request has been submitted for review." });
            form.reset();
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Customer Info Display */}
            <Card className="p-0 overflow-hidden border border-primary/20">
                <CardHeader className="p-4 bg-primary/5 border-b flex flex-row items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg text-primary">Customer Information</h3>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                            <div className="text-lg font-semibold">{customer.name}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                            <div className="text-lg font-semibold">{customer.phone || 'N/A'}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Order Details */}
                    <Card className="p-0 overflow-hidden">
                        <CardHeader className="p-4 bg-muted/50 border-b flex flex-row items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-lg">Order Details</h3>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={control} name="orderType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">Order Type *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Select Order Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {orderTypeOptions.map(cat => (
                                                    <SelectItem key={cat} value={cat} className="py-3">
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={control} name="productId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">Product *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedOrderType}>
                                            <FormControl>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder={selectedOrderType ? "Select Product" : "Select Order Type First"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredProducts.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)} className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{p.name}</span>
                                                            <span className="text-sm text-muted-foreground">₹{p.unit_price.toLocaleString('en-IN')} per unit</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>

                            {/* Quantity and Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={control} name="quantity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">Quantity *</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                className="h-12 text-lg" 
                                                placeholder="Enter quantity"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={control} name="rate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">Rate (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                readOnly 
                                                className="h-12 text-lg bg-muted font-medium" 
                                                placeholder="Auto-filled"
                                                value={field.value ? `₹${field.value.toLocaleString('en-IN')}` : ''} 
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}/>
                                
                                <FormField control={control} name="subtotal" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">Subtotal (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                readOnly 
                                                className="h-12 text-lg bg-muted font-bold text-primary" 
                                                placeholder="Auto-calculated"
                                                value={field.value ? `₹${field.value.toLocaleString('en-IN')}` : ''} 
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}/>
                            </div>

                            {/* Price Summary Card */}
                            {selectedProduct && quantity > 0 && (
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Selected Product:</span>
                                            <span className="font-medium">{selectedProduct.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Unit Price:</span>
                                            <span className="font-medium">₹{selectedProduct.unit_price.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Quantity:</span>
                                            <span className="font-medium">{quantity} units</span>
                                        </div>
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center text-lg font-bold text-primary">
                                                <span>Estimated Total:</span>
                                                <span>₹{(selectedProduct.unit_price * quantity).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Design & Delivery */}
                    <Card className="p-0 overflow-hidden">
                        <CardHeader className="p-4 bg-muted/50 border-b flex flex-row items-center gap-3">
                            <Palette className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-lg">Design & Delivery</h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={control} name="deliveryDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-base font-medium">Delivery Date *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button 
                                                        variant={"outline"} 
                                                        className={cn(
                                                            "h-12 justify-start text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar 
                                                    mode="single" 
                                                    selected={field.value} 
                                                    onSelect={field.onChange} 
                                                    disabled={(date) => date <= new Date()}
                                                    initialFocus 
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={control} name="designNeeded" render={({ field }) => (
                                    <FormItem className="flex flex-col justify-center">
                                        <div className="flex items-center space-x-3 rounded-md border border-primary/20 p-4 h-12">
                                            <FormControl>
                                                <Checkbox 
                                                    checked={field.value} 
                                                    onCheckedChange={field.onChange} 
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-base font-medium cursor-pointer">
                                                    I need a new design for this order
                                                </FormLabel>
                                            </div>
                                        </div>
                                    </FormItem>
                                )}/>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Notes */}
                    <Card className="p-0 overflow-hidden">
                        <CardHeader className="p-4 bg-muted/50 border-b flex flex-row items-center gap-3">
                            <StickyNote className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-lg">Additional Information</h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <FormField control={control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-medium">Special Instructions or Notes</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Please provide any special instructions, design preferences, or additional details for your order..."
                                            className="min-h-[120px] resize-none"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                    
                    {/* Submit Button */}
                    <div className="pt-6">
                        <Button 
                            type="submit" 
                            size="lg" 
                            className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:shadow-glow transition-all duration-300" 
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-5 w-5" /> 
                                    Submitting Request...
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                    Submit Order Request
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default CustomerOrderRequestForm;
