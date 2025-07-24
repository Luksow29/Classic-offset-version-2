  // Invoice Detail View Component
  const InvoiceDetailView = ({ invoiceData, onBack }: { invoiceData: any; onBack: () => void; }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const { invoice, payments } = invoiceData;

    const handlePrint = useReactToPrint({
        documentTitle: `Invoice_${invoice.id}`,
        bodyClass: "print-body",
        // @ts-ignore
        content: () => printRef.current
    });

    if (!invoice) return null;

    return (
        <Card className="mt-6 animate-slide-up">
            <div className="p-4 flex justify-between items-center border-b">
                <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Download as PDF</Button>
            </div>
            <div ref={printRef} className="p-8 bg-white text-black">
                 <div className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Classic Offset cards</h1>
                        <p className="text-sm text-gray-500">363, bazar road</p>
                        <p className="text-sm text-gray-500">kadayanallur -62775</p>
                        <p className="text-sm text-gray-500">Tenkasi District, Tamil Nadu.</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-700">INVOICE</h2>
                        <p className="text-sm text-gray-500">Invoice #: {invoice.id}</p>
                        <p className="text-sm text-gray-500">Date: {new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-700">Bill To:</h3>
                    <p className="text-lg font-bold text-gray-800">{invoice.customer_name}</p>
                    <p className="text-sm text-gray-600">{invoice.customer_address || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{invoice.customer_phone}</p>
                </div>
                <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 text-left font-semibold text-gray-600">Description</th>
                                <th className="py-2 px-4 text-center font-semibold text-gray-600">Quantity</th>
                                <th className="py-2 px-4 text-right font-semibold text-gray-600">Rate</th>
                                <th className="py-2 px-4 text-right font-semibold text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-3 px-4">{invoice.order_type}</td>
                                <td className="py-3 px-4 text-center">{invoice.quantity}</td>
                                <td className="py-3 px-4 text-right">₹{invoice.rate?.toLocaleString('en-IN') || '0.00'}</td>
                                <td className="py-3 px-4 text-right">₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-6">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Total:</span>
                            <span className="font-semibold text-gray-800">₹{invoice.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Paid:</span>
                            <span className="font-semibold text-green-600">- ₹{(invoice.total_amount - invoice.balance_amount).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t text-lg">
                            <span className="font-bold text-gray-800">Balance Due:</span>
                            <span className="font-bold text-red-600">₹{invoice.balance_amount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
                {payments.length > 0 && (
                    <div className="mt-8 border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-2">Payment History:</h3>
                        <ul className="text-xs list-disc list-inside text-gray-600">
                            {payments.map((p: any) => (
                                <li key={p.id}>
                                    Paid ₹{p.amount_paid.toLocaleString('en-IN')} via {p.payment_method} on {new Date(p.payment_date).toLocaleDateString('en-GB')}.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    );
  };
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import CollapsiblePanel from '@/components/ui/CollapsiblePanel';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Download from 'lucide-react/dist/esm/icons/download';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import BarChart from 'lucide-react/dist/esm/icons/bar-chart';
import Search from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Printer from 'lucide-react/dist/esm/icons/printer';

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

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('profit_loss');
  const [filters, setFilters] = useState<any>({
    startDate: '', 
    endDate: '', 
    orderStatus: '', 
    searchTerm: '', 
    sinceDate: '', 
    customerName: '', 
    orderNumber: '', 
    orderId: '',
    customerPhone: '',
    customerEmail: '',
    customerTag: '',
    paymentMethod: '',
    paymentStatus: '',
    minAmount: '',
    maxAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  // Sorting logic
  const getSortedData = (data: any[]) => {
    if (!sortConfig || !tableHeaders.length) return data;
    const { key, direction } = sortConfig;
    const colIdx = tableHeaders.findIndex((h) => h === key);
    if (colIdx === -1) return data;
    return [...data].sort((a, b) => {
      const aVal = Array.isArray(a) ? a[colIdx] : Object.values(a)[colIdx];
      const bVal = Array.isArray(b) ? b[colIdx] : Object.values(b)[colIdx];
      if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
        return direction === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }
      return direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  // Invoice report states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceDetailData, setInvoiceDetailData] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Reference for PDF printing
  const reportTableRef = useRef<HTMLDivElement>(null);

  const handleReportTypeChange = (newType: ReportType) => {
    setReportType(newType);
    setReportData(null);
    setTableHeaders([]);
    setSelectedInvoiceId(null);
    setInvoiceDetailData(null);
    setCurrentPage(1);
    clearFilters();
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({...prev, [e.target.id]: e.target.value}));
  };
  
  const clearFilters = () => {
    setFilters({ 
      startDate: '', 
      endDate: '', 
      orderStatus: '', 
      searchTerm: '', 
      sinceDate: '', 
      customerName: '', 
      orderNumber: '', 
      orderId: '',
      customerPhone: '',
      customerEmail: '',
      customerTag: '',
      paymentMethod: '',
      paymentStatus: '',
      minAmount: '',
      maxAmount: ''
    });
    setCurrentPage(1);
  }

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    setSelectedInvoiceId(null); // Clear detail view on new search

    let queryData: any[] | null = null, error: any = null, headers: string[] = [];
    try {
      // Invoice report has a different trigger (Search button)
      if (reportType === 'invoice_report') {
        ({ data: queryData, error } = await supabase.rpc('get_invoice_list', {
          p_start_date: filters.startDate || null,
          p_end_date: filters.endDate || null,
          p_customer_name: filters.searchTerm || null,
          p_order_id: filters.orderId ? parseInt(filters.orderId) : null,
        }));
        headers = ['Order ID', 'Date', 'Customer', 'Total', 'Due', 'Status'];
      } else if (reportType === 'customers_list') {
        // Customer list report
        let query = supabase.from('customers').select('*');

        // Apply filters
        if (filters.customerName) {
          query = query.ilike('name', `%${filters.customerName}%`);
        }
        if (filters.customerPhone) {
          query = query.ilike('phone', `%${filters.customerPhone}%`);
        }
        if (filters.customerEmail) {
          query = query.ilike('email', `%${filters.customerEmail}%`);
        }
        if (filters.customerTag) {
          query = query.contains('tags', [filters.customerTag]);
        }
        if (filters.sinceDate) {
          query = query.gte('joined_date', filters.sinceDate);
        }

        // Order by name
        query = query.order('name');

        const { data, error: customerError } = await query;
        queryData = data || [];
        error = customerError;
        headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Joined Date'];
      } else if (reportType === 'payment_details') {
        // Payment details report
        let query = supabase.from('payments').select(`
          id, 
          amount_paid, 
          payment_date, 
          payment_method,
          status,
          customers (name, phone),
          order_id
        `);

        // Apply filters
        if (filters.startDate) {
          query = query.gte('payment_date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('payment_date', filters.endDate);
        }
        if (filters.paymentMethod) {
          query = query.eq('payment_method', filters.paymentMethod);
        }
        if (filters.paymentStatus) {
          query = query.eq('status', filters.paymentStatus);
        }
        if (filters.minAmount) {
          query = query.gte('amount_paid', filters.minAmount);
        }
        if (filters.maxAmount) {
          query = query.lte('amount_paid', filters.maxAmount);
        }
        if (filters.customerName) {
          query = query.ilike('customers.name', `%${filters.customerName}%`);
        }

        // Order by payment date (newest first)
        query = query.order('payment_date', { ascending: false });

        const { data, error: paymentError } = await query;

        // Process the data to format it for display
        queryData = (data || []).map(payment => ({
          id: payment.id,
          order_id: payment.order_id,
          customer_name: (payment.customers as any)?.name || 'Unknown',
          customer_phone: (payment.customers as any)?.phone || '-',
          amount_paid: payment.amount_paid,
          payment_date: new Date(payment.payment_date).toLocaleDateString('en-GB'),
          payment_method: payment.payment_method || '-',
          status: payment.status || '-'
        }));

        error = paymentError;
        headers = ['Payment ID', 'Order ID', 'Customer', 'Phone', 'Amount', 'Date', 'Method', 'Status'];
      } else {
        // Logic for all other reports
        switch (reportType) {
          case 'profit_loss':
            ({ data: queryData, error } = await supabase.rpc('get_profit_loss_report', { 
              start_date: filters.startDate || null, 
              end_date: filters.endDate || null 
            }));
            headers = ['Category', 'Amount (₹)'];
            queryData = queryData?.length ? [
              ['Total Revenue', `+ ₹${queryData[0].total_revenue.toLocaleString('en-IN')}`],
              ['Total Expenses', `- ₹${queryData[0].total_expenses.toLocaleString('en-IN')}`],
              ['Net Profit', `₹${queryData[0].net_profit.toLocaleString('en-IN')}`],
            ] : [];
            break;
          case 'orders_list':
            ({ data: queryData, error } = await supabase.rpc('get_orders_report', { 
              start_date: filters.startDate || null, 
              end_date: filters.endDate || null, 
              order_status: filters.orderStatus || null 
            }));
            headers = ['Order ID', 'Customer', 'Type', 'Qty', 'Amount', 'Status', 'Date'];
            break;
          case 'due_summary':
            ({ data: queryData, error } = await supabase.rpc('get_due_summary_report'));
            headers = ['Order ID', 'Delivery Date', 'Balance Due (₹)'];
            break;
        }
      }

      if (error) throw error;
      setReportData(queryData);
      setTableHeaders(headers);
      if (!queryData || queryData.length === 0) {
        toast.success('No data found for the selected criteria.');
      }

    } catch (err: any) {
      toast.error(`Report generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch invoice details
  const handleInvoiceSelect = async (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setIsDetailLoading(true);
    setInvoiceDetailData(null);
    try {
        const { data: invoice, error: invoiceError } = await supabase.from('orders').select('*').eq('id', invoiceId).single();
        if (invoiceError) throw invoiceError;
        
        const { data: payments, error: paymentsError } = await supabase.from('payments').select('*').eq('order_id', invoiceId);
        if (paymentsError) throw paymentsError;

        setInvoiceDetailData({ invoice, payments });
    } catch (err: any) {
        toast.error(`Failed to load invoice #${invoiceId}: ${err.message}`);
        setSelectedInvoiceId(null); // Go back to list if fetch fails
    } finally {
        setIsDetailLoading(false);
    }
  }

  // Handle print using react-to-print
  const handlePrint = useReactToPrint({
    documentTitle: `${reportType}_report_${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => toast.success('PDF generated successfully!'),
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
      }
    `,
    // @ts-ignore
    content: () => reportTableRef.current
  });

  // Function to download PDF using jsPDF
  const downloadPdf = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Validate tableHeaders
    const validHeaders = Array.isArray(tableHeaders) && tableHeaders.length > 0 && tableHeaders.every(h => typeof h === 'string' && h.trim() !== '');
    if (!validHeaders) {
      toast.error('Invalid or missing table headers. Cannot generate PDF.');
      return;
    }

    // Generate tableData and validate
    const tableData = reportData.map(row => {
      if (Array.isArray(row)) {
        return row.map(val => val === null || val === undefined ? '-' : String(val));
      } else {
        return Object.values(row).map(val =>
          val === null || val === undefined ? '-' :
          typeof val === 'object' ? JSON.stringify(val) :
          String(val)
        );
      }
    });
    if (!Array.isArray(tableData) || tableData.length === 0 || !Array.isArray(tableData[0])) {
      toast.error('Invalid or missing table data. Cannot generate PDF.');
      return;
    }

    try {
      const doc = new jsPDF();

      // Add title
      const title = `${reportOptions.find(opt => opt.value === reportType)?.label || 'Report'}`;
      doc.setFontSize(18);
      doc.text(title, 14, 20);

      // Add date range if applicable
      if (filters.startDate || filters.endDate) {
        doc.setFontSize(12);
        doc.text(
          `Period: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start'} to ${filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End'}`,
          14,
          30
        );
      }

      // Add company info
      doc.setFontSize(10);
      doc.text('Classic Offset Cards', 14, 40);
      doc.text('363, bazar road, kadayanallur -62775', 14, 45);
      doc.text('Tenkasi District, Tamil Nadu', 14, 50);

    // Use autoTable function from jspdf-autotable
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 60,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

      // Add footer with date
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const renderFilters = () => {
    switch (reportType) {
      case 'invoice_report':
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <Input id="startDate" label="From Date" type="date" value={filters.startDate} onChange={handleFilterChange} />
                <Input id="endDate" label="To Date" type="date" value={filters.endDate} onChange={handleFilterChange} />
                <Input id="searchTerm" label="Customer Name" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Search name..." />
                <Input id="orderId" label="Order Number" type="number" value={filters.orderId} onChange={handleFilterChange} placeholder="Search ID..." />
            </div>
        );
      case 'profit_loss':
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Input id="startDate" label="From Date" type="date" value={filters.startDate} onChange={handleFilterChange} />
                <Input id="endDate" label="To Date" type="date" value={filters.endDate} onChange={handleFilterChange} />
            </div>
        );
      case 'orders_list':
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input id="startDate" label="From Date" type="date" value={filters.startDate} onChange={handleFilterChange} />
                <Input id="endDate" label="To Date" type="date" value={filters.endDate} onChange={handleFilterChange} />
                <Input as="select" id="orderStatus" label="Order Status" value={filters.orderStatus} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Design">Design</option>
                    <option value="Printing">Printing</option>
                    <option value="Delivered">Delivered</option>
                </Input>
            </div>
        );
      case 'customers_list':
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input id="customerName" label="Customer Name" value={filters.customerName} onChange={handleFilterChange} placeholder="Search by name..." />
                <Input id="customerPhone" label="Phone Number" value={filters.customerPhone} onChange={handleFilterChange} placeholder="Search by phone..." />
                <Input id="customerEmail" label="Email" value={filters.customerEmail} onChange={handleFilterChange} placeholder="Search by email..." />
                <Input id="customerTag" label="Tag" value={filters.customerTag} onChange={handleFilterChange} placeholder="Filter by tag (e.g. VIP)" />
                <Input id="sinceDate" label="Joined Since" type="date" value={filters.sinceDate} onChange={handleFilterChange} />
            </div>
        );
      case 'payment_details':
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input id="startDate" label="From Date" type="date" value={filters.startDate} onChange={handleFilterChange} />
                <Input id="endDate" label="To Date" type="date" value={filters.endDate} onChange={handleFilterChange} />
                <Input id="customerName" label="Customer Name" value={filters.customerName} onChange={handleFilterChange} placeholder="Search by name..." />
                <Input as="select" id="paymentMethod" label="Payment Method" value={filters.paymentMethod} onChange={handleFilterChange}>
                    <option value="">All Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Check">Check</option>
                </Input>
                <Input as="select" id="paymentStatus" label="Payment Status" value={filters.paymentStatus} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Due">Due</option>
                    <option value="Overdue">Overdue</option>
                </Input>
                <div className="grid grid-cols-2 gap-2">
                    <Input id="minAmount" label="Min Amount" type="number" value={filters.minAmount} onChange={handleFilterChange} placeholder="Min ₹" />
                    <Input id="maxAmount" label="Max Amount" type="number" value={filters.maxAmount} onChange={handleFilterChange} placeholder="Max ₹" />
                </div>
            </div>
        );
      default:
        return <div className="md:col-span-3"><p className="text-sm text-muted-foreground pt-6">Select a report type to see filters.</p></div>;
    }
  };
  
  const renderContent = () => {
    if (loading) {
        // Table skeleton shimmer
        return (
          <Card className="mt-6">
            <div className="overflow-x-auto p-2">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {tableHeaders.length > 0
                      ? tableHeaders.map((th) => (
                          <th key={th} className="px-4 py-2 text-left font-medium">
                            <Skeleton width={80} height={16} />
                          </th>
                        ))
                      : Array.from({ length: 6 }).map((_, i) => (
                          <th key={i} className="px-4 py-2 text-left font-medium">
                            <Skeleton width={80} height={16} />
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      {(tableHeaders.length > 0 ? tableHeaders : Array.from({ length: 6 })).map((_, colIdx) => (
                        <td key={colIdx} className="px-4 py-2">
                          <Skeleton width={100} height={16} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
    }
    
    // View Switcher for Invoice Report
    if (reportType === 'invoice_report') {
        if (isDetailLoading) {
            return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
        }
        if (selectedInvoiceId && invoiceDetailData) {
            return <InvoiceDetailView invoiceData={invoiceDetailData} onBack={() => setSelectedInvoiceId(null)} />;
        }
        // Show the list table if data exists
        if (reportData && reportData.length > 0) {
            // Pagination logic
            const totalPages = Math.ceil(reportData.length / rowsPerPage);
            const paginatedData = reportData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
            // Sorting
            const sortedInvoiceData = getSortedData(reportData);
            const paginatedInvoiceData = sortedInvoiceData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
            return (
                <Card className="mt-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                           <thead className="bg-muted/50">
                                <tr>
                                  {tableHeaders.map((th) => (
                                    <th
                                      key={th}
                                      className="px-4 py-2 text-left font-medium cursor-pointer select-none"
                                      onClick={() => handleSort(th)}
                                    >
                                      {th}
                                      {sortConfig?.key === th && (
                                        <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                      )}
                                    </th>
                                  ))}
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {paginatedInvoiceData.map(invoice => (
                                    <tr key={invoice.order_id} onClick={() => handleInvoiceSelect(invoice.order_id)} className="cursor-pointer hover:bg-muted/20">
                                        <td className="px-4 py-2 font-bold">#{invoice.order_id}</td>
                                        <td className="px-4 py-2">{new Date(invoice.order_date).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-2">{invoice.customer_name}</td>
                                        <td className="px-4 py-2">₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-2 text-destructive">₹{invoice.balance_due.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-2">{invoice.status || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </Card>
            );
        }
        return <EmptyState message="No invoices found. Try changing filters." actionLabel="Clear Filters" onAction={clearFilters} />;
    }
    
    // Render for other reports - Always render the ref container
    // Pagination for other reports
    return (
        <Card className="mt-6">
            {reportData && reportData.length > 0 && (
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Report Preview</h3>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} size="sm">
                            <Printer className="mr-2 h-4 w-4" /> Print Report
                        </Button>
                        <Button onClick={downloadPdf} size="sm">
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>
            )}
            <div ref={reportTableRef} className="overflow-x-auto p-2">
                {reportData && reportData.length > 0 ? (
                    <>
                        <div className="p-4 hidden print:block">
                            <h1 className="text-xl font-bold mb-2">{reportOptions.find(opt => opt.value === reportType)?.label || 'Report'}</h1>
                            {(filters.startDate || filters.endDate) && (
                                <p className="text-sm mb-4">
                                    Period: {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start'} to {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End'}
                                </p>
                            )}
                            <div className="text-xs mb-6">
                                <p>Classic Offset Cards</p>
                                <p>363, bazar road, kadayanallur -62775</p>
                                <p>Tenkasi District, Tamil Nadu</p>
                            </div>
                        </div>
                        {/* Pagination + Sorting logic */}
                        {(() => {
                          const sortedOtherData = getSortedData(reportData);
                          const totalPages = Math.ceil(reportData.length / rowsPerPage);
                          const paginatedOtherData = sortedOtherData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
                          return <>
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                      {tableHeaders.map((th, idx) => (
                                        <th
                                          key={th}
                                          className="px-4 py-2 text-left font-medium cursor-pointer select-none"
                                          onClick={() => handleSort(th)}
                                        >
                                          {th}
                                          {sortConfig?.key === th && (
                                            <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                          )}
                                        </th>
                                      ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {paginatedOtherData.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/20">
                                          {Array.isArray(row) 
                                            ? row.map((td: any, j) => <td key={j} className="px-4 py-2">{td}</td>)
                                            : Object.values(row).map((td: any, j) => <td key={j} className="px-4 py-2">{String(td)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                          </>;
                        })()}
                        <div className="p-4 text-xs text-right hidden print:block">
                            Generated on {new Date().toLocaleString()}
                        </div>
                    </>
                ) : (
                    <EmptyState message="No data available to display" actionLabel="Clear Filters" onAction={clearFilters} />
                )}
            </div>
        </Card>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold flex items-center gap-3"><BarChart /> Reports Center</h1>
      
      <Card>
        <div className="p-6 space-y-6">
          <CollapsiblePanel title="Filters">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <Input as="select" id="reportType" label="Report Type" value={reportType} onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}>
                {reportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Input>
              {renderFilters()}
            </div>
            <div className="flex items-center gap-3 mt-4">
                <Button onClick={generateReport} disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working...</> : 
                     (reportType === 'invoice_report' ? <><Search className="mr-2 h-4 w-4"/>Search Invoices</> : 'Generate Report')}
                </Button>
                <Button onClick={clearFilters} variant="outline"><X className="mr-2 h-4 w-4" /> Clear</Button>
            </div>
          </CollapsiblePanel>
        </div>
      </Card>
      
      {renderContent()}

    </div>
  );
};

export default ReportsPage;
