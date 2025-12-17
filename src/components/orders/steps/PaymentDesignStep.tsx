import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import TextArea from '../../ui/TextArea';
import Button from '../../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { 
    ChevronLeft, 
    ChevronRight, 
    DollarSign, 
    Palette,
    StickyNote,
    CreditCard
} from 'lucide-react';

interface PaymentDesignStepProps {
    totalAmount: string;
    formData: {
        amountReceived: string;
        paymentMethod: string;
        designNeeded: string;
        designerId: string;
        notes: string;
    };
    onFormDataChange: (data: Partial<PaymentDesignStepProps['formData']>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface Designer {
    id: string;
    name: string;
    job_role: string;
}

const PaymentDesignStep: React.FC<PaymentDesignStepProps> = ({
    totalAmount,
    formData,
    onFormDataChange,
    onNext,
    onBack
}) => {
    const [designers, setDesigners] = useState<Designer[]>([]);

    // Fetch designers
    useEffect(() => {
        const fetchDesigners = async () => {
            const { data } = await supabase
                .from('employees')
                .select('id, name, job_role')
                .eq('job_role', 'Designer')
                .eq('is_active', true);
            if (data) {
                setDesigners(data);
            }
        };
        fetchDesigners();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        onFormDataChange({ [id]: value });
    };

    const balanceAmount = parseFloat(totalAmount) - parseFloat(formData.amountReceived || '0');
    const paymentMethodOptions = [
        { value: 'Cash', label: '💵 Cash' },
        { value: 'UPI', label: '📱 UPI' },
        { value: 'Bank Transfer', label: '🏦 Bank Transfer' },
        { value: 'Card', label: '💳 Card' }
    ];

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                    <CreditCard className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Payment & Design</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Configure payment and design requirements</p>
            </div>

            {/* Initial Payment */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Initial Payment (Optional)</h3>
                </div>
                <div className="p-6 space-y-4">
                    {/* Amount Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                                ₹{parseFloat(totalAmount).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="text-center border-x dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Advance</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                ₹{parseFloat(formData.amountReceived || '0').toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                            <p className={`text-xl font-bold ${balanceAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                ₹{balanceAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            id="amountReceived"
                            label="Amount Received (₹)"
                            type="number"
                            min="0"
                            max={totalAmount}
                            value={formData.amountReceived}
                            onChange={handleInputChange}
                            placeholder="Enter advance amount"
                        />
                        <Select
                            id="paymentMethod"
                            label="Payment Method"
                            options={paymentMethodOptions}
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            disabled={!formData.amountReceived || formData.amountReceived === '0'}
                        />
                    </div>
                </div>
            </Card>

            {/* Design Requirements */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                    <Palette className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Design Requirements</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            id="designNeeded"
                            label="Design Needed?"
                            options={[
                                { value: 'Yes', label: '✅ Yes - Need Design Work' },
                                { value: 'No', label: '❌ No - Ready to Print' }
                            ]}
                            value={formData.designNeeded}
                            onChange={handleInputChange}
                        />
                        {formData.designNeeded === 'Yes' && (
                            <Select
                                id="designerId"
                                label="Assign Designer"
                                options={designers.map(d => ({ value: d.id, label: d.name }))}
                                value={formData.designerId}
                                onChange={handleInputChange}
                                placeholder="Select Designer"
                                required
                            />
                        )}
                    </div>
                    
                    {formData.designNeeded === 'Yes' && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                💡 <strong>Tip:</strong> You can add matter/content details in the next step for the designer.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Notes */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center gap-3">
                    <StickyNote className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Additional Notes</h3>
                </div>
                <div className="p-6">
                    <TextArea
                        id="notes"
                        label="Notes (Optional)"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any special instructions, requirements, or notes about this order..."
                        rows={3}
                    />
                </div>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    size="lg"
                    className="min-w-[200px]"
                >
                    {formData.designNeeded === 'Yes' ? 'Next: Add Content' : 'Review & Create Order'}
                    <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
};

export default PaymentDesignStep;
