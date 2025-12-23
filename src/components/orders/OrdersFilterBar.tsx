import React, { useRef, useState } from 'react';
import { Search, Filter, Calendar as CalendarIcon, Grid, List as ListIcon, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

interface OrdersFilterBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    dateFilter: string;
    setDateFilter: (date: string) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    showDeleted: boolean;
    setShowDeleted: (show: boolean) => void;
    totalResults: number;
}

const OrdersFilterBar: React.FC<OrdersFilterBarProps> = ({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    viewMode,
    setViewMode,
    showDeleted,
    setShowDeleted,
    totalResults
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const statuses = [
        { value: '', label: 'All Statuses' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Design', label: 'Design' },
        { value: 'Correction', label: 'Correction' },
        { value: 'Printing', label: 'Printing' },
        { value: 'Delivered', label: 'Delivered' }
    ];

    return (
        <div className="sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-y border-gray-200 dark:border-gray-800 py-4 px-4 sm:px-6 mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between max-w-7xl mx-auto">

                {/* Search Bar - Expanded on Focus */}
                <motion.div
                    animate={{ flex: isSearchFocused ? 1.5 : 1 }}
                    className="relative w-full lg:w-auto transition-all duration-300"
                >
                    <div className={`relative flex items-center bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 ${isSearchFocused ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                        <Search className={`absolute left-4 w-5 h-5 ${isSearchFocused ? 'text-primary' : 'text-gray-400'}`} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="w-full bg-transparent py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none rounded-2xl"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                                className="absolute right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Filters and Toggles */}
                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">

                    {/* Status Pills */}
                    <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        {statuses.slice(0, 4).map((status) => (
                            <button
                                key={status.value}
                                onClick={() => setStatusFilter(status.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${statusFilter === status.value
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {status.label === 'All Statuses' ? 'All' : status.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Filter */}
                    <div className="relative group">
                        <input
                            type="month"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${dateFilter ? 'bg-primary/5 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50'}`}>
                            <CalendarIcon size={18} />
                            <span className="text-sm font-medium whitespace-nowrap">
                                {dateFilter ? new Date(dateFilter).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Month'}
                            </span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* View Toggle */}
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                    </div>

                    {/* More options (Show Deleted) */}
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all border-dashed ${showDeleted ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                        <input
                            type="checkbox"
                            checked={showDeleted}
                            onChange={(e) => setShowDeleted(e.target.checked)}
                            className="rounded border-gray-300 text-red-500 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold whitespace-nowrap">Deleted</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrdersFilterBar;
