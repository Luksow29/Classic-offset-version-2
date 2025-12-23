import React from 'react';
import { Edit, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';

interface StockItem {
    id: string;
    item_name: string;
    category: string;
    current_quantity: number;
    quantity_used?: number;
    balance: number;
    storage_location?: string;
    minimum_threshold: number;
    last_updated: string;
    unit_of_measurement: string;
    cost_per_unit?: number;
    source: 'existing_stock' | 'materials';
    supplier_name?: string;
    stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    total_value: number;
}

interface StockGridCardProps {
    item: StockItem;
    onUpdate: (item: StockItem) => void;
}

const StockGridCard: React.FC<StockGridCardProps> = ({ item, onUpdate }) => {
    const getStockStatusStyling = (status: string) => {
        switch (status) {
            case 'OUT_OF_STOCK':
                return { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' };
            case 'LOW_STOCK':
                return { color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
            case 'IN_STOCK':
                return { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
            default:
                return { color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' };
        }
    };

    const getStockPercentage = (item: StockItem) => {
        if (item.source === 'existing_stock') {
            const maxStock = item.current_quantity || 1;
            return Math.min((item.balance / maxStock) * 100, 100);
        } else {
            const threshold = item.minimum_threshold || 1;
            return Math.min((item.balance / (threshold * 2)) * 100, 100);
        }
    };

    const statusStyle = getStockStatusStyling(item.stock_status);
    const percentage = getStockPercentage(item);

    return (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col h-full group">
            <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-foreground truncate" title={item.item_name}>
                            {item.item_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {item.category}
                            </span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${item.source === 'existing_stock'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                }`}>
                                {item.source === 'existing_stock' ? 'Existing' : 'Material'}
                            </span>
                        </div>
                    </div>
                    <div className={`p-1.5 rounded-lg ${statusStyle.bgColor}`}>
                        {item.stock_status === 'OUT_OF_STOCK' ? (
                            <AlertTriangle className={`w-4 h-4 ${statusStyle.color}`} />
                        ) : item.stock_status === 'LOW_STOCK' ? (
                            <TrendingUp className={`w-4 h-4 ${statusStyle.color}`} />
                        ) : (
                            <Package className={`w-4 h-4 ${statusStyle.color}`} />
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-muted-foreground">Stock Level</span>
                            <span className="font-medium">
                                {item.balance} <span className="text-muted-foreground text-xs">{item.unit_of_measurement}</span>
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                        </div>
                        {item.minimum_threshold > 0 && (
                            <div className="flex justify-end mt-1">
                                <span className="text-xs text-muted-foreground">Min: {item.minimum_threshold}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/30 p-2 rounded-lg">
                            <span className="block text-muted-foreground mb-0.5">Value</span>
                            <span className="font-medium text-foreground">₹{item.total_value.toLocaleString()}</span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                            <span className="block text-muted-foreground mb-0.5">Updated</span>
                            <span className="font-medium text-foreground">
                                {new Date(item.last_updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    {item.storage_location && item.storage_location !== 'Not specified' && (
                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Loc:</span> {item.storage_location}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-3 border-t border-border/50 bg-muted/5 flex justify-between items-center">
                <div className={`text-xs font-medium px-2 py-1 rounded ${statusStyle.bgColor} ${statusStyle.color} bg-opacity-50`}>
                    {item.stock_status.replace('_', ' ')}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(item)}
                    className="h-8 text-xs hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50 transition-colors"
                >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Update
                </Button>
            </div>
        </div>
    );
};

export default StockGridCard;
