// @ts-nocheck
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { GripVertical, Bolt, Calendar, RefreshCw, AlertTriangle, FileText, Users, Package, CreditCard } from 'lucide-react';
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
import SkeletonCard from '../ui/SkeletonCard';
import FloatingActionButton from '../ui/FloatingActionButton';
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

const DraggableDashboardCard = ({ title, children, provided, isDragging }) => (
    <Card 
        ref={provided.innerRef} 
        {...provided.draggableProps} 
        className={`transition-all duration-300 transform hover:scale-[1.02] ${
            isDragging 
                ? 'shadow-2xl shadow-blue-500/25 scale-105 rotate-1' 
                : 'shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20'
        } bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden`}
    >
        <div className="flex justify-between items-center p-6 border-b border-gray-100/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-950/50 dark:to-emerald-950/50">
            <h3 className="font-display font-bold text-lg bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-200 dark:to-blue-400 bg-clip-text text-transparent">
                {title}
            </h3>
            <div 
                {...provided.dragHandleProps} 
                className="cursor-grab p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors duration-200 group"
            >
                <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
            </div>
        </div>
        <div className="p-6">
            {children}
        </div>
    </Card>
);

const componentList = [
    { id: 'metrics', title: 'Key Metrics', gridClass: 'md:col-span-2 lg:col-span-3' },
    { id: 'financialSummary', title: 'Financial Summary', gridClass: 'md:col-span-2 lg:col-span-3' },
    { id: 'revenueChart', title: 'Revenue Over Time', gridClass: 'md:col-span-1 lg:col-span-2' },
    { id: 'ordersChart', title: 'Recent Orders', gridClass: 'md:col-span-1 lg:col-span-1' },
    { id: 'orderStatus', title: 'Pending Orders', gridClass: 'md:col-span-2 lg:col-span-3' },
    { id: 'activityFeed', title: 'Activity Feed', gridClass: 'md:col-span-2 lg:col-span-3' },
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
                supabase.rpc('get_recent_pending_orders'),
                supabase.rpc('get_daily_order_counts', { days_to_check: 7 }),
                supabase.rpc('get_financial_summary', { p_user_id: userProfile.id, p_month: month }),
                supabase.rpc('get_financial_summary', { p_user_id: userProfile.id, p_month: previousMonth }),
                supabase.from('orders').select('amount_received, date').gte('date', `${month}-01`).eq('is_deleted', false),
                supabase.rpc('get_dashboard_metrics_table'),
            ]);
            const responses = [pendingOrdersResponse, dailyOrdersResponse, currentMonthSummaryResponse, previousMonthSummaryResponse, revenueResponse, consolidatedMetricsResponse];
            const firstError = responses.find(res => res.error);
            if (firstError?.error) throw firstError.error;
            
            // Debug: Log the metrics response
            console.log('Dashboard Metrics Response:', consolidatedMetricsResponse);
            console.log('Dashboard Metrics Data:', consolidatedMetricsResponse.data);
            
            const revenueByDate = (revenueResponse.data || []).reduce((acc, order) => {
                const date = new Date(order.date).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + (order.amount_received || 0);
                return acc;
            }, {});
            setData({
                dailyOrdersChartData: dailyOrdersResponse.data || [],
                pendingOrders: pendingOrdersResponse.data || [],
                financialSummaryData: currentMonthSummaryResponse.data?.[0] || null,
                previousFinancialSummaryData: previousMonthSummaryResponse.data?.[0] || null,
                revenueChartData: Object.entries(revenueByDate).map(([date, value]) => ({ date, value })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                consolidatedMetrics: consolidatedMetricsResponse.data?.[0] || null,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    }, [userProfile?.id]);

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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950">
                <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Quick Actions Glassmorphism Box */}
                    <div className="max-w-3xl mx-auto -mt-2 md:-mt-4 mb-4 md:mb-6">
                        <div className="flex flex-wrap justify-center items-center gap-2 p-3 md:p-4 rounded-2xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg shadow-blue-500/10 dark:shadow-purple-500/20">
                            <Bolt className="w-4 h-4 md:w-5 md:h-5 text-blue-500 dark:text-blue-400 mr-1" />
                            <span className="font-display font-semibold text-gray-700 dark:text-gray-200 mr-2 md:mr-3 text-sm md:text-base bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tracking-wide">Quick Actions</span>
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
                        <div className="space-y-2">
                            <h1 className="text-4xl font-display font-black bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-800 dark:from-white dark:via-blue-300 dark:to-emerald-300 bg-clip-text text-transparent tracking-tight">
                                Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 font-sans font-medium tracking-wide">Welcome back, {userProfile?.name || 'Owner'}! ✨</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            <RealtimeStatus />
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 absolute top-1/2 left-3 -translate-y-1/2" />
                                <input 
                                    type="month" 
                                    value={currentMonth} 
                                    onChange={(e) => setCurrentMonth(e.target.value)} 
                                    className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl p-3 pl-10 text-sm font-medium shadow-lg focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" 
                                />
                            </div>
                            <Button 
                                onClick={resetLayout} 
                                variant="outline" 
                                size="sm"
                                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/90 dark:hover:bg-gray-900/90 shadow-lg transition-all duration-200"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" /> Reset
                            </Button>
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
                            <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                                {componentOrder.map((id, index) => {
                                    const componentInfo = componentList.find(c => c.id === id);
                                    if (!componentInfo) return null;
                                    return (
                                        <Draggable key={id} draggableId={id} index={index}>
                                            {(provided, snapshot) => (
                                                <div className={`${componentInfo.gridClass}`}>
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                        transition={{ 
                                                            duration: 0.6, 
                                                            delay: index * 0.1,
                                                            type: "spring",
                                                            stiffness: 100
                                                        }}
                                                    >
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
