export interface Product {
    id: number;
    name: string;
    unit_price: number;
    description?: string;
    category?: string;
    created_at: string;
    image_url?: string;
}

export interface ProductFormData {
    name: string;
    unit_price: number;
    description?: string;
    category?: string;
    image_url?: string;
}
