// @ts-nocheck
// src/components/due/DueSummary.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import Card from '../ui/Card';
import DueCard from './DueCard';
// import PrintButton from '../shared/PrintButton'; // REMOVED: This file does not exist
import Button from '../ui/Button'; // ADDED: Using the standard Button component
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertTriangle, PartyPopper, Banknote, Users, Package, Printer } from 'lucide-react'; // ADDED: Printer icon

// Define the interface for the data that will be returned from the View
export interface DueOrder {
  order_id: number;
  customer_name: string;
  balance_due: number;
  date: string | null;
  amount_paid?: number;
  total_amount?: number;
  // You can add other fields like order_type, delivery_date if they exist in the view and you need them in DueCard
  order_type?: string;
  delivery_date?: string;
}

const DueSummary: React.FC = () => {
  const [dueOrders, setDueOrders] = useState<DueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Due Summary Report',
    pageStyle: `@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }`,
  });

  useEffect(() => {
    const fetchDueOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: viewError } = await supabase
          .from('order_summary_with_dues') // The name of the View
          .select('*') // Get all columns from the View
          .gt('balance_due', 0) // Only get orders with a balance greater than 0
          .order('customer_name', { ascending: true }); // Order by customer name

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

  const groupedByCustomer = useMemo(() => {
    const grouped: Record<string, DueOrder[]> = {};
    dueOrders.forEach((order) => {
      const customerName = order.customer_name || 'Unknown Customer';
      if (!grouped[customerName]) {
        grouped[customerName] = [];
      }
      grouped[customerName].push(order);
    });
    return grouped;
  }, [dueOrders]);

  const summaryStats = useMemo(() => {
    const totalDueOverall = dueOrders.reduce((sum, order) => sum + (order.balance_due || 0), 0);
    const totalPendingOrders = dueOrders.length;
    const totalCustomersWithDues = Object.keys(groupedByCustomer).length;
    return { totalDueOverall, totalPendingOrders, totalCustomersWithDues };
  }, [dueOrders, groupedByCustomer]);

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white"> Due Summary</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending payments grouped by customer.</p>
        </div>
        <div className="no-print">
            {/* UPDATED: Replaced the non-existent PrintButton with a standard Button */}
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Export Due Summary
            </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        {!loading && dueOrders.length > 0 && (
          <Card>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-2">
                    <Banknote className="w-6 h-6 mb-1 text-red-500"/>
                    <span className="text-xs text-gray-500">Total Due</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">₹{summaryStats.totalDueOverall.toLocaleString('en-IN')}</span>
                </div>
                  <div className="flex flex-col items-center p-2">
                    <Users className="w-6 h-6 mb-1 text-blue-500"/>
                    <span className="text-xs text-gray-500">Customers with Dues</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">{summaryStats.totalCustomersWithDues}</span>
                </div>
                  <div className="flex flex-col items-center p-2">
                    <Package className="w-6 h-6 mb-1 text-yellow-500"/>
                    <span className="text-xs text-gray-500">Pending Orders</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">{summaryStats.totalPendingOrders}</span>
                </div>
            </div>
          </Card>
        )}

        {loading ? (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500"/>
                <p className="ml-3 text-gray-500 dark:text-gray-400">Loading due summary...</p>
            </div>
        ) : error ? (
            <Card className="p-6 bg-red-50 text-red-700 border border-red-300 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500"/>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
            </Card>
        ) : summaryStats.totalCustomersWithDues === 0 ? (
            <Card className="p-12 text-center bg-green-50 dark:bg-green-900/30">
                <PartyPopper className="w-12 h-12 mx-auto mb-3 text-green-500"/>
                <p className="font-semibold text-lg text-green-700 dark:text-green-200">No Dues!</p>
                <p className="text-sm text-green-600 dark:text-green-300">All payments are up to date.</p>
            </Card>
        ) : (
          Object.entries(groupedByCustomer).map(([customer, orders]) => (
            <DueCard key={customer} customer={customer} orders={orders} />
          ))
        )}
      </div>
    </div>
  );
};

export default DueSummary;
