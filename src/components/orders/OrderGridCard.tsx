import React from 'react';
import { motion } from 'framer-motion';
import { OrdersTableOrder, Status } from '@/types';
import { Calendar, Clock, Edit, Eye, MoreHorizontal, MessageCircle, Phone, Package, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderGridCardProps {
    order: OrdersTableOrder;
    onView: (id: number) => void;
    onEdit: (order: OrdersTableOrder) => void;
    onDelete: (order: OrdersTableOrder) => void;
    onStatusUpdate: (order: OrdersTableOrder) => void;
    isSelected: boolean;
    onSelect: (order: OrdersTableOrder) => void;
}

const OrderGridCard: React.FC<OrderGridCardProps> = ({
    order, onView, onEdit, onDelete, onStatusUpdate, isSelected, onSelect
}) => {

    const statusColors: Partial<Record<Status, string>> = {
        Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Design: 'bg-blue-100 text-blue-700 border-blue-200',
        Correction: 'bg-red-100 text-red-700 border-red-200',
        Printing: 'bg-purple-100 text-purple-700 border-purple-200',
        Delivered: 'bg-green-100 text-green-700 border-green-200',
    };

    const statusColor = statusColors[order.status as Status] || 'bg-gray-100 text-gray-700 border-gray-200';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            className={`group relative bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700 shadow-sm'}`}
        >
            {/* Selection Overlay */}
            <div className="absolute top-4 left-4 z-20">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(order)}
                    className={`w-5 h-5 rounded-lg border-2 transition-all cursor-pointer ${isSelected ? 'bg-primary border-primary' : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'}`}
                />
            </div>

            {/* Card Header & Status */}
            <div className="p-5 pb-0 flex justify-between items-start">
                <div className="pl-8"> {/* Space for checkbox */}
                    <Link to={`/invoices/${order.order_id}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition-colors">
                        #{order.order_id}
                    </Link>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.date).toLocaleDateString()}
                    </div>
                </div>
                <div onClick={() => onStatusUpdate(order)} className={`cursor-pointer px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColor}`}>
                    {order.status}
                </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex-grow space-y-4">
                {/* Customer Info */}
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {order.customer_name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{order.customer_name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {order.customer_phone && <span className="flex items-center gap-1"><Phone size={10} /> {order.customer_phone}</span>}
                        </div>
                    </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Type</span>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                            <Package size={14} className="text-primary" />
                            {order.order_type}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total</span>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">₹{order.total_amount?.toLocaleString() || '0'}</div>
                    </div>
                </div>

                {order.delivery_date && (
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/20">
                        <Clock size={12} />
                        Due: {new Date(order.delivery_date).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Action Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => onView(order.order_id)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary transition-colors shadow-sm" title="View Details">
                        <Eye size={18} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(order)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors shadow-sm" title="Edit">
                        <Edit size={18} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => onStatusUpdate(order)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-purple-500 transition-colors shadow-sm" title="Update Status">
                        <MoreHorizontal size={18} />
                    </motion.button>
                    {order.customer_phone && (
                        <a href={`https://wa.me/91${order.customer_phone}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-green-500 transition-colors shadow-sm">
                            <MessageCircle size={18} />
                        </a>
                    )}
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(order)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={18} />
                </motion.button>
            </div>

        </motion.div>
    );
};

export default OrderGridCard;
