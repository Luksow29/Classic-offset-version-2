// src/components/orders/OrderForm.tsx
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import CustomerSelect from '../users/CustomerSelect';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, PlusCircle, User, Calendar, ShoppingBag, Palette, DollarSign, StickyNote, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
// Removed unused Firebase imports
import { logActivity } from '@/lib/activityLogger';
import CustomerFormModal from '../customers/CustomerFormModal';
import { Customer } from '@/types';

interface OrderFormProps {
    onSuccess: () => void;
    orderToEdit?: any;
}
interface Product {
    id: number;
    name: string;
    unit_price: number;
    category: string;
}
interface Employee {
    id: string;
    name: string;
    job_role: string;
}
interface SelectOption {
    value: string;
    label: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSuccess }) => {
    const { user, userProfile } = useUser();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [designers, setDesigners] = useState<Employee[]>([]);
    const [orderTypeOptions, setOrderTypeOptions] = useState<SelectOption[]>([]);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        customerName: '',
        orderType: '',
        productId: '',
        quantity: '1',
        rate: '0',
        subtotal: '0',
        serviceChargeType: 'none',
        serviceChargeValue: '0',
        serviceChargeAmount: '0',
        serviceChargeDescription: '',
        totalAmount: '0',
        amountReceived: '0',
        designNeeded: 'No',
        designerId: '',
        deliveryDate: '',
        paymentMethod: 'Cash',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerListVersion, setCustomerListVersion] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: productsData, error: productsError } = await supabase.from('products').select('id, name, unit_price, category');

            if (productsData) {
                setProducts(productsData);
                setFilteredProducts(productsData);

                // Dynamically create order type options from product categories
                const categories = [...new Set(productsData.map(p => p.category))];
                setOrderTypeOptions(categories.map(c => ({ value: c, label: c })));
            }

            const { data: designersData } = await supabase.from('employees').select('id, name, job_role').eq('job_role', 'Designer').eq('is_active', true);
            setDesigners(designersData || []);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const qty = parseInt(formData.quantity || '0');
        const rate = parseFloat(formData.rate || '0');
        const subtotal = qty * rate;

        // Calculate service charge
        let serviceChargeAmount = 0;
        if (formData.serviceChargeType === 'percentage') {
            serviceChargeAmount = (subtotal * parseFloat(formData.serviceChargeValue || '0')) / 100;
        } else if (formData.serviceChargeType === 'fixed') {
            serviceChargeAmount = parseFloat(formData.serviceChargeValue || '0');
        }

        const totalAmount = subtotal + serviceChargeAmount;

        setFormData(prev => ({
            ...prev,
            subtotal: subtotal.toFixed(2),
            serviceChargeAmount: serviceChargeAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
        }));
    }, [formData.quantity, formData.rate, formData.serviceChargeType, formData.serviceChargeValue]);

    useEffect(() => {
        setFilteredProducts(
            formData.orderType ? products.filter(p => p.category === formData.orderType) : products
        );
        setFormData(prev => ({ ...prev, productId: '', rate: '0', subtotal: '0', serviceChargeAmount: '0', totalAmount: '0' }));
    }, [formData.orderType, products]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        let newFormData = { ...formData, [id]: value };

        if (id === 'productId' && value) {
            const selectedProduct = products.find(p => p.id === parseInt(value));
            if (selectedProduct) {
                newFormData.rate = String(selectedProduct.unit_price);
            }
        }

        // Reset service charge values when type is set to 'none'
        if (id === 'serviceChargeType' && value === 'none') {
            newFormData = {
                ...newFormData,
                serviceChargeValue: '0',
                serviceChargeAmount: '0',
                serviceChargeDescription: ''
            };
        }

        setFormData(newFormData);
    };

    const handleCustomerSelect = (customer: { id: string; name: string; phone: string } | null) => {
        if (customer) {
            setFormData(prev => ({ ...prev, customerId: customer.id, customerName: customer.name }));
        } else {
            setFormData(prev => ({ ...prev, customerId: '', customerName: '' }));
        }
    }

    const handleNewCustomerSuccess = (newCustomer: Customer) => {
        setCustomerListVersion(prevVersion => prevVersion + 1);
        handleCustomerSelect(newCustomer);
        setIsCustomerModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.customerId) { setError("A customer must be selected."); return; }
        if (!formData.deliveryDate) { setError("Delivery date is required."); return; }
        if (!formData.orderType || !formData.productId) { setError("Order type and product are required."); return; }

        setLoading(true);
        setError(null);

        try {
            const orderPayload = {
                date: formData.date,
                customer_id: formData.customerId,
                customer_name: formData.customerName,
                order_type: formData.orderType,
                product_id: formData.productId, // Remove parseInt() - keep as string/uuid
                quantity: parseInt(formData.quantity),
                rate: parseFloat(formData.rate),
                subtotal: parseFloat(formData.subtotal),
                service_charge_type: formData.serviceChargeType,
                service_charge_value: parseFloat(formData.serviceChargeValue) || 0,
                service_charge_amount: parseFloat(formData.serviceChargeAmount) || 0,
                service_charge_description: formData.serviceChargeDescription || null,
                total_amount: parseFloat(formData.totalAmount),
                amount_received: parseFloat(formData.amountReceived) || 0,
                balance_amount: parseFloat(formData.totalAmount) - (parseFloat(formData.amountReceived) || 0),
                payment_method: formData.amountReceived !== '0' && parseFloat(formData.amountReceived) > 0 ? formData.paymentMethod : null,
                design_needed: formData.designNeeded === 'Yes',
                designer_id: formData.designNeeded === 'Yes' ? formData.designerId : null,
                delivery_date: formData.deliveryDate,
                notes: formData.notes,
                user_id: user.id
            };

            const { data: newOrder, error: orderError } = await supabase.from('orders').insert(orderPayload).select().single();
            if (orderError) throw orderError;
            if (!newOrder) throw new Error("Failed to create order, no data returned.");

            toast.success(`Order #${newOrder.id} created successfully!`);

            await logActivity(`Created new order #${newOrder.id} for ${formData.customerName}`, userProfile?.name);

            if (parseFloat(formData.amountReceived) > 0) {
                await supabase.from('payments').insert({
                    order_id: newOrder.id,
                    customer_id: formData.customerId,
                    amount_paid: parseFloat(formData.amountReceived),
                    payment_date: formData.date,
                    payment_method: formData.paymentMethod,
                    notes: 'Initial payment with order.',
                    created_by: user.id,
                });
            }

            onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to create order.");
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const designNeededOptions = [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }];
    const paymentMethodOptions = [{ value: 'Cash', label: 'Cash' }, { value: 'UPI', label: 'UPI' }, { value: 'Bank Transfer', label: 'Bank Transfer' }];

    return (
        <>
            <CustomerFormModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSuccess={handleNewCustomerSuccess}
            />
            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="text-red-700 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Customer Information</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-end gap-2">
                            <CustomerSelect
                                key={customerListVersion}
                                onSelect={handleCustomerSelect}
                                selectedId={formData.customerId}
                                className="flex-grow"
                            />
                            <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(true)} className="p-2 aspect-square h-10 flex-shrink-0" title="Add New Customer">
                                <PlusCircle size={20} />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input icon={<Calendar size={16} className="text-gray-400" />} id="date" label="Order Date *" type="date" value={formData.date} onChange={handleInputChange} required />
                            <Input icon={<Calendar size={16} className="text-gray-400" />} id="deliveryDate" label="Delivery Date *" type="date" value={formData.deliveryDate} onChange={handleInputChange} required />
                        </div>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Order Details</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select id="orderType" label="Order Type *" options={orderTypeOptions} value={formData.orderType} onChange={handleInputChange} required placeholder="Select Order Type" />
                            <Select id="productId" label="Product *" options={filteredProducts.map(p => ({ value: p.id, label: p.name }))} value={formData.productId} onChange={handleInputChange} required disabled={!products.length} placeholder="Select Product" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input id="quantity" label="Quantity *" type="number" min="1" value={formData.quantity} onChange={handleInputChange} required />
                            <Input id="rate" label="Rate (₹) *" type="number" value={formData.rate} onChange={handleInputChange} required />
                            <Input id="subtotal" label="Subtotal (₹)" type="number" value={formData.subtotal} readOnly className="bg-gray-100 dark:bg-gray-700" />
                        </div>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                        <Calculator className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Service Charge</h3>
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
                                        label={formData.serviceChargeType === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
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
                                label="Service Charge Description"
                                type="text"
                                value={formData.serviceChargeDescription}
                                onChange={handleInputChange}
                                placeholder="e.g., Rush order, Design consultation, Extra handling"
                            />
                        )}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex justify-between items-center text-lg font-semibold">
                                <span className="text-gray-700 dark:text-gray-300">Final Total Amount:</span>
                                <span className="text-blue-600 dark:text-blue-400">₹ {formData.totalAmount}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                        <Palette className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Design Details</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select id="designNeeded" label="Design Needed?" options={designNeededOptions} value={formData.designNeeded} onChange={handleInputChange} />
                        {formData.designNeeded === 'Yes' && (
                            <Select
                                id="designerId"
                                label="Assign Designer"
                                options={designers.map(d => ({ value: d.id, label: d.name }))}
                                value={formData.designerId}
                                onChange={handleInputChange}
                                required
                                placeholder="Select Designer"
                            />
                        )}
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Initial Payment</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="amountReceived" label="Amount Received (₹)" type="number" value={formData.amountReceived} onChange={handleInputChange} placeholder="Enter advance amount" />
                        <Select id="paymentMethod" label="Payment Method" options={paymentMethodOptions} value={formData.paymentMethod} onChange={handleInputChange} disabled={!formData.amountReceived || formData.amountReceived === '0'} />
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                        <StickyNote className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Additional Notes</h3>
                    </div>
                    <div className="p-6">
                        <TextArea id="notes" label="Notes" value={formData.notes} onChange={handleInputChange} placeholder="Any special instructions or details about the order..." />
                    </div>
                </Card>

                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Save Order'}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default OrderForm;