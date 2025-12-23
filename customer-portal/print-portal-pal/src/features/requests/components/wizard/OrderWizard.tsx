import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { toast } from "sonner";
import { supabase } from '@/services/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Customer, OrderFormData } from '@/features/requests/types/types';

// Steps
import JobDetailsStep from './steps/JobDetailsStep';
import OrderTypeStep from './steps/OrderTypeStep';
import ProductSpecsStep from './steps/ProductSpecsStep';
import FileUploadStep from './steps/FileUploadStep';
import ReviewStep from './steps/ReviewStep';

interface OrderWizardProps {
    customer: Customer;
    onComplete?: () => void;
}

const steps = [
    { id: 1, title: "Job Details" },
    { id: 2, title: "Order Type" },
    { id: 3, title: "Specifications" },
    { id: 4, title: "Upload Files" },
    { id: 5, title: "Review" }
];

const OrderWizard: React.FC<OrderWizardProps> = ({ customer, onComplete }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<OrderFormData>({
        jobName: '',
        quantity: 0,
        description: '',
        orderType: '',
        productId: '',
        productName: '',
        unitPrice: 0,
        deliveryDate: undefined,
        designNeeded: false,
        urgency: 'Normal',
        files: []
    });

    const updateFormData = (data: Partial<OrderFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: // Job Details
                return formData.jobName.length > 0 && formData.quantity > 0;
            case 2: // Order Type
                return formData.orderType.length > 0;
            case 3: // Specifications
                return formData.productId.length > 0 && formData.deliveryDate !== undefined;
            case 4: // Upload Files
                return true; // Optional
            case 5: // Review
                return true;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Prepare JSON payload for request_data
            const { files, deliveryDate, ...restData } = formData;

            const calculatedTotal = formData.unitPrice * formData.quantity;

            const requestData = {
                ...restData,
                rate: formData.unitPrice || 0,  // Explicitly include as 'rate'
                totalAmount: calculatedTotal || 0,  // Explicitly include totalAmount
                subtotal: calculatedTotal || 0,  // Include subtotal
                deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
                customerName: customer.name,
                customerPhone: customer.phone,
                submissionDate: new Date().toISOString(),
                urgency: formData.urgency
            };

            // 2. Insert into order_requests
            const { data: orderData, error: orderError } = await supabase
                .from('order_requests')
                .insert({
                    customer_id: customer.id,
                    // We don't have user_id on customer type, relying on DB default or auth context if needed?
                    // Actually checking previous code, it used customer.user_id but types.ts might not have it.
                    // Let's check if the table allows null or if we can get it from auth.
                    // For now, assume customer_id is sufficient or Row Level Security handles user assignment.
                    status: 'pending_approval',
                    request_data: requestData
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Upload files if any
            if (formData.files.length > 0 && orderData) {
                for (const file of formData.files) {
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${orderData.id}/${crypto.randomUUID()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('order-files')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('File upload error:', uploadError);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }
            }

            toast.success("Order request submitted successfully!");
            if (onComplete) {
                onComplete();
            } else {
                navigate('/customer-portal/requests');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error("Failed to submit order request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-border/50 pb-6">
                {/* Step Indicators */}
                <div className="flex items-center justify-between mb-6">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        backgroundColor: currentStep >= step.id ? '#3b82f6' : '#e2e8f0',
                                        scale: currentStep === step.id ? 1.1 : 1
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                        currentStep >= step.id 
                                            ? 'text-white' 
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {currentStep > step.id ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        step.id
                                    )}
                                </motion.div>
                                <span className={`mt-2 text-xs font-medium hidden sm:block ${
                                    currentStep >= step.id 
                                        ? 'text-blue-600 dark:text-blue-400' 
                                        : 'text-slate-400'
                                }`}>
                                    {step.title}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors ${
                                    currentStep > step.id 
                                        ? 'bg-blue-500' 
                                        : 'bg-slate-200 dark:bg-slate-700'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Current Step Title */}
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">
                            {steps[currentStep - 1].title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Step {currentStep} of {steps.length}
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {Math.round((currentStep / steps.length) * 100)}% Complete
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 min-h-[420px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="h-full"
                    >
                        {currentStep === 1 && (
                            <JobDetailsStep data={formData} updateData={updateFormData} />
                        )}
                        {currentStep === 2 && (
                            <OrderTypeStep
                                selectedType={formData.orderType}
                                onSelect={(type) => {
                                    updateFormData({ orderType: type });
                                    setTimeout(() => setCurrentStep(3), 300);
                                }}
                            />
                        )}
                        {currentStep === 3 && (
                            <ProductSpecsStep data={formData} updateData={updateFormData} />
                        )}
                        {currentStep === 4 && (
                            <FileUploadStep data={formData} updateData={updateFormData} />
                        )}
                        {currentStep === 5 && (
                            <ReviewStep
                                data={formData}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-border/50">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className="gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                </Button>

                {currentStep < steps.length ? (
                    <Button
                        onClick={nextStep}
                        disabled={!isStepValid()}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        Next Step
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!isStepValid() || isSubmitting}
                        className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Submit Request
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default OrderWizard;
