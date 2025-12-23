import React from 'react';
import { Eye, Edit, Trash2, ArrowUpDown, CheckCircle, AlertTriangle, Package2 } from 'lucide-react';
import Button from '../ui/Button';
import { Material } from './MaterialsPage';

interface MaterialGridCardProps {
    material: Material;
    onEdit: (material: Material) => void;
    onView: (material: Material) => void;
    onTransaction: (material: Material) => void;
    onDelete: (material: Material) => void;
}

const MaterialGridCard: React.FC<MaterialGridCardProps> = ({
    material,
    onEdit,
    onView,
    onTransaction,
    onDelete
}) => {
    const getStockStatusIcon = (status: string) => {
        switch (status) {
            case 'IN_STOCK':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'LOW_STOCK':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'OUT_OF_STOCK':
                return <Package2 className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'IN_STOCK':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'LOW_STOCK':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'OUT_OF_STOCK':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col h-full group">
            <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-foreground truncate" title={material.material_name}>
                            {material.material_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{material.category_name}</p>
                    </div>
                    <div className={`p-1.5 rounded-lg ${getStockStatusColor(material.stock_status).split(' ')[0]} bg-opacity-20`}>
                        {getStockStatusIcon(material.stock_status)}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/30 p-2 rounded-lg">
                            <span className="block text-muted-foreground mb-0.5">Quantity</span>
                            <span className="font-medium text-foreground">
                                {material.current_quantity} <span className="text-[10px] text-muted-foreground">{material.unit_of_measurement}</span>
                            </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                            <span className="block text-muted-foreground mb-0.5">Total Value</span>
                            <span className="font-bold text-green-600 dark:text-green-400">₹{material.total_value.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                        <span>Unit Cost: ₹{material.cost_per_unit.toLocaleString('en-IN')}</span>
                        <span>Min: {material.minimum_stock_level}</span>
                    </div>

                    <div className="mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${getStockStatusColor(material.stock_status)}`}>
                            {material.stock_status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-2 border-t border-border/50 bg-muted/5 grid grid-cols-4 gap-1">
                <Button variant="ghost" size="sm" onClick={() => onView(material)} title="View" className="h-8 w-full p-0">
                    <Eye size={14} className="opacity-70" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(material)} title="Edit" className="h-8 w-full p-0">
                    <Edit size={14} className="opacity-70" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onTransaction(material)} title="Transaction" className="h-8 w-full p-0 text-blue-600 hover:text-blue-700">
                    <ArrowUpDown size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(material)} title="Delete" className="h-8 w-full p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 size={14} />
                </Button>
            </div>
        </div>
    );
};

export default MaterialGridCard;
