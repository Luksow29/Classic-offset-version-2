import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Phone,
    CheckCircle2,
    AlertCircle,
    Clock,
    Eye,
    ChevronDown,
    ChevronUp,
    CreditCard,
    DollarSign,
    Edit,
    Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

// Mimic the interfaces from PaymentManagementTable.tsx for standalone usage
interface Payment {
    id: string;
    customer_id: string;
    order_id: number;
    amount_paid: number;
    due_date: string;
    status: 'Paid' | 'Partial' | 'Due' | 'Overdue';
    payment_method?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
    customer_name?: string;
    customer_phone?: string;
    order_total_amount: number;
    order_amount_paid: number;
    order_balance_due: number;
}

interface GroupedPayment {
    order_id: number;
    customer_name: string;
    customer_phone: string;
    order_total_amount: number;
    order_amount_paid: number;
    order_balance_due: number;
    status: 'Paid' | 'Partial' | 'Due' | 'Overdue';
    payments: Payment[];
}

interface PaymentGridCardProps {
    group: GroupedPayment;
    onView: (payment: Payment) => void;
    onEdit: (payment: Payment) => void;
    onDelete: (payment: Payment) => void;
}

const PaymentGridCard: React.FC<PaymentGridCardProps> = ({ group, onView, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatus = (status: string, balance: number) => {
        if (status === 'Paid') return { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: CheckCircle2 };
        if (status === 'Partial') return { label: 'Partial', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: Clock };
        if (status === 'Overdue') return { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: AlertCircle };
        return { label: 'Due', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', icon: DollarSign };
    };

    const status = getStatus(group.status, group.order_balance_due);
    const StatusIcon = status.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:border-primary/50"
        >
            <div className="p-5 flex-grow space-y-4">
                {/* Header: Customer & Status */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {group.customer_name ? group.customer_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{group.customer_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                {group.customer_phone && <><Phone size={10} /> {group.customer_phone}</>}
                            </div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                        {status.label}
                    </div>
                </div>

                {/* Amount Summary */}
                <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Total</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">₹{group.order_total_amount.toLocaleString()}</div>
                    </div>
                    <div className="border-l border-gray-200 dark:border-gray-600 pl-2">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Paid</div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">₹{group.order_amount_paid.toLocaleString()}</div>
                    </div>
                    <div className="border-l border-gray-200 dark:border-gray-600 pl-2">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Due</div>
                        <div className="text-sm font-bold text-red-600 dark:text-red-400">₹{group.order_balance_due.toLocaleString()}</div>
                    </div>
                </div>

                {/* Info Row */}
                <div className="flex justify-between items-center text-sm">
                    <Link to={`/invoices/${group.order_id}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
                        <span className="text-xs font-semibold">Order #{group.order_id}</span>
                    </Link>
                    <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                        {group.payments.length} Txn{group.payments.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Expandable Transactions */}
            <div className="border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-3 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <span>{isExpanded ? 'Hide Transactions' : 'Show Transactions'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50/50 dark:bg-gray-800/50 overflow-hidden"
                        >
                            <div className="p-3 space-y-3">
                                {group.payments.map(payment => (
                                    <div key={payment.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-white">₹{payment.amount_paid.toLocaleString()}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${payment.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            {payment.payment_method && (
                                                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                    <CreditCard size={10} /> {payment.payment_method}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                                            <Button variant="ghost" size="sm" onClick={() => onView(payment)} className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"><Eye size={12} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(payment)} className="h-7 w-7 p-0 rounded-full hover:bg-blue-50 text-blue-500"><Edit size={12} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => onDelete(payment)} className="h-7 w-7 p-0 rounded-full hover:bg-red-50 text-red-500"><Trash2 size={12} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default PaymentGridCard;
