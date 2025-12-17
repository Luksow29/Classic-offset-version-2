import React, { useState, useEffect } from 'react';
import Button from '../../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { 
    Mail, 
    Briefcase, 
    FileText, 
    BookOpen, 
    ChevronLeft, 
    ChevronRight,
    Image,
    Printer,
    Package
} from 'lucide-react';

interface OrderTypeStepProps {
    selectedType: string;
    onSelect: (type: string) => void;
    onNext: () => void;
    onBack: () => void;
}

interface OrderTypeOption {
    id: string;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
}

// Default order types with icons
const DEFAULT_ORDER_TYPES: OrderTypeOption[] = [
    { 
        id: 'Invitation Cards', 
        label: 'Invitation', 
        icon: Mail, 
        description: 'Wedding, Party, Events',
        color: 'from-pink-500 to-rose-600'
    },
    { 
        id: 'Business Cards', 
        label: 'Business Card', 
        icon: Briefcase, 
        description: 'Visiting & ID Cards',
        color: 'from-blue-500 to-indigo-600'
    },
    { 
        id: 'Bill Books', 
        label: 'Bill Book', 
        icon: BookOpen, 
        description: 'Invoice, Estimate, Receipt',
        color: 'from-green-500 to-emerald-600'
    },
    { 
        id: 'Posters', 
        label: 'Poster / Notice', 
        icon: FileText, 
        description: 'Flyers, Pamphlets, Banners',
        color: 'from-orange-500 to-amber-600'
    },
    { 
        id: 'Brochures', 
        label: 'Brochure', 
        icon: Image, 
        description: 'Catalogs, Menus, Leaflets',
        color: 'from-purple-500 to-violet-600'
    },
    { 
        id: 'Other', 
        label: 'Other Printing', 
        icon: Printer, 
        description: 'Custom print jobs',
        color: 'from-gray-500 to-slate-600'
    },
];

const OrderTypeStep: React.FC<OrderTypeStepProps> = ({ 
    selectedType, 
    onSelect, 
    onNext, 
    onBack 
}) => {
    const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>(DEFAULT_ORDER_TYPES);
    const [, setLoading] = useState(true);

    // Fetch actual categories from products table and merge with defaults
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data: products } = await supabase
                    .from('products')
                    .select('category')
                    .not('category', 'is', null);

                if (products) {
                    const dbCategories = [...new Set(products.map(p => p.category))];
                    
                    // Merge DB categories with defaults, prioritizing DB categories
                    const mergedTypes = DEFAULT_ORDER_TYPES.map(type => {
                        const matchedCategory = dbCategories.find(
                            cat => cat.toLowerCase().includes(type.id.toLowerCase().split(' ')[0]) ||
                                   type.id.toLowerCase().includes(cat.toLowerCase().split(' ')[0])
                        );
                        return matchedCategory ? { ...type, id: matchedCategory } : type;
                    });

                    // Add any DB categories not in defaults
                    dbCategories.forEach(cat => {
                        if (!mergedTypes.find(t => t.id === cat)) {
                            mergedTypes.push({
                                id: cat,
                                label: cat,
                                icon: Package,
                                description: 'Custom category',
                                color: 'from-teal-500 to-cyan-600'
                            });
                        }
                    });

                    setOrderTypes(mergedTypes);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleTypeClick = (typeId: string) => {
        onSelect(typeId);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                    <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">What type of order?</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Select the category that best matches this job</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;

                    return (
                        <div
                            key={type.id}
                            onClick={() => handleTypeClick(type.id)}
                            className={`
                                relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden
                                ${isSelected
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg transform scale-[1.02]'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 hover:shadow-md hover:-translate-y-1'
                                }
                            `}
                        >
                            {/* Background gradient on hover/select */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 ${isSelected ? 'opacity-5' : 'group-hover:opacity-5'} transition-opacity duration-300`} />
                            
                            <div className="relative flex items-start gap-4">
                                <div className={`
                                    p-3 rounded-xl shadow-sm transition-all duration-300
                                    ${isSelected
                                        ? `bg-gradient-to-br ${type.color} text-white shadow-lg`
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:scale-110'}
                                `}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-base transition-colors ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {type.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        {type.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between pt-6">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!selectedType}
                    size="lg"
                    className="min-w-[200px]"
                >
                    Next: Specifications
                    <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
};

export default OrderTypeStep;
