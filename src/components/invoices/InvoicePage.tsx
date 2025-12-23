// @ts-nocheck
// src/components/invoices/InvoicePage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import InvoiceView from './InvoiceView';
import { useReactToPrint } from 'react-to-print';
import { Printer, MessageCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

// OrderDetails வகை வரையறை
interface OrderDetails {
  id: number;
  date: string;
  total_amount: number;
  paid: number;
  balance: number;
  customer_id: string;
  order_type?: string;
  quantity?: number;
  customer: {
    name: string;
    phone: string;
    address: string | null;
    code?: string | null;
  } | null;
  payments?: {
    date: string;
    amount: number;
    method: string;
    id: string;
  }[];
}

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const printableContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `Invoice-${order?.id || id}`,
    onBeforeGetContent: () => new Promise<void>((resolve) => setTimeout(resolve, 250)),
    pageStyle: `
      @media print { 
        body { -webkit-print-color-adjust: exact; } 
        @page { size: A4; margin: 20mm; }
        .no-print { display: none !important; }
      }
    `,
  });

  // WhatsApp Dashboard-க்கு அனுப்பும் ஃபங்ஷன்
  const handleGoToWhatsAppDashboard = () => {
    if (order && order.customer && order.customer.phone && order.id && order.customer_id) {
      const params = new URLSearchParams({
        orderId: order.id.toString(),
        customerId: order.customer_id,
        customerName: order.customer.name,
      });
      navigate(`/whatsapp?${params.toString()}`);
    }
  };

  useEffect(() => {
    if (!id) {
      setError("URL-லில் இன்வாய்ஸ் ஐடி (ID) இல்லை.");
      setLoading(false);
      return;
    }

    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query the 'orders' table directly to ensure we get all fields like quantity and order_type
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            date,
            total_amount,
            amount_received,
            balance_amount,
            order_type,
            quantity,
            customer_id,
            customers (
              name,
              phone,
              address,
              customer_code
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error(`Invoice #${id} not found.`);

        // Type assertion for the joined customer data
        const customerData = data.customers as any;

        // Fetch payments for this order
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('id, payment_date, amount_paid, payment_method, notes')
          .eq('order_id', id)
          .order('payment_date', { ascending: false });

        const orderDetails: OrderDetails = {
          id: data.id,
          date: data.date,
          total_amount: data.total_amount,
          paid: data.amount_received, // key is amount_received in orders table
          balance: data.balance_amount,
          customer_id: data.customer_id,
          order_type: data.order_type,
          quantity: data.quantity,
          customer: {
            name: customerData?.name || 'Walk-in Customer',
            phone: customerData?.phone || '',
            address: customerData?.address || null,
            code: customerData?.customer_code || null,
          },
          payments: paymentsData ? paymentsData.map(p => ({
            date: p.payment_date,
            amount: p.amount_paid,
            method: p.payment_method,
            id: p.id
          })) : []
        };

        setOrder(orderDetails);

      } catch (err: any) {
        console.error("Error fetching invoice data:", err);
        setError(err.message || 'Failed to load invoice data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-600 dark:text-gray-400">இன்வாய்ஸ் #{id} ஏற்றப்படுகிறது...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <Card className="p-6 m-4 bg-red-50 text-red-700 border border-red-300 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="font-semibold text-lg">இன்வாய்ஸ் ஏற்றுவதில் பிழை</p>
        <p className="text-sm mb-4">{error || 'இன்வாய்ஸ் கண்டுபிடிக்க முடியவில்லை.'}</p>
        <Link to="/invoices">
          <Button variant="secondary" className="flex items-center mx-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            அனைத்து இன்வாய்ஸ்களுக்கும் திரும்புக
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation & Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 no-print">
          <div className="flex items-center gap-4">
            <Link to="/invoices">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Invoice #{order.id}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              variant="primary"
              className="shadow-md"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / Download PDF
            </Button>

            {/* Hide WhatsApp if no phone */}
            {order.customer?.phone && (
              <Button
                variant="success"
                onClick={handleGoToWhatsAppDashboard}
                className="shadow-md bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Share via WhatsApp
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Paper Container */}
        <div className="shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5">
          <div ref={printableContentRef}>
            <InvoiceView order={order} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoicePage;
