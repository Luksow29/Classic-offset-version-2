import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import CustomerSelect from '../../users/CustomerSelect';
import CustomerFormModal from '../../customers/CustomerFormModal';
import { User, PlusCircle, ChevronRight } from 'lucide-react';
import { Customer } from '@/types';

interface CustomerStepProps {
    customerId: string;
    customerName: string;
    onCustomerSelect: (customer: { id: string; name: string; phone?: string } | null) => void;
    onNext: () => void;
}

const CustomerStep: React.FC<CustomerStepProps> = ({
    customerId,
    customerName,
    onCustomerSelect,
    onNext
}) => {
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerListVersion, setCustomerListVersion] = useState(0);

    const handleNewCustomerSuccess = (newCustomer: Customer) => {
        setCustomerListVersion(prev => prev + 1);
        onCustomerSelect(newCustomer);
        setIsCustomerModalOpen(false);
    };

    return (
        <>
            <CustomerFormModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSuccess={handleNewCustomerSuccess}
            />
            
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                        <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Who is this order for?</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Select an existing customer or add a new one</p>
                </div>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-grow">
                                <CustomerSelect
                                    key={customerListVersion}
                                    selectedId={customerId}
                                    onSelect={onCustomerSelect}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCustomerModalOpen(true)}
                                className="flex items-center gap-2 h-10"
                                title="Add New Customer"
                            >
                                <PlusCircle size={18} />
                                <span className="hidden sm:inline">New Customer</span>
                            </Button>
                        </div>

                        {customerId && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-800 dark:text-green-200">{customerName}</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">Customer Selected ✓</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={onNext}
                        disabled={!customerId}
                        className="min-w-[200px]"
                        size="lg"
                    >
                        Next: Select Order Type
                        <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        </>
    );
};

export default CustomerStep;
