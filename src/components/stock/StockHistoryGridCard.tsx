import React from 'react';
import {
    Package, ShoppingCart, TrendingUp, TrendingDown, RotateCcw,
    Calendar, CreditCard, FileText, User
} from 'lucide-react';

interface StockTransaction {
    id: string;
    item_name: string;
    transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'USAGE';
    quantity: number;
    unit_of_measurement: string;
    used_for?: string;
    notes?: string;
    transaction_date: string;
    source: 'existing_stock' | 'materials';
    category?: string;
    supplier_name?: string;
    reference_number?: string;
    user_name?: string;
    cost_per_unit?: number;
    total_cost?: number;
}

interface StockHistoryGridCardProps {
    transaction: StockTransaction;
}

const StockHistoryGridCard: React.FC<StockHistoryGridCardProps> = ({ transaction }) => {
    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'IN':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'OUT':
            case 'USAGE':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'ADJUSTMENT':
                return <RotateCcw className="w-4 h-4 text-blue-500" />;
            default:
                return <Package className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'IN':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'OUT':
            case 'USAGE':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'ADJUSTMENT':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const typeColor = getTransactionColor(transaction.transaction_type);
    const isNegative = ['OUT', 'USAGE'].includes(transaction.transaction_type);

    return (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col h-full group">
            <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-foreground truncate" title={transaction.item_name}>
                            {transaction.item_name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(transaction.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div className={`p-1.5 rounded-lg ${typeColor.split(' ')[0]}`}>
                        {getTransactionIcon(transaction.transaction_type)}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${transaction.source === 'existing_stock'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                            }`}>
                            {transaction.source === 'existing_stock' ? 'Existing' : 'Materials'}
                        </span>
                        {transaction.category && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[120px]">
                                {transaction.category}
                            </span>
                        )}
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Quantity</span>
                            <span className={`font-semibold ${isNegative ? 'text-red-600' : transaction.transaction_type === 'IN' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                {isNegative ? '-' : '+'}{transaction.quantity} <span className="text-xs text-muted-foreground font-normal">{transaction.unit_of_measurement}</span>
                            </span>
                        </div>

                        {transaction.total_cost && transaction.total_cost > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Value</span>
                                <span className="font-medium">₹{transaction.total_cost.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {(transaction.used_for || transaction.reference_number || transaction.supplier_name) && (
                        <div className="text-xs space-y-1 pt-1">
                            {transaction.used_for && (
                                <div className="flex gap-1.5 text-muted-foreground">
                                    <span className="font-medium text-foreground w-12 shrink-0">Usage:</span>
                                    <span className="truncate">{transaction.used_for}</span>
                                </div>
                            )}
                            {transaction.reference_number && (
                                <div className="flex gap-1.5 text-muted-foreground">
                                    <span className="font-medium text-foreground w-12 shrink-0">Ref:</span>
                                    <span className="truncate">{transaction.reference_number}</span>
                                </div>
                            )}
                            {transaction.supplier_name && (
                                <div className="flex gap-1.5 text-muted-foreground">
                                    <span className="font-medium text-foreground w-12 shrink-0">Supplier:</span>
                                    <span className="truncate">{transaction.supplier_name}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {transaction.notes && (
                <div className="px-4 py-3 bg-muted/5 border-t border-border/50 text-xs text-muted-foreground italic">
                    "{transaction.notes}"
                </div>
            )}
        </div>
    );
};

export default StockHistoryGridCard;
