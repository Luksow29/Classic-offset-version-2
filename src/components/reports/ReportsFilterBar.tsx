// src/components/reports/ReportsFilterBar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Calendar, Filter, Download, Printer } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface ReportsFilterBarProps {
    reportType: string;
    filters: any;
    loading: boolean;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onClearFilters: () => void;
    onGenerate: () => void;
    reportOptions: { value: string; label: string }[];
    onReportTypeChange: (value: string) => void;
}

const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
    reportType,
    filters,
    loading,
    onFilterChange,
    onClearFilters,
    onGenerate,
    reportOptions,
    onReportTypeChange,
}) => {
    const renderSpecificFilters = () => {
        switch (reportType) {
            case 'invoice_report':
                return (
                    <>
                        <>
                            <div className="col-span-1 md:col-span-2">
                                <Input id="searchTerm" label="Customer Name" value={filters.searchTerm} onChange={onFilterChange} placeholder="Search name..." />
                            </div>
                            <Input id="orderId" label="Order Number" type="number" value={filters.orderId} onChange={onFilterChange} placeholder="Search ID..." />
                        </>
                    </>
                );
            case 'orders_list':
                return (
                    <Input as="select" id="orderStatus" label="Order Status" value={filters.orderStatus} onChange={onFilterChange}>
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Design">Design</option>
                        <option value="Printing">Printing</option>
                        <option value="Delivered">Delivered</option>
                    </Input>
                );
            case 'customers_list':
                return (
                    <>
                        <Input id="customerName" label="Customer Name" value={filters.customerName} onChange={onFilterChange} placeholder="Search by name..." />
                        <Input id="customerPhone" label="Phone" value={filters.customerPhone} onChange={onFilterChange} placeholder="Search phone..." />
                        <Input id="customerTag" label="Tag" value={filters.customerTag} onChange={onFilterChange} placeholder="VIP, etc." />
                    </>
                );
            case 'payment_details':
                return (
                    <>
                        <Input id="customerName" label="Customer Name" value={filters.customerName} onChange={onFilterChange} placeholder="Search name..." />
                        <Input as="select" id="paymentMethod" label="Method" value={filters.paymentMethod} onChange={onFilterChange}>
                            <option value="">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Check">Check</option>
                        </Input>
                        <Input as="select" id="paymentStatus" label="Status" value={filters.paymentStatus} onChange={onFilterChange}>
                            <option value="">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Due">Due</option>
                            <option value="Overdue">Overdue</option>
                        </Input>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="mb-6 overflow-hidden border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Filter size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Report Filters</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            as="select"
                            value={reportType}
                            onChange={(e) => onReportTypeChange(e.target.value)}
                            className="min-w-[200px] border-primary/20 focus:border-primary font-medium"
                        >
                            {reportOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Input>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end"
                >
                    {/* Common Date Filters */}
                    {(reportType !== 'customer_list' && reportType !== 'due_summary') && ( // due summary usually doesn't need date range unless specific
                        <>
                            <Input
                                id="startDate"
                                label="From Date"
                                type="date"
                                value={filters.startDate || ''}
                                onChange={onFilterChange}
                                icon={<Calendar size={18} />}
                            />
                            <Input
                                id="endDate"
                                label="To Date"
                                type="date"
                                value={filters.endDate || ''}
                                onChange={onFilterChange}
                                icon={<Calendar size={18} />}
                            />
                        </>
                    )}

                    {renderSpecificFilters()}

                    <div className="flex items-center gap-2 md:col-span-1 lg:col-span-1 min-w-[140px]">
                        <Button
                            onClick={onGenerate}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Search size={16} className="mr-2" />
                                    {reportType === 'invoice_report' ? 'Search' : 'Generate'}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onClearFilters}
                            variant="ghost"
                            className="px-3 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                            title="Clear Filters"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </Card>
    );
};

export default ReportsFilterBar;
