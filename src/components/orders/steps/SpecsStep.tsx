import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import {
    ChevronLeft,
    ChevronRight,
    Package,
    Calendar,
    Calculator,
    Zap
} from 'lucide-react';

interface SpecsStepProps {
    orderType: string;
    formData: {
        productId: string;
        quantity: string;
        rate: string;
        subtotal: string;
        serviceChargeType: string;
        serviceChargeValue: string;
        serviceChargeAmount: string;
        serviceChargeDescription: string;
        totalAmount: string;
        deliveryDate: string;
        urgency: string;
    };
    onFormDataChange: (data: Partial<SpecsStepProps['formData']>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface Product {
    id: string;
    name: string;
    unit_price: number;
    category: string;
    image_url?: string;
}

const SpecsStep: React.FC<SpecsStepProps> = ({
    orderType,
    formData,
    onFormDataChange,
    onNext,
    onBack
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase
                .from('products')
                .select('id, name, unit_price, category, image_url');
            if (data) {
                setProducts(data);
            }
        };
        fetchProducts();
    }, []);

    // Filter products by order type
    useEffect(() => {
        if (orderType && products.length > 0) {
            const filtered = products.filter(p => p.category === orderType);
            setFilteredProducts(filtered.length > 0 ? filtered : products);
        } else {
            setFilteredProducts(products);
        }
    }, [orderType, products]);

    // Update selected image when productId changes
    useEffect(() => {
        if (formData.productId) {
            const product = products.find(p => String(p.id) === String(formData.productId));
            setSelectedProductImage(product?.image_url || null);
        } else {
            setSelectedProductImage(null);
        }
    }, [formData.productId, products]);

    // Calculate totals
    useEffect(() => {
        const qty = parseInt(formData.quantity || '0');
        const rate = parseFloat(formData.rate || '0');
        const subtotal = qty * rate;

        let serviceChargeAmount = 0;
        if (formData.serviceChargeType === 'percentage') {
            serviceChargeAmount = (subtotal * parseFloat(formData.serviceChargeValue || '0')) / 100;
        } else if (formData.serviceChargeType === 'fixed') {
            serviceChargeAmount = parseFloat(formData.serviceChargeValue || '0');
        }

        const totalAmount = subtotal + serviceChargeAmount;

        onFormDataChange({
            subtotal: subtotal.toFixed(2),
            serviceChargeAmount: serviceChargeAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.quantity, formData.rate, formData.serviceChargeType, formData.serviceChargeValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        let updates: Partial<SpecsStepProps['formData']> = { [id]: value };

        if (id === 'productId' && value) {
            // Compare IDs as strings to handle potential number/string mismatch
            const selectedProduct = products.find(p => String(p.id) === String(value));
            if (selectedProduct) {
                updates.rate = String(selectedProduct.unit_price);
            }
        }

        if (id === 'serviceChargeType' && value === 'none') {
            updates = {
                ...updates,
                serviceChargeValue: '0',
                serviceChargeAmount: '0',
                serviceChargeDescription: ''
            };
        }

        onFormDataChange(updates);
    };

    const isValid = formData.productId && formData.quantity && formData.deliveryDate;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                    <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Specifications & Pricing</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Configure product details for <span className="font-semibold text-primary-600">{orderType}</span>
                </p>
            </div>

            {/* Product & Quantity */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Product Details</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            id="productId"
                            label="Select Product *"
                            options={filteredProducts.map(p => ({ value: p.id, label: p.name }))}
                            value={formData.productId}
                            onChange={handleInputChange}
                            required
                            placeholder="Choose a product"
                        />

                        {selectedProductImage && (
                            <div className="mt-2 md:col-span-2 flex justify-center">
                                <img
                                    src={selectedProductImage}
                                    alt="Selected Product"
                                    className="h-32 object-contain rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
                                />
                            </div>
                        )}

                        <Select
                            id="urgency"
                            label="Urgency Level"
                            options={[
                                { value: 'Normal', label: '🟢 Normal' },
                                { value: 'Urgent', label: '🟡 Urgent' },
                                { value: 'Rush', label: '🔴 Rush Order' }
                            ]}
                            value={formData.urgency}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            id="quantity"
                            label="Quantity *"
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter quantity"
                        />
                        <Input
                            id="rate"
                            label="Rate per Unit (₹) *"
                            type="number"
                            step="0.01"
                            value={formData.rate}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            id="subtotal"
                            label="Subtotal (₹)"
                            type="number"
                            value={formData.subtotal}
                            readOnly
                            className="bg-gray-100 dark:bg-gray-700"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <Input
                            id="deliveryDate"
                            label="Delivery Date *"
                            type="date"
                            value={formData.deliveryDate}
                            onChange={handleInputChange}
                            required
                            className="flex-grow"
                        />
                    </div>
                </div>
            </Card>

            {/* Service Charge */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                    <Calculator className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Service Charge (Optional)</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            id="serviceChargeType"
                            label="Service Charge Type"
                            options={[
                                { value: 'none', label: 'No Service Charge' },
                                { value: 'percentage', label: 'Percentage (%)' },
                                { value: 'fixed', label: 'Fixed Amount (₹)' }
                            ]}
                            value={formData.serviceChargeType}
                            onChange={handleInputChange}
                        />
                        {formData.serviceChargeType !== 'none' && (
                            <>
                                <Input
                                    id="serviceChargeValue"
                                    label={formData.serviceChargeType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.serviceChargeValue}
                                    onChange={handleInputChange}
                                    placeholder={formData.serviceChargeType === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                                />
                                <Input
                                    id="serviceChargeAmount"
                                    label="Service Charge (₹)"
                                    type="number"
                                    value={formData.serviceChargeAmount}
                                    readOnly
                                    className="bg-gray-100 dark:bg-gray-700"
                                />
                            </>
                        )}
                    </div>
                    {formData.serviceChargeType !== 'none' && (
                        <Input
                            id="serviceChargeDescription"
                            label="Description (Optional)"
                            type="text"
                            value={formData.serviceChargeDescription}
                            onChange={handleInputChange}
                            placeholder="e.g., Rush order, Design consultation"
                        />
                    )}
                </div>
            </Card>

            {/* Total Summary */}
            <Card className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-500 rounded-full text-white">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Order Amount</p>
                            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                                ₹ {parseFloat(formData.totalAmount).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    {formData.urgency !== 'Normal' && (
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${formData.urgency === 'Rush'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            {formData.urgency === 'Rush' ? '🔥 Rush Order' : '⚡ Urgent'}
                        </div>
                    )}
                </div>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!isValid}
                    size="lg"
                    className="min-w-[200px]"
                >
                    Next: Payment & Design
                    <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
};

export default SpecsStep;
