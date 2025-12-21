
import React from 'react';
import { useOutletContext, useNavigate } from "react-router-dom";
import OrderWizard from "@/features/requests/components/wizard/OrderWizard";
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Customer {
    id: string;
    user_id: string;
    name: string;
    phone: string;
}

interface OutletContext {
    customer: Customer | null;
}

const NewRequestPage = () => {
    const { customer } = useOutletContext<OutletContext>();
    const navigate = useNavigate();

    if (!customer) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/customer-portal/requests')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Order Request</h1>
                    <p className="text-muted-foreground">Follow the steps to submit a new print order.</p>
                </div>
            </div>

            <OrderWizard
                customer={customer}
                onComplete={() => navigate('/customer-portal/requests')}
            />
        </div>
    );
};

export default NewRequestPage;
