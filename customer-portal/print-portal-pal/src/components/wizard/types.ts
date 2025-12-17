
export interface Customer {
    id: string;
    user_id: string;
    name: string;
    phone: string;
}

export type OrderFormData = {
    // Step 1: Job Details
    jobName: string;
    quantity: number;
    description: string;
    
    // Step 2: Product Specs
    orderType: string;
    productId: string;
    productName: string; // for display
    unitPrice: number;
    deliveryDate: Date | undefined;
    designNeeded: boolean;
    urgency: string;

    // Step 3: Files (managed separately but tracked here for validation if needed)
    files: File[];
};
