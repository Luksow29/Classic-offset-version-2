// src/pages/ReportsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Sparkles } from 'lucide-react';

import ReportsFilterBar from '@/components/reports/ReportsFilterBar';
import ReportsTable from '@/components/reports/ReportsTable';
import InvoiceDetailView from '@/components/reports/InvoiceDetailView';

interface ReportsPageDrilldownProps {
  drilldownType?: string;
  drilldownFilters?: Record<string, any>;
  isDrilldown?: boolean;
}

// Define the report types
type ReportType = 'profit_loss' | 'orders_list' | 'customers_list' | 'payment_details' | 'due_summary' | 'invoice_report';

const reportOptions = [
  { value: 'profit_loss', label: 'Profit & Loss' },
  { value: 'orders_list', label: 'Orders List' },
  { value: 'customers_list', label: 'Customer List' },
  { value: 'payment_details', label: 'Payment Details' },
  { value: 'due_summary', label: 'Due Summary Report' },
  { value: 'invoice_report', label: 'Invoice Report' },
];

const ReportsPage: React.FC<ReportsPageDrilldownProps> = ({ drilldownType, drilldownFilters, isDrilldown }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialType = (drilldownType as ReportType) || (params.get('type') as ReportType) || 'profit_loss';

  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [filters, setFilters] = useState<any>({
    startDate: '',
    endDate: '',
    orderStatus: '',
    searchTerm: '',
    sinceDate: '',
    customerName: '',
    orderId: '',
    customerPhone: '',
    customerTag: '',
    paymentMethod: '',
    paymentStatus: '',
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Invoice Detail
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceDetailData, setInvoiceDetailData] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Sorting Handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  // Sorting Logic
  const getSortedData = (data: any[]) => {
    if (!sortConfig || !tableHeaders.length) return data;
    const { key, direction } = sortConfig;
    const colIdx = tableHeaders.findIndex((h) => h === key);
    if (colIdx === -1) return data;

    return [...data].sort((a, b) => {
      const aVal = Array.isArray(a) ? a[colIdx] : Object.values(a)[colIdx];
      const bVal = Array.isArray(b) ? b[colIdx] : Object.values(b)[colIdx];

      const aNum = Number(aVal?.toString().replace(/[^0-9.-]+/g, ""));
      const bNum = Number(bVal?.toString().replace(/[^0-9.-]+/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum) && !(aVal instanceof Date)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '', endDate: '', orderStatus: '', searchTerm: '',
      sinceDate: '', customerName: '', orderId: '',
      customerPhone: '', customerTag: '', paymentMethod: '', paymentStatus: ''
    });
    setCurrentPage(1);
    setReportData(null);
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    setSelectedInvoiceId(null);

    let queryData: any[] | null = null, error: any = null, headers: string[] = [];
    try {
      if (reportType === 'invoice_report') {
        ({ data: queryData, error } = await supabase.rpc('get_invoice_list', {
          p_start_date: filters.startDate || null,
          p_end_date: filters.endDate || null,
          p_customer_name: filters.searchTerm || null,
          p_order_id: filters.orderId ? parseInt(filters.orderId) : null,
        }));
        // Map raw data to simpler objects for generic table if needed, or keep standard
        headers = ['Order ID', 'Date', 'Customer', 'Total', 'Due', 'Status'];
        queryData = (queryData || []).map(inv => ({
          id: inv.order_id,
          date: new Date(inv.order_date).toLocaleDateString(),
          customer: inv.customer_name,
          total: `₹${inv.total_amount.toLocaleString()}`,
          due: `₹${inv.balance_due.toLocaleString()}`,
          status: inv.status
        }));

      } else if (reportType === 'customers_list') {
        let query = supabase.from('customers').select('*');
        if (filters.customerName) query = query.ilike('name', `%${filters.customerName}%`);
        if (filters.customerPhone) query = query.ilike('phone', `%${filters.customerPhone}%`);
        if (filters.customerTag) query = query.contains('tags', [filters.customerTag]);

        const { data, error: customerError } = await query.order('name');
        if (customerError) throw customerError;

        headers = ['Name', 'Phone', 'Email', 'Address', 'Joined Date'];
        queryData = (data || []).map(c => ({
          name: c.name,
          phone: c.phone,
          email: c.email || '-',
          address: c.address || '-',
          joined: new Date(c.created_at).toLocaleDateString()
        }));

      } else if (reportType === 'payment_details') {
        let query = supabase.from('payments').select('id, amount_paid, payment_date, payment_method, status, customers(name, phone)').order('payment_date', { ascending: false });

        if (filters.startDate) query = query.gte('payment_date', filters.startDate);
        if (filters.endDate) query = query.lte('payment_date', filters.endDate);
        if (filters.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
        if (filters.paymentStatus) query = query.eq('status', filters.paymentStatus);

        const { data, error: payError } = await query;
        if (payError) throw payError;

        headers = ['Date', 'Customer', 'Method', 'Status', 'Amount'];
        queryData = (data || []).map(p => ({
          date: new Date(p.payment_date).toLocaleDateString(),
          customer: (p.customers as any)?.name || 'Unknown',
          method: p.payment_method,
          status: p.status,
          amount: `₹${p.amount_paid.toLocaleString()}`
        }));

      } else if (reportType === 'profit_loss') {
        // Existing RPC logic assumed
        const { data, error: plError } = await supabase.rpc('get_profit_loss_report', {
          start_date: filters.startDate || null,
          end_date: filters.endDate || null
        });
        if (plError) throw plError;

        headers = ['Category', 'Amount'];
        if (data && data.length > 0) {
          queryData = [
            { category: 'Total Revenue', amount: `+ ₹${data[0].total_revenue.toLocaleString()}` },
            { category: 'Total Expenses', amount: `- ₹${data[0].total_expenses.toLocaleString()}` },
            { category: 'Net Profit', amount: `₹${data[0].net_profit.toLocaleString()}` },
          ];
        }
      } else if (reportType === 'orders_list') {
        const { data, error: orderError } = await supabase.rpc('get_orders_report', {
          start_date: filters.startDate || null,
          end_date: filters.endDate || null,
          order_status: filters.orderStatus || null
        });
        if (orderError) throw orderError;

        headers = ['Order ID', 'Customer', 'Type', 'Qty', 'Amount', 'Status', 'Date'];
        queryData = data || []; // RPC returns correct structure usually
      } else if (reportType === 'due_summary') {
        const { data, error: dueError } = await supabase.rpc('get_due_summary_report');
        if (dueError) throw dueError;

        headers = ['Order ID', 'Customer', 'Due Amount', 'Due Date'];
        queryData = (data || []).map(item => ({
          orderId: item.order_id || item.id,
          customer: item.customer_name || item.name || 'Unknown',
          amount: `₹${(item.balance_due || item.due_amount || 0).toLocaleString('en-IN')}`,
          date: new Date(item.due_date || item.created_at || new Date()).toLocaleDateString('en-GB')
        }));
      }

      if (error) throw error;
      setReportData(queryData || []);
      setTableHeaders(headers);
      if (!queryData || queryData.length === 0) toast('No data found', { icon: 'ℹ️' });

    } catch (err: any) {
      console.error(err);
      toast.error(`Report failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = async (row: any) => {
    // Expecting row to have 'id' or 'Order ID' depending on report type
    // For invoice report, we mapped it to 'id'
    if (reportType !== 'invoice_report') return;

    const invoiceId = row.id;
    if (!invoiceId) return;

    setIsDetailLoading(true);
    setSelectedInvoiceId(invoiceId);

    try {
      const { data: invoice, error: invoiceError } = await supabase.from('orders').select('*').eq('id', invoiceId).single();
      if (invoiceError) throw invoiceError;

      const { data: payments, error: paymentsError } = await supabase.from('payments').select('*').eq('order_id', invoiceId);
      if (paymentsError) throw paymentsError;

      setInvoiceDetailData({ invoice, payments });
    } catch (err) {
      toast.error("Failed to load details");
      setSelectedInvoiceId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Printing & PDF Logic
  const reportTableRef = useRef<HTMLDivElement>(null); // Placeholder for generic print content if needed

  const generatePDF = () => {
    if (!reportData || !reportData.length) return toast.error("No data to export");
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`${reportOptions.find(o => o.value === reportType)?.label}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableBody = reportData.map(row => Object.values(row).map(v => String(v)));

    autoTable(doc, {
      head: [tableHeaders],
      body: tableBody,
      startY: 35,
      theme: 'grid'
    });

    doc.save(`${reportType}_report.pdf`);
  };

  // Pagination Logic
  const sortedData = getSortedData(reportData || []);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (selectedInvoiceId && invoiceDetailData) {
    return (
      <div className="p-6">
        <InvoiceDetailView
          invoiceData={invoiceDetailData}
          onBack={() => { setSelectedInvoiceId(null); setInvoiceDetailData(null); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BarChart className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            Reports Center
          </h1>
          <p className="text-blue-100 font-medium max-w-xl">
            Gain insights into your business performance, track financials, and analyze customer trends.
          </p>
        </div>
      </div>

      <ReportsFilterBar
        reportType={reportType}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onGenerate={generateReport}
        reportOptions={reportOptions}
        onReportTypeChange={(val) => setReportType(val as ReportType)}
      />

      <ReportsTable
        loading={loading}
        data={paginatedData}
        headers={tableHeaders}
        sortConfig={sortConfig}
        onSort={handleSort}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRowClick={reportType === 'invoice_report' ? handleInvoiceSelect : undefined}
        onDownloadPdf={generatePDF}
        reportLabel={reportOptions.find(o => o.value === reportType)?.label || 'Report'}
      />
    </div>
  );
};

export default ReportsPage;
