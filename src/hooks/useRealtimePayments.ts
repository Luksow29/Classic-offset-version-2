// src/hooks/useRealtimePayments.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface PaymentUpdate {
  id: string;
  order_id: number;
  customer_name?: string;
  amount_paid: number;
  payment_method: string;
  created_at: string;
}

export const useRealtimePayments = (onPaymentReceived?: (payment: PaymentUpdate) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('payment_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments'
        },
        async (payload) => {
          console.log('💰 New payment received:', payload);
          
          const payment = payload.new as PaymentUpdate;
          
          // Fetch customer name if not included
          let customerName = payment.customer_name;
          if (!customerName && payment.order_id) {
            const { data: orderData } = await supabase
              .from('orders')
              .select('customers(name)')
              .eq('id', payment.order_id)
              .single();
            
            customerName = (orderData?.customers as any)?.name || 'Unknown Customer';
          }
          
          // Show success notification
          toast.success(
            `💰 ₹${payment.amount_paid.toLocaleString('en-IN')} payment received from ${customerName}`,
            { 
              duration: 5000,
              icon: '💰'
            }
          );
          
          // Call optional callback
          onPaymentReceived?.({
            ...payment,
            customer_name: customerName
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('💰 Payment updated:', payload);
          toast('Payment record updated', { duration: 3000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onPaymentReceived]);

  return { isConnected };
};
