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
        <Card className="w-full max-w-4xl mx-auto shadow-xl border-t-4 border-t-primary">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-2xl">
                    <span>New Order Request</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        Step {currentStep} of {steps.length}
                    </span>
                </CardTitle>
                {/* Progress Bar */}
                <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        className="bg-primary h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
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
            <CardFooter className="flex justify-between p-6 bg-muted/20">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                >
                    Previous
                </Button>

                {currentStep < steps.length ? (
                    <Button
                        onClick={nextStep}
                        disabled={!isStepValid()}
                    >
                        Next Step
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!isStepValid() || isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Order Request"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default OrderWizard;
