import React, { useState, useEffect, Suspense, lazy } from 'react';
import { GripVertical, Bolt, Calendar, RefreshCw, AlertTriangle, FileText, Users, Package, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
const DashboardMetrics = lazy(() => import('./DashboardMetrics'));
const RevenueChart = lazy(() => import('./RevenueChart'));
import Modal from '../ui/Modal';
const OrderForm = lazy(() => import('../orders/OrderForm'));
const CustomerForm = lazy(() => import('../customers/CustomerForm'));
const PaymentForm = lazy(() => import('../payments/PaymentForm'));
const ProductForm = lazy(() => import('../products/ProductForm'));
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SkeletonCard from '../ui/SkeletonCard';
import FloatingActionButton from '../ui/FloatingActionButton';
const ReportDrilldownModal = lazy(() => import('./ReportDrilldownModal'));
const OrderStatusCard = lazy(() => import('./OrderStatusCard'));
const OrdersChart = lazy(() => import('./OrdersChart'));
const FinancialSummary = lazy(() => import('./summary/FinancialSummary'));
const ActivityLogFeed = lazy(() => import('./ActivityLogFeed'));
const DashboardIntelligence = lazy(() => import('./intelligence/DashboardIntelligence'));
import RealtimeStatus from '../ui/RealtimeStatus';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { DraggableProvided } from '@hello-pangea/dnd';

interface DraggableDashboardCardProps {
    title: string;
    children: React.ReactNode;
    provided: DraggableProvided;
    isDragging: boolean;
    showDragHandle?: boolean;
    noCardWrapper?: boolean; // New prop to skip Wrapper for custom components like Intelligence
}

const DraggableDashboardCard: React.FC<DraggableDashboardCardProps> = ({
    title,
    children,
    provided,
    isDragging,
    showDragHandle = true,
    noCardWrapper = false,
}) => {
    if (noCardWrapper) {
        return (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={`transition-all duration-500 transform ${isDragging ? 'opacity-80 scale-[1.01]' : ''}`}
            >
                {/* Drag handle wrapper for custom components */}
                <div className="relative group">
                    {showDragHandle && (
                        <div
                            {...provided.dragHandleProps}
                            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-background/80 hover:bg-muted/80 backdrop-blur cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-border/50 shadow-sm"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                    {children}
                </div>
            </div>
        );
    }

    return (
        <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`transition-all duration-500 transform ${isDragging
                ? 'shadow-2xl shadow-primary/30 scale-[1.02] rotate-1 ring-2 ring-primary/50'
                : 'shadow-lg hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-1'
                } bg-card/90 backdrop-blur-2xl border border-border/60 rounded-3xl overflow-hidden`}
        >
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-border/80 bg-gradient-to-r from-muted/50 via-card to-muted/50">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary to-primary/80" />
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                        {title}
                    </h3>
                </div>
                {showDragHandle ? (
                    <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-muted/80 transition-all duration-200 group border border-transparent hover:border-border/50"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                    </div>
                ) : null}
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-muted/10">
                {children}
            </div>
        </Card>
    );
};

const componentList = [
    { id: 'metrics', title: 'Key Metrics', gridClass: 'md:col-span-2 lg:col-span-3' },
    { id: 'intelligence', title: 'Business Intelligence', gridClass: 'md:col-span-2 lg:col-span-3', noCardWrapper: true },
    { id: 'financialSummary', title: 'Financial Summary', gridClass: 'md:col-span-2 lg:col-span-3' },
    { id: 'revenueChart', title: 'Revenue Over Time', gridClass: 'md:col-span-1 lg:col-span-2' },
    { id: 'ordersChart', title: 'Recent Orders', gridClass: 'md:col-span-1 lg:col-span-1' },
    { id: 'orderStatus', title: 'Pending Orders', gridClass: 'md:col-span-2 lg:col-span-3' },
    { id: 'activityFeed', title: 'Activity Feed', gridClass: 'md:col-span-2 lg:col-span-3' },
];

const DEFAULT_ORDER = ['metrics', 'intelligence', 'financialSummary', 'revenueChart', 'ordersChart', 'orderStatus', 'activityFeed'];

const Dashboard: React.FC = () => {
    const { userProfile } = useUser();
    const isMobile = useIsMobile();
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [componentOrder, setComponentOrder] = useState<string[]>(() => {
        try {
            const savedOrder = localStorage.getItem('dashboardOrder');
            if (savedOrder) {
                const parsedOrder = JSON.parse(savedOrder);
                // Check if any new components are missing from the saved order
                const missingComponents = DEFAULT_ORDER.filter(id => !parsedOrder.includes(id));
                if (missingComponents.length > 0) {
                    // Add missing components to the top/beginning like in DEFAULT_ORDER or append
                    // Let's insert them at their default index if possible, or just merge
                    // Simple merge: [...parsedOrder, ...missingComponents] puts them at end.
                    // Better: Re-sync with default logic.
                    // We'll append missing ones to the second position (after metrics) or just reset behavior?
                    // Let's just append for safety, or insert 'intelligence' specifically at index 1 if missing.

                    // Specific fix for intelligence: insert at index 1 if missing
                    if (missingComponents.includes('intelligence')) {
                        const newOrder = [...parsedOrder];
                        newOrder.splice(1, 0, 'intelligence');
                        return newOrder;
                    }
                    return [...parsedOrder, ...missingComponents];
                }
                return parsedOrder;
            }
            return DEFAULT_ORDER;
        } catch {
            return DEFAULT_ORDER;
        }
    });

    // React Query Hook
    const {
        data,
        isLoading: loading,
        error: queryError,
        refetch: refreshDashboard
    } = useDashboardData(userProfile?.id, currentMonth);

    // Map error to string if possible, or null
    const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [drilldownOpen, setDrilldownOpen] = useState(false);
    const [drilldownType, setDrilldownType] = useState<string | null>(null);
    const [drilldownFilters, setDrilldownFilters] = useState<Record<string, unknown> | null>(null);

    // Set up realtime order updates
    useRealtimeOrders((update) => {
        console.log('📦 Order status updated in dashboard:', update);
        // Refresh dashboard data when orders are updated
        refreshDashboard();
    });

    // Set up realtime payment updates
    useRealtimePayments((payment) => {
        console.log('💰 Payment received in dashboard:', payment);
        // Refresh dashboard data when payments are received
        refreshDashboard();
    });

    const handleMetricDrilldown = (type: string, filters?: Record<string, unknown>) => {
        setDrilldownType(type);
        setDrilldownFilters(filters || null);
        setDrilldownOpen(true);
    };

    useEffect(() => {
        localStorage.setItem('dashboardOrder', JSON.stringify(componentOrder));
    }, [componentOrder]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }
        const newOrder = Array.from(componentOrder);
        const [reorderedItem] = newOrder.splice(source.index, 1);
        newOrder.splice(destination.index, 0, reorderedItem);
        setComponentOrder(newOrder);
    };

    const resetLayout = () => {
        setComponentOrder(DEFAULT_ORDER);
        localStorage.removeItem('dashboardOrder');
        toast.success("Dashboard layout has been reset!");
    };

    const renderComponent = (id: string) => {
        if (!data) return null;
        switch (id) {
            case 'metrics': {
                return (
                    <DashboardMetrics
                        metricsData={data.consolidatedMetrics}
                        loading={loading}
                        onDrilldown={handleMetricDrilldown}
                    />
                );
            }
            case 'intelligence': {
                return (
                    <div className="h-full">
                        <DashboardIntelligence />
                    </div>
                );
            }
            case 'financialSummary': {
                return <FinancialSummary data={data.financialSummaryData} previousData={data.previousFinancialSummaryData} loading={loading} />;
            }
            case 'revenueChart': {
                return <div className="h-80"><RevenueChart data={data.revenueChartData} /></div>;
            }
            case 'ordersChart': {
                return <div className="h-80"><OrdersChart data={data.dailyOrdersChartData} /></div>;
            }
            case 'activityFeed': {
                return <ActivityLogFeed />;
            }
            case 'orderStatus': {
                return <OrderStatusCard orders={data.pendingOrders} loading={loading} error={error} onStatusUpdated={() => refreshDashboard()} />;
            }
            default: {
                return null;
            }
        }
    };

    interface ProductData {
        name: string;
        category?: string;
        description?: string;
        unit_price: number;
    }

    const handleProductSave = async (productData: ProductData) => {
        try {
            const { error } = await supabase.from('products').insert([productData]);
            if (error) throw error;
            toast.success('Product added successfully');
            setIsProductModalOpen(false);
            refreshDashboard();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950 flex items-center justify-center p-6">
                <Card className="max-w-md p-8 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-red-200/50 dark:border-red-800/50 shadow-xl">
                    <AlertTriangle className="mx-auto h-16 w-16 text-red-500 dark:text-red-400 mb-4" />
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Something went wrong</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line leading-relaxed">{error}</p>
                </Card>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950">
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center max-w-5xl mx-auto">
                        <div className="h-12 bg-gradient-to-r from-blue-200 to-emerald-200 dark:from-blue-800 dark:to-emerald-800 rounded-2xl w-1/3 animate-pulse"></div>
                        <div className="h-12 bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-800 dark:to-blue-800 rounded-2xl w-40 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
                        <SkeletonCard variant="metric" className="md:col-span-2 lg:col-span-3" />
                        <SkeletonCard variant="table" className="md:col-span-2 lg:col-span-3" />
                        <SkeletonCard variant="chart" className="md:col-span-1 lg:col-span-2" />
                        <SkeletonCard variant="chart" className="md:col-span-1 lg:col-span-1" />
                        <SkeletonCard variant="table" className="md:col-span-2 lg:col-span-3" />
                        <SkeletonCard variant="default" className="md:col-span-2 lg:col-span-3" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Suspense fallback={null}>
                {drilldownOpen && drilldownType && (
                    <ReportDrilldownModal
                        isOpen={drilldownOpen}
                        onClose={() => setDrilldownOpen(false)}
                        reportType={drilldownType}
                        filters={drilldownFilters || undefined}
                    />
                )}
            </Suspense>
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
                {/* Decorative background elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />
                </div>

                <div className="relative p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
                    {/* Quick Actions Glassmorphism Box */}
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-wrap justify-center items-center gap-3 p-4 md:p-5 rounded-2xl border border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl shadow-primary/5">
                            <div className="flex items-center gap-2 mr-2 md:mr-4">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
                                    <Bolt className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <span className="font-display font-bold text-foreground text-sm md:text-base">Quick Actions</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button onClick={() => setIsOrderModalOpen(true)} variant="primary" size="sm" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                                    + Add Order
                                </Button>
                                <Button onClick={() => setIsCustomerModalOpen(true)} variant="secondary" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    + Add Customer
                                </Button>
                                <Button onClick={() => setIsPaymentModalOpen(true)} variant="secondary" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    + Add Payment
                                </Button>
                                <Button onClick={() => setIsProductModalOpen(true)} variant="secondary" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    + Add Product
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Title and Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-7xl mx-auto">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-lg shadow-primary/30">
                                    <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tight">
                                    Dashboard
                                </h1>
                            </div>
                            <p className="text-muted-foreground font-sans font-medium pl-14">Welcome back, <span className="text-primary">{userProfile?.name || 'Owner'}</span>! ✨</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <RealtimeStatus />
                            <div className="relative flex-1 sm:flex-none">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('month-picker') as HTMLInputElement;
                                        if (input) {
                                            input.showPicker?.();
                                            input.focus();
                                        }
                                    }}
                                    className="absolute top-1/2 left-3.5 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform"
                                >
                                    <Calendar className="w-4 h-4 text-primary" />
                                </button>
                                <input
                                    id="month-picker"
                                    type="month"
                                    value={currentMonth}
                                    onChange={(e) => setCurrentMonth(e.target.value)}
                                    className="w-full sm:w-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-border/60 rounded-xl py-2.5 px-4 pl-10 text-sm font-medium shadow-lg shadow-muted/5 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 cursor-pointer"
                                />
                            </div>
                            <Button
                                onClick={resetLayout}
                                variant="outline"
                                size="sm"
                                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-gray-200/60 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-900 shadow-lg shadow-gray-500/5 transition-all duration-200 whitespace-nowrap"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" /> Reset
                            </Button>
                        </div>
                    </div>
                    {/* Add Order Modal */}
                    <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Add New Order" size="2xl">
                        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                            <OrderForm onSuccess={() => { setIsOrderModalOpen(false); refreshDashboard(); }} />
                        </Suspense>
                    </Modal>
                    {/* Add Customer Modal */}
                    <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add New Customer" size="lg">
                        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                            <CustomerForm
                                selectedCustomer={null}
                                onSave={() => { setIsCustomerModalOpen(false); refreshDashboard(); }}
                                onCancel={() => setIsCustomerModalOpen(false)}
                            />
                        </Suspense>
                    </Modal>
                    {/* Add Payment Modal */}
                    <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment" size="lg">
                        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                            <PaymentForm onSuccess={() => { setIsPaymentModalOpen(false); refreshDashboard(); }} />
                        </Suspense>
                    </Modal>
                    {/* Add Product Modal */}
                    <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add Product" size="lg">
                        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                            <ProductForm
                                editingProduct={null}
                                isLoading={loading}
                                onSave={handleProductSave}
                                onCancel={() => setIsProductModalOpen(false)}
                            />
                        </Suspense>
                    </Modal>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="dashboard">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                                    {componentOrder.map((id, index) => {
                                        const componentInfo = componentList.find(c => c.id === id);
                                        if (!componentInfo) return null;
                                        return (
                                            <Draggable key={id} draggableId={id} index={index} isDragDisabled={isMobile}>
                                                {(provided, snapshot) => (
                                                    <div className={`${componentInfo.gridClass}`}>
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{
                                                                duration: 0.5,
                                                                delay: index * 0.08,
                                                                type: "spring",
                                                                stiffness: 120,
                                                                damping: 20
                                                            }}
                                                        >
                                                            <DraggableDashboardCard
                                                                title={componentInfo.title}
                                                                provided={provided}
                                                                isDragging={snapshot.isDragging}
                                                                showDragHandle={!isMobile}
                                                                noCardWrapper={componentInfo.noCardWrapper}
                                                            >
                                                                {renderComponent(id)}
                                                            </DraggableDashboardCard>
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                {/* Floating Action Button for Quick Actions */}
                <FloatingActionButton
                    actions={[
                        {
                            id: 'add-order',
                            label: 'Add Order',
                            icon: <FileText size={20} />,
                            onClick: () => setIsOrderModalOpen(true),
                            color: 'bg-blue-500 hover:bg-blue-600'
                        },
                        {
                            id: 'add-customer',
                            label: 'Add Customer',
                            icon: <Users size={20} />,
                            onClick: () => setIsCustomerModalOpen(true),
                            color: 'bg-green-500 hover:bg-green-600'
                        },
                        {
                            id: 'add-payment',
                            label: 'Add Payment',
                            icon: <CreditCard size={20} />,
                            onClick: () => setIsPaymentModalOpen(true),
                            color: 'bg-purple-500 hover:bg-purple-600'
                        },
                        {
                            id: 'add-product',
                            label: 'Add Product',
                            icon: <Package size={20} />,
                            onClick: () => setIsProductModalOpen(true),
                            color: 'bg-orange-500 hover:bg-orange-600'
                        }
                    ]}
                    position="bottom-right"
                />
            </div>
        </>
    );
};

export default Dashboard;
