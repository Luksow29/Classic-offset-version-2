import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { logActivity } from '@/lib/activityLogger';
import toast from 'react-hot-toast';
import { 
    Check, 
    User, 
    Package, 
    ClipboardList, 
    CreditCard, 
    FileText,
    Loader2
} from 'lucide-react';

// Import step components
import CustomerStep from './steps/CustomerStep';
import OrderTypeStep from './steps/OrderTypeStep';
import SpecsStep from './steps/SpecsStep';
import PaymentDesignStep from './steps/PaymentDesignStep';
import MatterStep from './steps/MatterStep';

interface UnifiedOrderWizardProps {
    onSuccess: () => void;
}

// Step definitions
const STEPS = [
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'type', label: 'Order Type', icon: Package },
    { id: 'specs', label: 'Specs & Price', icon: ClipboardList },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'matter', label: 'Content', icon: FileText },
];

// Initial form state
const initialFormState = {
    // Customer
    customerId: '',
    customerName: '',
    
    // Order Type
    orderType: '',
    
    // Specs
    productId: '',
    quantity: '500',
    rate: '0',
    subtotal: '0',
    serviceChargeType: 'none',
    serviceChargeValue: '0',
    serviceChargeAmount: '0',
    serviceChargeDescription: '',
    totalAmount: '0',
    deliveryDate: '',
    urgency: 'Normal',
    
    // Payment & Design
    amountReceived: '0',
    paymentMethod: 'Cash',
    designNeeded: 'Yes',
    designerId: '',
    notes: '',
};

const UnifiedOrderWizard: React.FC<UnifiedOrderWizardProps> = ({ onSuccess }) => {
    const { user, userProfile } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(initialFormState);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Navigation
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // Update form data
    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    // Handle customer selection
    const handleCustomerSelect = (customer: { id: string; name: string; phone?: string } | null) => {
        if (customer) {
            updateFormData({ customerId: customer.id, customerName: customer.name });
        } else {
            updateFormData({ customerId: '', customerName: '' });
        }
    };

    // Handle order type selection
    const handleOrderTypeSelect = (type: string) => {
        updateFormData({ orderType: type });
    };

    // Create order in database (before matter step)
    const createOrder = async (): Promise<string | null> => {
        if (!user) {
            toast.error('User not authenticated');
            return null;
        }

        setLoading(true);
        try {
            const orderPayload = {
                date: new Date().toISOString().split('T')[0],
                customer_id: formData.customerId,
                customer_name: formData.customerName,
                order_type: formData.orderType,
                product_id: formData.productId,
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
                payment_method: parseFloat(formData.amountReceived) > 0 ? formData.paymentMethod : null,
                design_needed: formData.designNeeded === 'Yes',
                designer_id: formData.designNeeded === 'Yes' && formData.designerId ? formData.designerId : null,
                delivery_date: formData.deliveryDate,
                notes: formData.urgency !== 'Normal' 
                    ? `[${formData.urgency.toUpperCase()}] ${formData.notes}` 
                    : formData.notes,
                status: formData.designNeeded === 'Yes' ? 'Awaiting Content' : 'Processing',
                user_id: user.id
            };

            const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert(orderPayload)
                .select()
                .single();

            if (orderError) throw orderError;
            if (!newOrder) throw new Error('Failed to create order');

            // Create initial payment if amount received
            if (parseFloat(formData.amountReceived) > 0) {
                await supabase.from('payments').insert({
                    order_id: newOrder.id,
                    customer_id: formData.customerId,
                    amount_paid: parseFloat(formData.amountReceived),
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: formData.paymentMethod,
                    notes: 'Initial payment with order.',
                    created_by: user.id,
                });
            }

            await logActivity(
                `Created order #${newOrder.id} for ${formData.customerName}`,
                userProfile?.name || user.email || 'User'
            );

            toast.success(`Order #${newOrder.id} created!`);
            setOrderId(newOrder.id);
            return newOrder.id;

        } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Failed to create order');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Handle payment step completion
    const handlePaymentStepNext = async () => {
        // If design is not needed, create order and complete
        if (formData.designNeeded === 'No') {
            const newOrderId = await createOrder();
            if (newOrderId) {
                // Update status to Processing since no design needed
                await supabase
                    .from('orders')
                    .update({ status: 'Processing' })
                    .eq('id', newOrderId);
                onSuccess();
            }
        } else {
            // Design needed - create order and go to matter step
            const newOrderId = await createOrder();
            if (newOrderId) {
                nextStep();
            }
        }
    };

    // Handle matter completion
    const handleMatterComplete = () => {
        toast.success('Order created with content!');
        onSuccess();
    };

    // Handle matter skip
    const handleMatterSkip = () => {
        toast.success('Order created! You can add content later.');
        onSuccess();
    };

    // Determine visible steps based on design needed
    const visibleSteps = formData.designNeeded === 'Yes' ? STEPS : STEPS.slice(0, 4);

    // Render current step
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <CustomerStep
                        customerId={formData.customerId}
                        customerName={formData.customerName}
                        onCustomerSelect={handleCustomerSelect}
                        onNext={nextStep}
                    />
                );
            case 1:
                return (
                    <OrderTypeStep
                        selectedType={formData.orderType}
                        onSelect={handleOrderTypeSelect}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                );
            case 2:
                return (
                    <SpecsStep
                        orderType={formData.orderType}
                        formData={{
                            productId: formData.productId,
                            quantity: formData.quantity,
                            rate: formData.rate,
                            subtotal: formData.subtotal,
                            serviceChargeType: formData.serviceChargeType,
                            serviceChargeValue: formData.serviceChargeValue,
                            serviceChargeAmount: formData.serviceChargeAmount,
                            serviceChargeDescription: formData.serviceChargeDescription,
                            totalAmount: formData.totalAmount,
                            deliveryDate: formData.deliveryDate,
                            urgency: formData.urgency,
                        }}
                        onFormDataChange={updateFormData}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                );
            case 3:
                return (
                    <PaymentDesignStep
                        totalAmount={formData.totalAmount}
                        formData={{
                            amountReceived: formData.amountReceived,
                            paymentMethod: formData.paymentMethod,
                            designNeeded: formData.designNeeded,
                            designerId: formData.designerId,
                            notes: formData.notes,
                        }}
                        onFormDataChange={updateFormData}
                        onNext={handlePaymentStepNext}
                        onBack={prevStep}
                    />
                );
            case 4:
                return (
                    <MatterStep
                        orderId={orderId || ''}
                        orderType={formData.orderType}
                        customerName={formData.customerName}
                        onComplete={handleMatterComplete}
                        onSkip={handleMatterSkip}
                        onBack={prevStep}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        <span className="text-lg font-medium">Creating Order...</span>
                    </div>
                </div>
            )}

            {/* Stepper Header */}
            <div className="relative">
                <div className="flex justify-between items-center">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full -z-10">
                        <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStep / (visibleSteps.length - 1)) * 100}%` }}
                        />
                    </div>

                    {visibleSteps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const Icon = step.icon;

                        return (
                            <div 
                                key={step.id} 
                                className="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 px-2"
                            >
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-2 
                                        transition-all duration-300 shadow-sm
                                        ${isCompleted 
                                            ? 'bg-primary-500 border-primary-500 text-white' 
                                            : isCurrent 
                                                ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500 text-primary-600 dark:text-primary-400' 
                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                        }
                                    `}
                                >
                                    {isCompleted ? <Check size={20} /> : <Icon size={18} />}
                                </div>
                                <span className={`
                                    text-xs font-medium hidden sm:block
                                    ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}
                                `}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default UnifiedOrderWizard;
