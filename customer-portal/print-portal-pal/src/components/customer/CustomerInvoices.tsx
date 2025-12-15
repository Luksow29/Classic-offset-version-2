import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  Calendar,
  ChevronsUpDown,
  Download,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { exportInvoiceToPDF } from "@/lib/exportInvoiceToPDF";

interface Payment {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

interface GroupedInvoice {
  order_id: number;
  order_date: string;
  customer_name: string;
  total_amount: number;
  balance_due: number;
  status: string;
  payments: Payment[];
}

interface CustomerInvoicesProps {
  customerId: string;
}

export default function CustomerInvoices({ customerId }: CustomerInvoicesProps) {
  const [groupedInvoices, setGroupedInvoices] = useState<GroupedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<GroupedInvoice | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchGroupedInvoices();
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();
    if (!error) setCustomerDetails(data);
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!selectedInvoice) return;
      const { data, error } = await supabase
        .from("orders")
        .select("order_type, quantity")
        .eq("id", selectedInvoice.order_id)
        .single();
      if (!error) setOrderDetails(data);
    };
    fetchOrderDetails();
  }, [selectedInvoice]);

  const fetchGroupedInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_payments_view")
        .select("*")
        .eq("customer_id", customerId);

      if (error) throw error;

      // Group payments by order_id
      const invoicesMap = new Map<number, GroupedInvoice>();
      for (const row of data) {
        if (!invoicesMap.has(row.order_id)) {
          invoicesMap.set(row.order_id, {
            order_id: row.order_id,
            order_date: row.created_at,
            customer_name: row.customer_name,
            total_amount: row.order_total_amount,
            balance_due: row.order_balance_due,
            status: row.order_status,
            payments: [],
          });
        }
        if (row.payment_id) {
          invoicesMap.get(row.order_id)!.payments.push({
            id: row.payment_id,
            amount_paid: row.payment_amount,
            payment_date: row.payment_created_at,
            payment_method: row.payment_method,
            notes: row.payment_notes,
          });
        }
      }
      setGroupedInvoices(Array.from(invoicesMap.values()));

    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch invoices and payment history.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Paid: {
        className: "bg-green-100 text-green-800",
      },
      Partial: {
        className: "bg-yellow-100 text-yellow-800",
      },
      Due: {
        className: "bg-red-100 text-red-800",
      },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["Due"];
    return <Badge className={config.className}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("invoices.none_found")}</h3>
            <p className="text-muted-foreground">{t("invoices.none_desc")}</p>
          </CardContent>
        </Card>
      ) : (
        groupedInvoices.map((invoice) => (
          <Collapsible key={invoice.order_id} className="border rounded-lg">
            <CollapsibleTrigger className="w-full p-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {t("invoices.invoice_number", { id: invoice.order_id })}
                  </h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(invoice.order_date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-xl">
                    ₹{invoice.total_amount.toLocaleString()}
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("invoices.view")}
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-6 border-t">
              <div className="mb-4">
                <h4 className="font-semibold mb-2">{t("invoices.summary")}</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t("invoices.total")}</div>
                    <div>₹{invoice.total_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("invoices.paid")}</div>
                    <div className="text-green-600">
                      ₹{(invoice.total_amount - invoice.balance_due).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("invoices.due")}</div>
                    <div className={invoice.balance_due > 0 ? "text-red-600" : ""}>
                      ₹{invoice.balance_due.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <h4 className="font-semibold mb-2">{t("invoices.payment_history")}</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoices.payment_date")}</TableHead>
                    <TableHead>{t("invoices.payment_method")}</TableHead>
                    <TableHead className="text-right">{t("invoices.payment_amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell className="text-right">
                        ₹{payment.amount_paid.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        ))
      )}

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={(isOpen) => !isOpen && setSelectedInvoice(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("invoices.dialog_title", { id: selectedInvoice.order_id })}
              </DialogTitle>
            </DialogHeader>
            <div id="invoice-pdf-content" className="bg-white p-8 rounded shadow max-w-2xl mx-auto border border-gray-300 text-black">
              {/* Header */}
              <div className="flex items-center mb-6">
                <img src="/icon-192x192.png" alt="Shop Logo" className="h-16 w-16 rounded mr-4" />
                <div>
                  <div className="text-2xl font-bold tracking-wide">Classic offset and cards</div>
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
                  <div className="text-sm">Status: {getStatusBadge(selectedInvoice.status)}</div>
                  <div className="text-sm">Total: <span className="font-bold">₹{selectedInvoice.total_amount.toLocaleString()}</span></div>
                  <div className="text-sm">Balance Due: <span className={selectedInvoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>₹{selectedInvoice.balance_due.toLocaleString()}</span></div>
                </div>
              </div>
              {/* Customer & Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="font-semibold mb-1">Bill To</div>
                  <div className="text-sm">{customerDetails?.name}</div>
                  <div className="text-sm">{customerDetails?.address}</div>
                  <div className="text-sm">{customerDetails?.phone}</div>
                  <div className="text-sm">{customerDetails?.email}</div>
                  {customerDetails?.customer_code && <div className="text-sm font-semibold mt-1">ID: {customerDetails.customer_code}</div>}
                </div>
                <div>
                  <div className="font-semibold mb-1">{t('invoices.summary')}</div>
                  <div className="text-sm">{t('invoices.total')} ₹{selectedInvoice.total_amount.toLocaleString()}</div>
                  <div className="text-sm">{t('invoices.paid')} ₹{(selectedInvoice.total_amount - selectedInvoice.balance_due).toLocaleString()}</div>
                  <div className="text-sm">{t('invoices.due')} <span className={selectedInvoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>₹{selectedInvoice.balance_due.toLocaleString()}</span></div>
                </div>
              </div>
              {/* Order Items Table */}
              <div className="mb-6">
                <div className="font-semibold mb-2">Order Items</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Description</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{orderDetails?.order_type || 'N/A'}</TableCell>
                      <TableCell className="text-center">{orderDetails?.quantity || 'N/A'}</TableCell>
                      <TableCell className="text-right">₹{selectedInvoice.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* Payment History Table */}
              <div>
                <div className="font-semibold mb-2">{t('invoices.payment_history')}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoices.payment_date")}</TableHead>
                      <TableHead>{t("invoices.payment_method")}</TableHead>
                      <TableHead className="text-right">{t("invoices.payment_amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell className="text-right">
                          ₹{payment.amount_paid.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => exportInvoiceToPDF("invoice-pdf-content")}>
                <Download className="h-4 w-4 mr-2" />
                {t("invoices.download_pdf")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
