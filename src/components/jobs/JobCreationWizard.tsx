import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button'; // Assuming we have these
import { Check, ChevronRight, User, Grid, ClipboardList, FileText } from 'lucide-react';
import CustomerSelect from '../users/CustomerSelect';
import JobTypeSelector from './JobTypeSelector';
import JobSpecsForm from './JobSpecsForm';
import MatterForm from './MatterForm';
import { Customer } from '@/types';

// Steps definition
const STEPS = [
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'type', label: 'Job Type', icon: Grid },
    { id: 'specs', label: 'Specs', icon: ClipboardList },
    { id: 'matter', label: 'Matter', icon: FileText },
];

const JobCreationWizard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [jobData, setJobData] = useState({
        customerId: '',
        customerName: '',
        jobType: '', // e.g. 'invitation'
        specs: {},   // quantity, paper, etc.
        orderId: null as string | null, // Created after Specs step
    });

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const handleCustomerSelect = (customer: { id: string; name: string } | null) => {
        if (customer) {
            setJobData(prev => ({ ...prev, customerId: customer.id, customerName: customer.name }));
            // Auto advance if customer selected? Maybe better manual for confirmation
        }
    };

    const handleTypeSelect = (type: string) => {
        setJobData(prev => ({ ...prev, jobType: type }));
        nextStep();
    };

    const handleSpecsSave = (orderId: string, specs: any) => {
        setJobData(prev => ({ ...prev, orderId, specs }));
        nextStep();
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: // Customer
                return (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <h2 className="text-xl font-semibold text-center">Who is this job for?</h2>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <CustomerSelect
                                selectedId={jobData.customerId}
                                onSelect={handleCustomerSelect}
                            />
                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={nextStep}
                                    disabled={!jobData.customerId}
                                    className="w-full sm:w-auto"
                                >
                                    Next: Select Job Type <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 1: // Type
                return (
                    <JobTypeSelector
                        selectedType={jobData.jobType}
                        onSelect={handleTypeSelect}
                        onBack={prevStep}
                    />
                );
            case 2: // Specs
                return (
                    <JobSpecsForm
                        customerId={jobData.customerId}
                        customerName={jobData.customerName}
                        jobType={jobData.jobType}
                        onSave={handleSpecsSave}
                        onBack={prevStep}
                    />
                );
            case 3: // Matter
                return (
                    <MatterForm
                        orderId={jobData.orderId!}
                        jobType={jobData.jobType}
                        onBack={() => { }} // Can't really go back to specs easily once order created without handling updates. For now, disabled or warn.
                        onSuccess={() => { /* Handle full completion, maybe redirect to dashboard */ }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
            {/* Header / Stepper */}
            <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full" />
                {STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${isCompleted || isCurrent
                                        ? 'bg-primary-600 border-primary-600 text-white'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                    }`}
                            >
                                {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                            </div>
                            <span className={`text-sm font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderCurrentStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default JobCreationWizard;
