// src/components/customers/CustomerListTable.tsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Customer } from '@/types';
import { Eye, Edit, Trash2, Star, ArrowUpDown, Phone, Mail, User } from 'lucide-react';
import Button from '../ui/Button';

interface CustomerListTableProps {
    customers: Customer[];
    sortField: string;
    sortOrder: 'asc' | 'desc';
    onSort: (field: string) => void;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onView: (customer: Customer) => void;
}

const CustomerListTable: React.FC<CustomerListTableProps> = ({
    customers,
    sortField,
    sortOrder,
    onSort,
    onEdit,
    onDelete,
    onView
}) => {

    const SortButton: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
        <button
            onClick={() => onSort(field)}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold group"
        >
            {children}
            <ArrowUpDown size={14} className={`transition-colors ${sortField === field ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-500'}`} />
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-4"><SortButton field="name">Customer</SortButton></th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Tags</th>
                            <th className="px-6 py-4 text-right"><SortButton field="total_orders">Orders</SortButton></th>
                            <th className="px-6 py-4 text-right"><SortButton field="balance_due">Balance</SortButton></th>
                            <th className="px-6 py-4"><SortButton field="joined_date">Joined</SortButton></th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                        {customers.map((customer) => (
                            <motion.tr
                                key={customer.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                {/* Customer Name & Avatar */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gradient-to-br from-indigo-400 to-purple-500`}>
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                                                {customer.name}
                                                {(customer.total_spent || 0) > 10000 && <Star size={12} className="text-amber-400 fill-amber-400" />}
                                            </div>
                                            {customer.customer_code && <div className="text-xs text-gray-400 font-mono tracking-wide">{customer.customer_code}</div>}
                                        </div>
                                    </div>
                                </td>

                                {/* Contact Info */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Phone size={12} className="opacity-70" /> {customer.phone}
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Mail size={12} className="opacity-70" /> {customer.email}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Tags */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {customer.tags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                {tag}
                                            </span>
                                        ))}
                                        {customer.tags && customer.tags.length > 3 && (
                                            <span className="px-2 py-1 text-xs rounded-lg bg-gray-50 text-gray-400">+{customer.tags.length - 3}</span>
                                        )}
                                    </div>
                                </td>

                                {/* Orders Count */}
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold rounded-lg text-xs">
                                        {customer.total_orders || 0} Orders
                                    </span>
                                </td>

                                {/* Balance Due */}
                                <td className="px-6 py-4 text-right">
                                    <div className={`font-bold ${(customer.balance_due || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        ₹{(customer.balance_due || 0).toLocaleString()}
                                    </div>
                                </td>

                                {/* Joined Date */}
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(customer.joined_date || '').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => onView(customer)}>
                                            <Eye size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50" onClick={() => onEdit(customer)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(customer)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <User className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No customers found matching your criteria</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default CustomerListTable;
