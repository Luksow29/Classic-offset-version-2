import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, User, Phone, CheckCircle2, AlertCircle, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

interface InvoiceRow {
    order_id: number;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    order_date?: string;
}

interface InvoiceGridCardProps {
    invoice: InvoiceRow;
}

const InvoiceGridCard: React.FC<InvoiceGridCardProps> = ({ invoice }) => {
    const getStatus = () => {
        if (invoice.balance_due <= 0) return { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: CheckCircle2 };
        if (invoice.amount_paid > 0) return { label: 'Partial', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: Clock };
        return { label: 'Due', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: AlertCircle };
    };

    const status = getStatus();
    const StatusIcon = status.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:border-primary/50"
        >
            <div className="p-5 flex-grow space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <Link to={`/invoices/${invoice.order_id}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition-colors flex items-center gap-2">
                            <FileText size={18} className="text-primary" />
                            #{invoice.order_id}
                        </Link>
                        {invoice.order_date && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(invoice.order_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                    </div>
                </div>

                {/* Customer */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {invoice.customer_name ? invoice.customer_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{invoice.customer_name || 'Unknown'}</div>
                        {invoice.customer_phone && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} /> {invoice.customer_phone}
                            </div>
                        )}
                    </div>
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                        <div className="font-bold text-gray-900 dark:text-white">₹{invoice.total_amount?.toLocaleString()}</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${invoice.balance_due > 0 ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30'}`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{invoice.balance_due > 0 ? 'Balance Due' : 'Status'}</div>
                        <div className={`font-bold ${invoice.balance_due > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {invoice.balance_due > 0 ? `₹${invoice.balance_due.toLocaleString()}` : 'Paid'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                <Link to={`/invoices/${invoice.order_id}`} className="block">
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:shadow-sm transition-all">
                        <span className="text-sm font-medium">View Invoice</span>
                        <Eye size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
};

export default InvoiceGridCard;
