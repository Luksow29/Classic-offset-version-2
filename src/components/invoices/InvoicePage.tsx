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
  customer: {
    name: string;
    phone: string;
    address: string | null;
  } | null;
}

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const printableContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printableContentRef.current,
    documentTitle: `Invoice #${order?.id || id}`,
    onBeforeGetContent: () => new Promise<void>((resolve) => setTimeout(resolve, 250)),
    pageStyle: `@media print { body { -webkit-print-color-adjust: exact; } @page { size: A4; margin: 20mm; } }`,
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
        const { data, error: viewError } = await supabase
          .from('all_order_summary')
          .select('order_id, order_date, total_amount, amount_paid, balance_due, customer_id, customer_name, customer_phone')
          .eq('order_id', id)
          .single(); 

        if (viewError) throw viewError;
        if (!data) throw new Error(`இன்வாய்ஸ் #${id} கிடைக்கவில்லை.`);

        setOrder({
          id: data.order_id,
          date: data.order_date,
          total_amount: data.total_amount,
          paid: data.amount_paid,
          balance: data.balance_due,
          customer_id: data.customer_id,
          customer: {
            name: data.customer_name || 'தெரியாத வாடிக்கையாளர்',
            phone: data.customer_phone || '',
            address: null, // This can be fetched from customers table if needed
          },
        });

      } catch (err: any) {
        console.error("இன்வாய்ஸ் தரவைப் பெறுவதில் பிழை:", err);
        setError(err.message || 'இன்வாய்ஸ் தரவை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <Link to="/invoices" className="text-sm text-primary-600 hover:underline flex items-center mb-1">
            <ArrowLeft className="w-4 h-4 mr-1" />
            அனைத்து இன்வாய்ஸ்களுக்கும் திரும்புக
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">🧾 இன்வாய்ஸ் #{order.id}</h1>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button onClick={handlePrint} variant="secondary" className="w-1/2 sm:w-auto flex-1 sm:flex-none">
            <Printer className="w-4 h-4 mr-2" />
            அச்சிடு / பதிவிறக்கு
          </Button>
          <Button 
            variant="success" 
            className="w-1/2 sm:w-auto flex-1 sm:flex-none" 
            onClick={handleGoToWhatsAppDashboard}
            disabled={!order.customer?.phone}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>
      
      <div ref={printableContentRef} className="bg-white rounded-lg shadow-md p-2 sm:p-4">
        <InvoiceView order={order} />
      </div>
    </div>
  );
};

export default InvoicePage;
