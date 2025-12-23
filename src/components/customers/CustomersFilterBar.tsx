import React, { useRef, useState } from 'react';
import { Search, Filter, Grid, List as ListIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import ImportExportCustomers from './enhancements/ImportExportCustomers';

interface CustomersFilterBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    tagFilter: string;
    setTagFilter: (tag: string) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    totalResults: number;
    onAddNew: () => void;
}

const CustomersFilterBar: React.FC<CustomersFilterBarProps> = ({
    searchQuery,
    setSearchQuery,
    tagFilter,
    setTagFilter,
    viewMode,
    setViewMode,
    totalResults,
    onAddNew
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
                            placeholder="Search by name, phone, or email..."
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

                    {/* Tag Filter Input (Simple for now, could be a multi-select later) */}
                    <div className="relative group min-w-[150px]">
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300`}>
                            <Filter size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter by Tag"
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                                className="bg-transparent border-none text-sm focus:ring-0 p-0 w-full text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                            />
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

                    {/* Import/Export buttons from existing component */}
                    <ImportExportCustomers />
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-4 px-1 text-xs text-gray-500 flex justify-between">
                <span>Showing {totalResults} customer{totalResults !== 1 ? 's' : ''}</span>
                {tagFilter && <span className="text-primary font-medium">Filtered by tag: {tagFilter}</span>}
            </div>
        </div>
    );
};

export default CustomersFilterBar;
