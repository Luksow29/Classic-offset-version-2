// src/components/reports/ReportsTable.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Printer, Download, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

interface ReportsTableProps {
    loading: boolean;
    data: any[] | null;
    headers: string[];
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onRowClick?: (row: any) => void;
    onPrint?: () => void;
    onDownloadPdf?: () => void;
    reportLabel: string;
}

const ReportsTable: React.FC<ReportsTableProps> = ({
    loading,
    data,
    headers,
    sortConfig,
    onSort,
    currentPage,
    totalPages,
    onPageChange,
    onRowClick,
    onPrint,
    onDownloadPdf,
    reportLabel
}) => {

    if (loading) {
        return (
            <Card className="mt-6 border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton width={200} height={24} />
                        <div className="flex gap-2">
                            <Skeleton width={100} height={36} />
                            <Skeleton width={100} height={36} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} width="100%" height={48} className="rounded-xl" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="mt-6 border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-12 flex flex-col items-center justify-center text-center">
                <EmptyState
                    message="No data available for this report."
                    description="Try adjusting your filters or selecting a different date range."
                    icon={FileText}
                />
            </Card>
        );
    }

    return (
        <Card className="mt-6 border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <FileText size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{reportLabel} Results</h3>
                </div>
                <div className="flex items-center gap-2">
                    {onPrint && (
                        <Button onClick={onPrint} variant="outline" size="sm" className="gap-2 bg-white dark:bg-gray-800">
                            <Printer size={16} />
                            Print
                        </Button>
                    )}
                    {onDownloadPdf && (
                        <Button onClick={onDownloadPdf} variant="outline" size="sm" className="gap-2 bg-white dark:bg-gray-800">
                            <Download size={16} />
                            Export PDF
                        </Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
                        <tr>
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    onClick={() => onSort(header)}
                                    className="px-6 py-4 text-left font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-primary transition-colors whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-1 group">
                                        {header}
                                        <span className={`text-gray-400 transition-opacity ${sortConfig?.key === header ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50'}`}>
                                            {sortConfig?.key === header && sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        <AnimatePresence mode="popLayout">
                            {data.map((row, index) => (
                                <motion.tr
                                    key={index}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {Array.isArray(row)
                                        ? row.map((cell, i) => (
                                            <td key={i} className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                                {cell}
                                            </td>
                                        ))
                                        : Object.values(row).map((cell: any, i) => (
                                            <td key={i} className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                                {String(cell)}
                                            </td>
                                        ))
                                    }
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
            )}
        </Card>
    );
};

export default ReportsTable;
