import React from 'react';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown, RotateCcw, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface MaterialTransaction {
    id: string;
    material_name: string;
    transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    unit_of_measurement: string;
    unit_cost?: number;
    total_cost?: number;
    reference_number?: string;
    notes?: string;
    transaction_date: string;
    category_name?: string;
    supplier_name?: string;
    created_at: string;
}

interface MaterialHistoryGridCardProps {
    transaction: MaterialTransaction;
}

const MaterialHistoryGridCard: React.FC<MaterialHistoryGridCardProps> = ({ transaction }) => {
    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'IN': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'OUT': return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'IN': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'OUT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow dark:bg-gray-800">
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                                {getTransactionIcon(transaction.transaction_type)}
                                {transaction.transaction_type}
                            </span>
                            <span className="text-xs text-gray-500">
                                {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white truncate" title={transaction.material_name}>
                            {transaction.material_name}
                        </h4>
                        {transaction.category_name && (
                            <p className="text-xs text-gray-500">{transaction.category_name}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className={`font-bold text-lg ${transaction.transaction_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.transaction_type === 'OUT' ? '-' : '+'}{transaction.quantity}
                        </div>
                        <div className="text-xs text-gray-500">{transaction.unit_of_measurement}</div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Total Cost</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {transaction.total_cost ? `₹${transaction.total_cost.toLocaleString('en-IN')}` : '-'}
                        </span>
                    </div>
                    <div className="flex flex-col items-end max-w-[50%]">
                        <span className="text-xs text-gray-500">Ref / Notes</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-full text-right" title={transaction.notes || transaction.reference_number}>
                            {transaction.reference_number || transaction.notes || '-'}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default MaterialHistoryGridCard;
