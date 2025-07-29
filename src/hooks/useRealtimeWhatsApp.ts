// src/hooks/useRealtimeWhatsApp.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface WhatsAppLog {
  id: number;
  customer_id: string;
  customer_name: string;
  phone: string;
  message: string;
  template_name: string;
  sent_by: string;
  sent_at: string;
}

export const useRealtimeWhatsApp = (onMessageSent?: (log: WhatsAppLog) => void) => {
  const [recentMessages, setRecentMessages] = useState<WhatsAppLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_log'
        },
        (payload) => {
          console.log('📱 WhatsApp message sent:', payload);
          
          const log = payload.new as WhatsAppLog;
          
          // Add to recent messages
          setRecentMessages(prev => [log, ...prev.slice(0, 9)]); // Keep last 10
          
          // Show notification
          toast.success(
            `📱 WhatsApp sent to ${log.customer_name}`,
            { 
              duration: 3000,
              position: 'bottom-right'
            }
          );
          
          // Call optional callback
          onMessageSent?.(log);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onMessageSent]);

  return {
    recentMessages,
    isConnected
  };
};
