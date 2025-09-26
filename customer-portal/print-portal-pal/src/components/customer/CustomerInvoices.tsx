import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportInvoiceToPDF } from "@/lib/exportInvoiceToPDF";
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  Download,
  Eye,
  CreditCard
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Payment {
  id: string;
  order_id: number;
  total_amount: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes: string;
}

interface Invoice {
  order_id: number;
  order_date: string;
  customer_name: string;
  total_amount: number;
  balance_due: number;
  status: string;
  order_type?: string;
  quantity?: number;
}

interface CustomerInvoicesProps {
  customerId: string;
}

export default function CustomerInvoices({ customerId }: CustomerInvoicesProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(invoices.length / pageSize);
  // Sorting
  const [sortKey, setSortKey] = useState<'order_date'|'total_amount'|'status'>('order_date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  // Filtering (status)
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchInvoicesAndPayments();
  }, [customerId]);

  const fetchInvoicesAndPayments = async () => {
    try {
      // Fetch payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("customer_id", customerId)
        .order("payment_date", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch invoice list using the function
      const { data: invoicesData, error: invoicesError } = await supabase
        .rpc("get_invoice_list", {
          p_customer_name: null,
          p_order_id: null,
          p_start_date: null,
          p_end_date: null
        });

      if (invoicesError) throw invoicesError;

      // Filter invoices for this customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;
      setSelectedCustomer(customerData);

      const customerInvoices = invoicesData.filter(
        (invoice: Invoice) => invoice.customer_name === customerData.name
      );

      setInvoices(customerInvoices || []);
    } catch (error: any) {
      console.error("Error fetching invoices and payments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch invoices and payments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch order details when invoice is selected
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!selectedInvoice) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("order_type, quantity")
          .eq("id", selectedInvoice.order_id)
          .single();
        if (error) throw error;
        setOrderDetails(data);
      } catch (err) {
        setOrderDetails(null);
      }
    };
    fetchOrderDetails();
  }, [selectedInvoice]);

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      "Paid": { 
        variant: "default" as const, 
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50", 
        description: "Invoice fully paid" 
      },
      "Due": { 
        variant: "destructive" as const, 
        className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50", 
        description: "Payment due" 
      },
      "Partial": { 
        variant: "secondary" as const, 
        className: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/50", 
        description: "Partially paid" 
      },
      "Overdue": { 
        variant: "destructive" as const, 
        className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50", 
        description: "Payment overdue" 
      },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["Due"];
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Badge variant={config.variant} className={config.className}>{status}</Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {config.description}
        </TooltipContent>
      </Tooltip>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateInvoicePDF = async (invoice: Invoice) => {
    if (!invoiceRef.current) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invoice content not found for export.",
      });
      return;
    }
    await exportInvoiceToPDF("invoice-details-pdf");
    toast({
      title: "Download Started",
      description: "Invoice PDF is being downloaded.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Sorting/filtering logic
  const filteredInvoices = statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices;
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortKey === 'order_date') {
      return sortDir === 'asc'
        ? new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
        : new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    } else if (sortKey === 'total_amount') {
      return sortDir === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
    } else if (sortKey === 'status') {
      return sortDir === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
    }
    return 0;
  });
  const pagedInvoices = sortedInvoices.slice((page-1)*pageSize, page*pageSize);

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Invoices Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{t('invoices.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('invoices.count', { count: invoices.length })}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-sm">{t('invoices.sort_by')}</label>
              <select className="border rounded px-2 py-1 text-sm" value={sortKey} onChange={e => setSortKey(e.target.value as any)}>
                <option value="order_date">{t('invoices.sort_date')}</option>
                <option value="total_amount">{t('invoices.sort_amount')}</option>
                <option value="status">{t('invoices.sort_status')}</option>
              </select>
              <button className="text-xs underline" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? t('invoices.asc') : t('invoices.desc')}</button>
              <label className="text-sm ml-2">{t('invoices.filter_status')}</label>
              <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">{t('invoices.status_all')}</option>
                <option value="Paid">{t('invoices.status_paid')}</option>
                <option value="Due">{t('invoices.status_due')}</option>
                <option value="Partial">{t('invoices.status_partial')}</option>
              </select>
            </div>
          </div>

          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('invoices.none_found')}</h3>
                <p className="text-muted-foreground">{t('invoices.none_desc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pagedInvoices.map((invoice) => (
                <Card key={invoice.order_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-lg">{t('invoices.invoice_number', { id: invoice.order_id })}</h3>
                        {getPaymentStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{t('invoices.date', { date: formatDate(invoice.order_date) })}</span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="font-semibold text-primary">₹{invoice.total_amount.toLocaleString()}</span>
                        {invoice.balance_due > 0 && (
                          <span className="text-orange-600 font-medium">
                            {t('invoices.due')}: ₹{invoice.balance_due.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{t('invoices.view')}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{t('invoices.dialog_title', { id: selectedInvoice?.order_id })}</DialogTitle>
                            <DialogDescription>
                              {t('invoices.dialog_desc')}
                            </DialogDescription>
                          </DialogHeader>
                    {selectedInvoice && (
                      <>
                        {/* PDF Download Button */}
                        <div className="flex justify-end mb-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => generateInvoicePDF(selectedInvoice)}
                              >
                                <Download className="h-4 w-4" />
                                <span>{t('invoices.download_pdf')}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('invoices.download_pdf')}</TooltipContent>
                          </Tooltip>
                        </div>
                            <>
                              <div className="bg-white p-8 rounded shadow max-w-2xl mx-auto border border-gray-300" id="invoice-details-pdf" ref={invoiceRef} style={{ fontFamily: 'serif', color: '#222' }}>
                                {/* Header */}
                                <div className="flex items-center mb-6">
                                  <img src="/placeholder.svg" alt="Shop Logo" className="h-16 w-16 rounded mr-4" />
                                  <div>
                                    <div className="text-2xl font-bold tracking-wide" style={{ letterSpacing: '1px' }}>Classic offset and cards</div>
                                    <div className="text-base">363, bazar road, kadayanallur -62775.</div>
                                    <div className="text-base">Tenkasi Dist</div>
                                    <div className="text-base">Mobile / Whatsapp: +91 98425 78847</div>
                                    <div className="text-base">Email: classicprinterskdnl@gmail.com</div>
                                  </div>
                                </div>
                                <div className="border-b border-gray-400 mb-4"></div>
                                {/* Invoice Title & Meta */}
                                <div className="flex justify-between items-center mb-6">
                                  <div>
                                    <div className="text-lg font-semibold">{t('invoices.invoice')}</div>
                                    <div className="text-sm">{t('invoices.invoice_number', { id: selectedInvoice.order_id })}</div>
                                    <div className="text-sm">{t('invoices.date', { date: formatDate(selectedInvoice.order_date) })}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm">Status: <span style={{ color: selectedInvoice.status === 'Paid' ? '#16a34a' : selectedInvoice.status === 'Due' ? '#dc2626' : '#ea580c', fontWeight: 600 }}>{selectedInvoice.status}</span></div>
                                    <div className="text-sm">Total: <span className="font-bold">₹{selectedInvoice.total_amount.toLocaleString()}</span></div>
                                    <div className="text-sm">Balance Due: <span className={selectedInvoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>₹{selectedInvoice.balance_due.toLocaleString()}</span></div>
                                  </div>
                                </div>
                                {/* Customer & Order Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                  <div>
                                    <div className="font-semibold mb-1">Bill To</div>
                                    <div className="text-sm">{selectedCustomer?.name}</div>
                                    <div className="text-sm">{selectedCustomer?.address}</div>
                                    <div className="text-sm">{selectedCustomer?.phone}</div>
                                    <div className="text-sm">{selectedCustomer?.email}</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold mb-1">{t('invoices.order_details')}</div>
                                    <div className="text-sm">{t('invoices.type')} {orderDetails?.order_type || <span className="text-red-500">N/A</span>}</div>
                                    <div className="text-sm">{t('invoices.quantity')} {typeof orderDetails?.quantity === 'number' ? orderDetails.quantity : <span className="text-red-500">N/A</span>}</div>
                                    <div className="text-sm">{t('invoices.order_date')} {formatDate(selectedInvoice.order_date)}</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold mb-1">{t('invoices.summary')}</div>
                                    <div className="text-sm">{t('invoices.total')} ₹{selectedInvoice.total_amount.toLocaleString()}</div>
                                    <div className="text-sm">{t('invoices.paid')} ₹{(selectedInvoice.total_amount - selectedInvoice.balance_due).toLocaleString()}</div>
                                    <div className="text-sm">{t('invoices.due')} <span className={selectedInvoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>₹{selectedInvoice.balance_due.toLocaleString()}</span></div>
                                  </div>
                                </div>
                                {/* Payment History Table */}
                                <div>
                                  <div className="font-semibold mb-2">{t('invoices.payment_history')}</div>
                                  <table className="w-full border border-gray-300 text-sm" style={{ borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f3f4f6' }}>
                                      <tr>
                                        <th className="border border-gray-300 px-2 py-1 text-left">{t('invoices.payment_date')}</th>
                                        <th className="border border-gray-300 px-2 py-1 text-right">{t('invoices.payment_amount')}</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">{t('invoices.payment_method')}</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">{t('invoices.payment_status')}</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">{t('invoices.payment_notes')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {payments.filter(p => p.order_id === selectedInvoice.order_id).length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-2 text-gray-400">{t('invoices.no_payments')}</td></tr>
                                      ) : (
                                        payments.filter(p => p.order_id === selectedInvoice.order_id).map(payment => (
                                          <tr key={payment.id}>
                                            <td className="border border-gray-300 px-2 py-1">{formatDate(payment.payment_date)}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-green-700 font-semibold">₹{payment.amount_paid.toLocaleString()}</td>
                                            <td className="border border-gray-300 px-2 py-1">{payment.payment_method}</td>
                                            <td className="border border-gray-300 px-2 py-1">{payment.status}</td>
                                            <td className="border border-gray-300 px-2 py-1">{payment.notes || '-'}</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              {/* Download PDF Button */}
                              <div className="flex justify-end mt-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="default"
                                      onClick={() => generateInvoicePDF(selectedInvoice)}
                                      className="flex items-center gap-2"
                                    >
                                      <Download className="h-4 w-4" />
                                      <span>PDF பதிவிறக்கு (Download PDF)</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    இந்த விலைக்குறிப்பை PDF-ஆக பதிவிறக்கவும்
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </>
                      </>
                    )}
                        </DialogContent>
                      </Dialog>

                      {/* Remove the bottom PDF button from the invoice card list for a clean UI */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('invoices.payment_history')}</h2>
          <p className="text-sm text-muted-foreground">{t('invoices.payment_count', { count: payments.length })}</p>
        </div>

        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('invoices.no_payments')}</h3>
              <p className="text-muted-foreground">{t('invoices.no_payments_desc')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-lg">{t('invoices.payment_for_order', { orderId: payment.order_id })}</h3>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{t('invoices.payment_date')}: {formatDate(payment.payment_date)}</span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="font-semibold text-green-600">
                          ₹{payment.amount_paid.toLocaleString()} {t('invoices.paid')}
                        </span>
                        <span>{t('invoices.payment_method')}: {payment.payment_method}</span>
                      </div>

                      {payment.notes && (
                        <p className="text-sm text-muted-foreground">{payment.notes}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        ₹{payment.amount_paid.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.payment_method}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={e => {e.preventDefault(); setPage(p => Math.max(1, p-1));}} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={page === i+1} onClick={e => {e.preventDefault(); setPage(i+1);}}>{i+1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={e => {e.preventDefault(); setPage(p => Math.min(totalPages, p+1));}} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}