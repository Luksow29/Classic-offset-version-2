// @ts-nocheck
// src/components/due/DueSummary.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import Card from '../ui/Card';
import DueCard from './DueCard';
import Button from '../ui/Button';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2, AlertTriangle, PartyPopper, Banknote, Users,
  Package, Printer, Search, Filter, TrendingUp, Send, Share2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export interface DueOrder {
  order_id: number;
  customer_name: string;
  balance_due: number;
  date: string | null;
  amount_paid?: number;
  total_amount?: number;
  order_type?: string;
  delivery_date?: string;
}

const DueSummary: React.FC = () => {
  const [dueOrders, setDueOrders] = useState<DueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState<number>(0);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Due Report',
    pageStyle: `@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }`,
  });

  useEffect(() => {
    const fetchDueOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: viewError } = await supabase
          .from('order_summary_with_dues')
          .select('*')
          .gt('balance_due', 0)
          .order('customer_name', { ascending: true });

        if (viewError) throw viewError;
        setDueOrders(data || []);
      } catch (err: any) {
        console.error('❌ Error fetching due orders:', err);
        setError(`Failed to load due summary. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDueOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return dueOrders.filter(order =>
      (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.order_id).includes(searchTerm)) &&
      (order.balance_due || 0) >= minAmount
    );
  }, [dueOrders, searchTerm, minAmount]);

  const groupedByCustomer = useMemo(() => {
    const grouped: Record<string, DueOrder[]> = {};
    filteredOrders.forEach((order) => {
      const customerName = order.customer_name || 'Unknown Customer';
      if (!grouped[customerName]) {
        grouped[customerName] = [];
      }
      grouped[customerName].push(order);
    });
    return grouped;
  }, [filteredOrders]);

  const summaryStats = useMemo(() => {
    const totalDueOverall = filteredOrders.reduce((sum, order) => sum + (order.balance_due || 0), 0);
    const totalPendingOrders = filteredOrders.length;
    const totalCustomersWithDues = Object.keys(groupedByCustomer).length;

    // Sort customers by total due for chart
    const customerDues = Object.entries(groupedByCustomer).map(([name, orders]) => ({
      name: name.split(' ')[0], // Short name for chart
      fullName: name,
      value: orders.reduce((sum, o) => sum + (o.balance_due || 0), 0)
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

    return { totalDueOverall, totalPendingOrders, totalCustomersWithDues, customerDues };
  }, [filteredOrders, groupedByCustomer]);

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-6">
      {/* Header & Actions - Compact on Mobile */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Banknote className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Due Summary</h1>
            <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">Track pending payments and outstanding balances.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 no-print">
          <Button variant="outline" onClick={() => window.location.reload()} size="sm" className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2">
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2" size="sm">
            <Printer className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview - Compact on Mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        <Card className="p-2 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-l-rose-500 bg-gradient-to-br from-card to-rose-500/5 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase">Outstanding</p>
              <h3 className="text-sm sm:text-xl lg:text-3xl font-bold text-foreground mt-0.5 sm:mt-2">₹{(summaryStats.totalDueOverall / 1000).toFixed(0)}k</h3>
            </div>
            <div className="p-1.5 sm:p-3 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600">
              <Banknote size={14} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-amber-500/5 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase">Customers</p>
              <h3 className="text-sm sm:text-xl lg:text-3xl font-bold text-foreground mt-0.5 sm:mt-2">{summaryStats.totalCustomersWithDues}</h3>
            </div>
            <div className="p-1.5 sm:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
              <Users size={14} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-500/5 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase">Orders</p>
              <h3 className="text-sm sm:text-xl lg:text-3xl font-bold text-foreground mt-0.5 sm:mt-2">{summaryStats.totalPendingOrders}</h3>
            </div>
            <div className="p-1.5 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Package size={14} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6 no-print">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Filter size={18} /> Filters</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Customer / Order ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Due Amount: ₹{minAmount}</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹0</span>
                  <span>₹50k+</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Debtors Chart */}
          <Card className="p-6 h-[300px] no-print">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><TrendingUp size={18} /> Top Due Amounts</h3>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryStats.customerDues} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px', border: '1px solid var(--border)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Due']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {summaryStats.customerDues.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Due Lists */}
        <div className="lg:col-span-2" ref={printRef}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading due summary...</p>
            </div>
          ) : error ? (
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </Card>
          ) : summaryStats.totalCustomersWithDues === 0 ? (
            <Card className="p-12 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100">
              <PartyPopper className="w-16 h-16 mx-auto mb-4 text-emerald-500 animate-bounce" />
              <p className="font-bold text-2xl text-emerald-700 dark:text-emerald-300">All Clear!</p>
              <p className="text-emerald-600 dark:text-emerald-400 mt-2">There are no outstanding dues pending.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header for list */}
              <div className="flex items-center justify-between pb-2 border-b border-border mb-4">
                <h2 className="text-lg font-semibold">Customer Breakdown</h2>
                <span className="text-sm text-muted-foreground">Showing {Object.keys(groupedByCustomer).length} customers</span>
              </div>

              {Object.entries(groupedByCustomer).map(([customer, orders]) => (
                <DueCard key={customer} customer={customer} orders={orders} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DueSummary;
