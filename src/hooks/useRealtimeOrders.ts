// src/hooks/useRealtimeOrders.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface OrderStatusUpdate {
  order_id: number;
  status: string;
  updated_by: string;
  updated_at: string;
}

export const useRealtimeOrders = (onOrderUpdate?: (update: OrderStatusUpdate) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create a channel for order status updates
    const channel = supabase
      .channel('order_status_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_log'
        },
        (payload) => {
          console.log('📦 Real-time order status update:', payload);
          
          const update = payload.new as OrderStatusUpdate;
          
          // Show toast notification
          toast.success(
            `Order #${update.order_id} updated to "${update.status}" by ${update.updated_by}`,
            { duration: 4000 }
          );
          
          // Call optional callback
          onOrderUpdate?.(update);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        console.log('✅ Connected to order status realtime');
      })
      .on('presence', { event: 'leave' }, () => {
        setIsConnected(false);
        console.log('❌ Disconnected from order status realtime');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrderUpdate]);

  return { isConnected };
};
