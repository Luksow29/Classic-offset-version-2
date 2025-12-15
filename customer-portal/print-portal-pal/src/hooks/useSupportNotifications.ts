/**
 * Global hook to listen for support chat messages and show notifications
 * This runs app-wide so notifications appear even when not on the support page
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export const useSupportNotifications = (customerId: string | null) => {
  const { toast } = useToast();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!customerId || subscribedRef.current) return;

    console.log('[SupportNotifications] Setting up global subscription for customer:', customerId);
    subscribedRef.current = true;

    const channel = supabase
      .channel(`support_notifications_${customerId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        async (payload) => {
          const newMessage = payload.new as SupportMessage;
          console.log('[SupportNotifications] New message:', newMessage);
          
          // Only show notifications for admin messages
          if (newMessage.sender_type !== 'admin') return;
          
          // Check if this ticket belongs to the customer
          const { data: ticket } = await supabase
            .from('support_tickets')
            .select('id, customer_id')
            .eq('id', newMessage.ticket_id)
            .single();
          
          if (!ticket || ticket.customer_id !== customerId) {
            console.log('[SupportNotifications] Message not for this customer');
            return;
          }
          
          console.log('[SupportNotifications] Showing notification');
          
          // Show toast notification
          toast({
            title: "📩 New Support Message",
            description: newMessage.message.substring(0, 100) + (newMessage.message.length > 100 ? '...' : ''),
            duration: 8000,
          });
          
          // Show browser push notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('New Support Message', {
                body: newMessage.message.substring(0, 100),
                icon: '/icons/icon-192x192.png',
                tag: `support-notif-${newMessage.id}`,
              });
            } catch (e) {
              console.error('[SupportNotifications] Browser notification error:', e);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[SupportNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[SupportNotifications] Cleaning up subscription');
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [customerId, toast]);
};
