// @ts-nocheck
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { GripVertical, Bolt, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
const DashboardMetrics = lazy(() => import('./DashboardMetrics'));
const RevenueChart = lazy(() => import('./RevenueChart'));
import Modal from '../ui/Modal';
const OrderForm = lazy(() => import('../orders/OrderForm'));
const CustomerForm = lazy(() => import('../customers/CustomerForm'));
const PaymentForm = lazy(() => import('../payments/PaymentForm'));
const ProductForm = lazy(() => import('../products/ProductForm'));
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Card from '../ui/Card';
import Button from '../ui/Button';
const ReportDrilldownModal = lazy(() => import('./ReportDrilldownModal'));
const OrderStatusCard = lazy(() => import('./OrderStatusCard'));
const OrdersChart = lazy(() => import('./OrdersChart'));
const FinancialSummary = lazy(() => import('./summary/FinancialSummary'));
const ActivityLogFeed = lazy(() => import('./ActivityLogFeed'));
import RealtimeStatus from '../ui/RealtimeStatus';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';

const SkeletonCard = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`} />
);

const DraggableDashboardCard = ({ title, children, provided, isDragging }) => (
    <Card ref={provided.innerRef} {...provided.draggableProps} className={`transition-shadow duration-200 ${isDragging ? 'shadow-2xl' : 'shadow-md'}`}>
        <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">{title}</h3>
            <div {...provided.dragHandleProps} className="cursor-grab p-2">
                <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
        </div>
        <div className="p-4">
            {children}
        </div>
    </Card>
);

const componentList = [
    { id: 'metrics', title: 'Key Metrics', gridClass: 'lg:col-span-3' },
    { id: 'financialSummary', title: 'Financial Summary', gridClass: 'lg:col-span-3' },
    { id: 'revenueChart', title: 'Revenue Over Time', gridClass: 'lg:col-span-2' },
    { id: 'ordersChart', title: 'Recent Orders', gridClass: 'lg:col-span-1' },
    { id: 'orderStatus', title: 'Pending Orders', gridClass: 'lg:col-span-3' },
    { id: 'activityFeed', title: 'Activity Feed', gridClass: 'lg:col-span-3' },
];

const DEFAULT_ORDER = ['metrics', 'financialSummary', 'revenueChart', 'ordersChart', 'orderStatus', 'activityFeed'];

const Dashboard: React.FC = () => {
    const { userProfile } = useUser();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [componentOrder, setComponentOrder] = useState<string[]>(() => {
        try {
            const savedOrder = localStorage.getItem('dashboardOrder');
            return savedOrder ? JSON.parse(savedOrder) : DEFAULT_ORDER;
        } catch {
            return DEFAULT_ORDER;
        }
    });
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [drilldownOpen, setDrilldownOpen] = useState(false);
    const [drilldownType, setDrilldownType] = useState<string | null>(null);
    const [drilldownFilters, setDrilldownFilters] = useState<any>(null);

    // Real-time hooks
    const { metrics: realtimeMetrics, refreshMetrics } = useRealtimeDashboard();
    
    // Set up realtime order updates
    useRealtimeOrders((update) => {
        console.log('📦 Order status updated in dashboard:', update);
        // Refresh dashboard data when orders are updated
        fetchDashboardData(currentMonth);
    });

    // Set up realtime payment updates
    useRealtimePayments((payment) => {
        console.log('💰 Payment received in dashboard:', payment);
        // Refresh dashboard data when payments are received
        fetchDashboardData(currentMonth);
    });

    const handleMetricDrilldown = (type: string, filters?: any) => {
        setDrilldownType(type);
        setDrilldownFilters(filters || null);
        setDrilldownOpen(true);
    };

    const fetchDashboardData = useCallback(async (month: string) => {
        setLoading(true);
        setError(null);
        try {
            const previousMonthDate = new Date(month);
            previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
            const previousMonth = previousMonthDate.toISOString().slice(0, 7);
            if (!userProfile?.id) throw new Error('User ID not found in userProfile');
            const [pendingOrdersResponse, dailyOrdersResponse, currentMonthSummaryResponse, previousMonthSummaryResponse, revenueResponse, consolidatedMetricsResponse] = await Promise.all([
                supabase.rpc('get_recent_pending_orders').then(res => {
                    if (res.error) handleSupabaseError(res.error, { operation: 'rpc_call', table: 'get_recent_pending_orders' });
                    return res;
                }),
                supabase.rpc('get_daily_order_counts', { days_to_check: 7 }).then(res => {
                    if (res.error) handleSupabaseError(res.error, { operation: 'rpc_call', table: 'get_daily_order_counts' });
                    return res;
                }),
                supabase.rpc('get_financial_summary', { p_month: month }).then(res => {
                    if (res.error) handleSupabaseError(res.error, { operation: 'rpc_call', table: 'get_financial_summary' });
                    return res;
                }),
                supabase.rpc('get_financial_summary', { p_month: previousMonth }).then(res => {
                    if (res.error) handleSupabaseError(res.error, { operation: 'rpc_call', table: 'get_financial_summary' });
                    return res;
                }),
                supabase.from('order_summary_with_dues').select('total_amount, date').gte('date', `${month}-01`),
                supabase.rpc('get_dashboard_metrics', { p_user_id: userProfile?.id }).then(res => {
                    if (res.error) handleSupabaseError(res.error, { operation: 'rpc_call', table: 'get_dashboard_metrics' });
                    return res;
                }),
            ]);
            const responses = [pendingOrdersResponse, dailyOrdersResponse, currentMonthSummaryResponse, previousMonthSummaryResponse, revenueResponse, consolidatedMetricsResponse];
            const firstError = responses.find(res => res.error);
            if (firstError?.error) {
                console.warn('Dashboard RPC function not available:', firstError.error.message);
                // Use fallback data instead of throwing
            }
            const revenueByDate = (revenueResponse.data || []).reduce((acc, order) => {
                const date = new Date(order.date).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + (order.total_amount || 0);
                return acc;
            }, {});
            setData({
                dailyOrdersChartData: dailyOrdersResponse.data || [],
                pendingOrders: pendingOrdersResponse.data || [],
                financialSummaryData: currentMonthSummaryResponse.data?.[0] || null,
                previousFinancialSummaryData: previousMonthSummaryResponse.data?.[0] || null,
                revenueChartData: Object.entries(revenueByDate).map(([date, value]) => ({ date, value })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                consolidatedMetrics: consolidatedMetricsResponse.data || null,
            });
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchDashboardData(currentMonth);
    }, [currentMonth, fetchDashboardData]);

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
                return <OrderStatusCard orders={data.pendingOrders} loading={loading} error={error} onStatusUpdated={() => fetchDashboardData(currentMonth)} />;
            }
            default: {
                return null;
            }
        }
    };

    if (error) {
        return (
            <Card className="m-4 p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/30">
                <AlertTriangle className="mx-auto h-12 w-12" />
                <h3 className="mt-2 text-lg font-medium">Something went wrong</h3>
                <p className="mt-1 text-sm whitespace-pre-line">{error}</p>
            </Card>
        );
    }

    if (loading && !data) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SkeletonCard className="lg:col-span-3 h-28" />
                    <SkeletonCard className="lg:col-span-3 h-40" />
                    <SkeletonCard className="lg:col-span-2 h-80" />
                    <SkeletonCard className="lg:col-span-1 h-80" />
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
            <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
                {/* Quick Actions Subtle Box */}
                <div className="max-w-3xl mx-auto -mt-4 mb-6">
                    <div className="flex flex-wrap justify-center items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
                        <Bolt className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-1" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200 mr-3 text-base">Quick Actions</span>
                        <Button onClick={() => setIsOrderModalOpen(true)} variant="primary" size="sm">
                            + Add Order
                        </Button>
                        <Button onClick={() => setIsCustomerModalOpen(true)} variant="secondary" size="sm">
                            + Add Customer
                        </Button>
                        <Button onClick={() => setIsPaymentModalOpen(true)} variant="secondary" size="sm">
                            + Add Payment
                        </Button>
                        <Button onClick={() => setIsProductModalOpen(true)} variant="secondary" size="sm">
                            + Add Product
                        </Button>
                    </div>
                </div>
                {/* Dashboard Title and Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-5xl mx-auto">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Welcome back, {userProfile?.name || 'Owner'}!</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <RealtimeStatus />
                        <div className="relative">
                            <Calendar className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                            <input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="input bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-9 text-sm" />
                        </div>
                        <Button onClick={resetLayout} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" /> Reset</Button>
                    </div>
                </div>
                {/* Add Order Modal */}
                <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Add New Order" size="2xl">
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                        <OrderForm onSuccess={() => { setIsOrderModalOpen(false); fetchDashboardData(currentMonth); }} />
                    </Suspense>
                </Modal>
                {/* Add Customer Modal */}
                <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add New Customer" size="lg">
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                        <CustomerForm />
                    </Suspense>
                </Modal>
                {/* Add Payment Modal */}
                <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment" size="lg">
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                        <PaymentForm onSuccess={() => { setIsPaymentModalOpen(false); fetchDashboardData(currentMonth); }} />
                    </Suspense>
                </Modal>
                {/* Add Product Modal */}
                <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add Product" size="lg">
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                        <ProductForm />
                    </Suspense>
                </Modal>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="dashboard">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {componentOrder.map((id, index) => {
                                    const componentInfo = componentList.find(c => c.id === id);
                                    if (!componentInfo) return null;
                                    return (
                                        <Draggable key={id} draggableId={id} index={index}>
                                            {(provided, snapshot) => (
                                                <div className={`${componentInfo.gridClass}`}>
                                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }}>
                                                        <DraggableDashboardCard title={componentInfo.title} provided={provided} isDragging={snapshot.isDragging}>
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
        </>
    );
};

export default Dashboard;
