import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/activityLogger';

interface JobSpecsFormProps {
    customerId: string;
    customerName: string;
    jobType: string;
    onSave: (orderId: string, specs: any) => void;
    onBack: () => void;
}

interface Product {
    id: number;
    name: string;
    unit_price: number;
    category: string;
}

const JobSpecsForm: React.FC<JobSpecsFormProps> = ({ customerId, customerName, jobType, onSave, onBack }) => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        productId: '',
        quantity: '500', // Default
        rate: '0',
        totalAmount: '0',
        deliveryDate: '',
        urgency: 'Normal', // Store in notes or new field? Storing in notes for now
        notes: ''
    });

    // Fetch products for the selected jobType (category)
    useEffect(() => {
        const fetchProducts = async () => {
            // Map jobType to category names if they differ, or ensure DB matches
            // Assuming jobTypes like 'invitation' match product categories or we filter loosely
            // For now, fetching all and filtering in client or simple filter
            const { data } = await supabase.from('products').select('*'); // .eq('category', jobType) if categories match exactly
            if (data) {
                // Simple fuzzy match or exact match
                const filtered = data.filter(p => p.category.toLowerCase().includes(jobType) || jobType.includes(p.category.toLowerCase()));
                setProducts(filtered.length > 0 ? filtered : data); // Fallback to all if no match
            }
        };
        fetchProducts();
    }, [jobType]);

    // Auto-calculate total
    useEffect(() => {
        const qty = parseInt(formData.quantity) || 0;
        const rate = parseFloat(formData.rate) || 0;
        setFormData(prev => ({ ...prev, totalAmount: (qty * rate).toFixed(2) }));
    }, [formData.quantity, formData.rate]);

    // Update rate when product changes
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pid = e.target.value;
        const product = products.find(p => p.id.toString() === pid);
        setFormData(prev => ({
            ...prev,
            productId: pid,
            rate: product ? String(product.unit_price) : prev.rate
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error("User not found"); return; }
        setLoading(true);

        try {
            // 1. Create Order
            const orderPayload = {
                date: new Date().toISOString().split('T')[0],
                customer_id: customerId,
                customer_name: customerName,
                order_type: jobType, // category
                product_id: parseInt(formData.productId),
                quantity: parseInt(formData.quantity),
                rate: parseFloat(formData.rate),
                total_amount: parseFloat(formData.totalAmount),
                subtotal: parseFloat(formData.totalAmount), // Assuming no service charge for now
                balance_amount: parseFloat(formData.totalAmount), // No initial payment in this simplified flow yet?
                amount_received: 0,
                status: 'Draft', // Or 'Pending'
                design_needed: true, // Required by DB
                delivery_date: formData.deliveryDate,
                notes: `Urgency: ${formData.urgency}. ${formData.notes}`,
                user_id: user.id
            };

            const { data: order, error } = await supabase.from('orders').insert(orderPayload).select().single();

            if (error) throw error;

            toast.success("Job Draft Created!");
            await logActivity(`Started drafting job #${order.id}`, user.email || 'User');

            onSave(order.id, formData);

        } catch (error: any) {
            console.error("Error creating job:", error);
            toast.error("Failed to create job draft");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h2 className="text-xl font-semibold">Job Specifications</h2>
                <div className="w-20" />
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <Select
                        id="productId"
                        label="Select Product"
                        options={[{ value: '', label: 'Select Specification' }, ...products.map(p => ({ value: p.id.toString(), label: p.name }))]}
                        value={formData.productId}
                        onChange={handleProductChange}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="quantity"
                            label="Quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />
                        <Select
                            id="urgency"
                            label="Urgency"
                            options={[
                                { value: 'Normal', label: 'Normal' },
                                { value: 'Urgent', label: 'Urgent 🔥' }
                            ]}
                            value={formData.urgency}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="deliveryDate"
                            label="Due Date"
                            type="date"
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="totalAmount"
                            label="Estimated Amount (₹)"
                            value={formData.totalAmount}
                            readOnly
                            className="bg-gray-50"
                        />
                    </div>

                    <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save & Next: Enter Matter
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default JobSpecsForm;
