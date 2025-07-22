// @ts-nocheck
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Card from '../ui/Card';
import Button from '../ui/Button';

// Correctly import individual icons from lucide-react
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Frown from 'lucide-react/dist/esm/icons/frown';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import { toast } from 'react-hot-toast';

// Lazy load heavy components
const DashboardMetrics = lazy(() => import('./DashboardMetrics'));
const RevenueChart = lazy(() => import('./RevenueChart'));
const OrderStatusCard = lazy(() => import('./OrderStatusCard'));
const OrdersChart = lazy(() => import('./OrdersChart'));
const FinancialSummary = lazy(() => import('./summary/FinancialSummary'));
const ActivityLogFeed = lazy(() => import('./ActivityLogFeed'));

const SkeletonCard = ({ className = "" }) => <div className={`h-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className}`}></div>;

// --- Reusable Draggable Card Wrapper ---
const DraggableDashboardCard = ({ title, provided, isDragging, children }: any) => (
    <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1' : 'shadow-sm'}`}
    >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={20} />
            </div>
        </div>
        <div className="p-4 min-h-[100px]">
            <Suspense fallback={<div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>}>
                {children}
            </Suspense>
        </div>
    </div>
);

// --- Component configuration for Drag-and-Drop ---
const componentList = [
    { id: 'metrics', title: 'Overall Metrics', component: DashboardMetrics, gridClass: 'lg:col-span-3' },
    { id: 'financialSummary', title: 'Monthly Financial Summary', component: FinancialSummary, gridClass: 'lg:col-span-3' },
    { id: 'revenueChart', title: 'Monthly Revenue Trend', component: RevenueChart, gridClass: 'lg:col-span-2' },
    { id: 'ordersChart', title: 'Daily Orders (Last 7 Days)', component: OrdersChart, gridClass: 'lg:col-span-1' },
    { id: 'orderStatus', title: 'Pending Orders', component: OrderStatusCard, gridClass: 'lg:col-span-2' },
    { id: 'activityFeed', title: 'Recent Activity', component: ActivityLogFeed, gridClass: 'lg:col-span-1' },
];

const DEFAULT_ORDER = componentList.map(c => c.id);

const Dashboard: React.FC = () => {
    const { userProfile } = useUser();
    const [data, setData] = useState<any>(null); // Simplified data type for brevity
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

    const fetchDashboardData = useCallback(async (month: string) => {
        setLoading(true);
        setError(null);
        try {
            const previousMonthDate = new Date(month);
            previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
            const previousMonth = previousMonthDate.toISOString().slice(0, 7);
            
            const [
                pendingOrdersResponse,
                dailyOrdersResponse,
                currentMonthSummaryResponse,
                previousMonthSummaryResponse,
                revenueResponse,
                consolidatedMetricsResponse
            ] = await Promise.all([
                supabase.rpc('get_recent_pending_orders'),
                supabase.rpc('get_daily_order_counts', { days_to_check: 7 }),
                supabase.rpc('get_financial_summary', { p_month: month }),
                supabase.rpc('get_financial_summary', { p_month: previousMonth }),
                supabase.from('order_summary_with_dues').select('total_amount, date').gte('date', `${month}-01`),
                supabase.rpc('get_dashboard_metrics'),
            ]);

            const responses = [pendingOrdersResponse, dailyOrdersResponse, currentMonthSummaryResponse, previousMonthSummaryResponse, revenueResponse, consolidatedMetricsResponse];
            const firstError = responses.find(res => res.error);
            if (firstError?.error) throw firstError.error;

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
                consolidatedMetrics: consolidatedMetricsResponse.data?.[0] || null,
            });
        } catch (err: any) {
            console.error("Detailed error in fetchDashboardData:", err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    }, []);

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
            case 'metrics': return <DashboardMetrics metricsData={data.consolidatedMetrics} loading={loading} />;
            case 'financialSummary': return <FinancialSummary data={data.financialSummaryData} previousData={data.previousFinancialSummaryData} loading={loading} />;
            case 'revenueChart': return <div className="h-80"><RevenueChart data={data.revenueChartData} /></div>;
            case 'ordersChart': return <div className="h-80"><OrdersChart data={data.dailyOrdersChartData} /></div>;
            case 'activityFeed': return <ActivityLogFeed />;
            case 'orderStatus': return <OrderStatusCard orders={data.pendingOrders} loading={loading} onStatusUpdated={() => fetchDashboardData(currentMonth)} />;
            default: return null;
        }
    };

    if (error) {
      return <Card className="m-4 p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/30"><AlertTriangle className="mx-auto h-12 w-12" /><h3 className="mt-2 text-lg font-medium">Something went wrong</h3><p className="mt-1 text-sm whitespace-pre-line">{error}</p></Card>;
    }
    
    // Initial loading skeleton for the whole page
    if (loading && !data) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div></div>
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
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Welcome back, {userProfile?.name || 'Owner'}!</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="input bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-9 text-sm" />
                    </div>
                    <Button onClick={resetLayout} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" /> Reset</Button>
                </div>
            </div>

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
    );
};

export default Dashboard;
