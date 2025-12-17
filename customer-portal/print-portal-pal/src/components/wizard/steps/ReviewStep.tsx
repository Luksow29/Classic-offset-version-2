
import React from 'react';
import { OrderFormData } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { CheckCircle2, FileText, Package, Calendar, Edit3 } from 'lucide-react';

interface ReviewStepProps {
    data: OrderFormData;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
    const estimatedTotal = (data.unitPrice || 0) * (data.quantity || 1);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg flex items-center space-x-3 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Almost done! Please review your order details before submitting.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-primary font-semibold border-b pb-2">
                            <FileText className="h-5 w-5" />
                            <h3>Job Details</h3>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                            <span className="text-muted-foreground">Job Name:</span>
                            <span className="font-medium">{data.jobName}</span>

                            <span className="text-muted-foreground">Description:</span>
                            <span>{data.description || '-'}</span>

                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{data.quantity}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-primary font-semibold border-b pb-2">
                            <Package className="h-5 w-5" />
                            <h3>Product</h3>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                            <span className="text-muted-foreground">Category:</span>
                            <span>{data.orderType}</span>

                            <span className="text-muted-foreground">Item:</span>
                            <span className="font-medium">{data.productName}</span>

                            <span className="text-muted-foreground">Unit Price:</span>
                            <span>₹{data.unitPrice}</span>

                            <span className="text-muted-foreground">Est. Total:</span>
                            <span className="font-bold text-lg text-primary">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-primary font-semibold border-b pb-2">
                            <Calendar className="h-5 w-5" />
                            <h3>Delivery</h3>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">
                                {data.deliveryDate ? format(data.deliveryDate, 'PPPP') : 'Not selected'}
                            </span>

                            <span className="text-muted-foreground">Design:</span>
                            <span>{data.designNeeded ? 'Design Services Requested' : 'Print Only'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-primary font-semibold border-b pb-2">
                            <Edit3 className="h-5 w-5" />
                            <h3>Files</h3>
                        </div>
                        {data.files.length > 0 ? (
                            <ul className="text-sm space-y-2">
                                {data.files.map((f, i) => (
                                    <li key={i} className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{f.name}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No files uploaded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReviewStep;
