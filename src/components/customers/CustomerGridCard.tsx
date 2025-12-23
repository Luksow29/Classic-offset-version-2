import React from 'react';
import { motion } from 'framer-motion';
import { Customer } from '@/types';
import { Phone, Mail, MapPin, Edit, Trash2, Eye, MessageCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerGridCardProps {
    customer: Customer;
    onView: (customer: Customer) => void;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

const CustomerGridCard: React.FC<CustomerGridCardProps> = ({ customer, onView, onEdit, onDelete }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            className="group relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col"
        >
            {/* Top Pattern */}
            <div className="h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            <div className="px-6 flex flex-col items-center -mt-10 relative z-10">
                <div className={`w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br ${getGradient(customer.id)}`}>
                    {customer.name.charAt(0).toUpperCase()}
                </div>

                <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white text-center truncate w-full">
                    {customer.name}
                </h3>

                {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {customer.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {tag}
                            </span>
                        ))}
                        {customer.tags.length > 2 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-xs text-gray-400">+{customer.tags.length - 2}</span>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6 pt-4 space-y-4 flex-grow">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Phone size={14} className="text-gray-400" />
                        <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.email && (
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate">{customer.email}</span>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                        <p className="font-bold text-gray-900 dark:text-white">{customer.total_orders || 0}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Balance Due</p>
                        <p className={`font-bold ${(customer.balance_due || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ₹{(customer.balance_due || 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onView(customer)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition-colors shadow-sm" title="View Details">
                    <Eye size={18} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(customer)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-green-600 transition-colors shadow-sm" title="Edit">
                    <Edit size={18} />
                </motion.button>
                <a href={`https://wa.me/91${customer.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-green-500 transition-colors shadow-sm" title="WhatsApp">
                    <MessageCircle size={18} />
                </a>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(customer)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={18} />
                </motion.button>
            </div>
        </motion.div>
    );
};

// Helper for consistent gradients based on ID/Name
function getGradient(id: number | string) {
    const gradients = [
        'from-blue-400 to-indigo-500',
        'from-purple-400 to-pink-500',
        'from-emerald-400 to-teal-500',
        'from-orange-400 to-amber-500',
        'from-cyan-400 to-blue-500',
        'from-rose-400 to-red-500'
    ];
    const index = typeof id === 'number' ? id % gradients.length : id.charCodeAt(0) % gradients.length;
    return gradients[index];
}

export default CustomerGridCard;
