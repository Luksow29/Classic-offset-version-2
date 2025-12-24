import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type AdminNotificationType = 'support_message' | 'order_chat_message' | 'order_request';

type AdminNotificationDoc = {
  id: string;
  type: AdminNotificationType;
  title?: string;
  message: string;
  link_to?: string;
  related_id?: string;
  triggered_by?: string;
  created_at: string;
  is_read: boolean;
};

const ADMIN_ROLES = new Set(['owner', 'manager', 'office', 'designer', 'production', 'purchase']);
const TOAST_NOTIFICATION_TYPES = new Set<string>(['support_message', 'order_chat_message', 'order_request']);

const truncate = (value: string, maxLen = 80) => {
  const text = value.trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
};

// Use upsert for deduplication
const createNotificationOnce = async (docId: string, data: Omit<AdminNotificationDoc, 'created_at' | 'is_read'>) => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .upsert({
        id: docId,
        ...data,
        is_read: false,
        created_at: new Date().toISOString()
      }, { onConflict: 'id', ignoreDuplicates: true }); // ignoreDuplicates: true means if exists, do nothing
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Failed to create notification:', err);
    return false;
  }
};

export const useAdminInAppNotifications = () => {
  const { user, userProfile } = useUser();
  const location = useLocation();
  const locationRef = useRef({ pathname: location.pathname, search: location.search });
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    locationRef.current = { pathname: location.pathname, search: location.search };
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user || !userProfile?.role || !ADMIN_ROLES.has(userProfile.role)) return;
    if (hasSubscribedRef.current) return;
    
    hasSubscribedRef.current = true;

    // Listen for NEW admin notifications to show toasts
    const notificationChannel = supabase
      .channel('admin_notifications_listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload: RealtimePostgresChangesPayload<AdminNotificationDoc>) => {
          const data = payload.new as AdminNotificationDoc;
          if (!data || !data.type || !TOAST_NOTIFICATION_TYPES.has(data.type)) return;

          const title = data.title;
          const message = data.message || 'New notification';
          const toastText = title ? `${title} — ${message}` : message;

          if (data.type === 'order_request') {
            toast.success(truncate(toastText, 140), { duration: 6000, position: 'top-center' });
          } else {
            toast(truncate(toastText, 140), { duration: 6000, position: 'top-center' });
          }
        }
      )
      .subscribe();

    // Listen for Support Messages to CREATE notifications
    const supportChannel = supabase
      .channel('admin_support_trigger')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: 'sender_type=eq.customer',
        },
        async (payload) => {
          const row = payload.new as { id: string; ticket_id: string; message: string } | null;
          if (!row) return;

          let customerName = 'Customer';
          let subject = 'Support';

          try {
            const { data } = await supabase
              .from('support_tickets_summary')
              .select('customer_name, subject')
              .eq('id', row.ticket_id)
              .maybeSingle();

            customerName = (data as any)?.customer_name || customerName;
            subject = (data as any)?.subject || subject;
          } catch (err) {
            console.warn('Failed to fetch support ticket summary:', err);
          }

          const preview = truncate(row.message, 100);
          const title = `Support: ${customerName}`;
          const message = subject ? `${subject} — ${preview}` : preview;
          const docId = `support_messages_${row.id}`;

          await createNotificationOnce(docId, {
            id: docId,
            type: 'support_message',
            title,
            message,
            link_to: '/customer-support',
            related_id: row.ticket_id,
            triggered_by: customerName,
          });
        }
      )
      .subscribe();

    // Listen for Order Chat Messages to CREATE notifications
    const orderChatChannel = supabase
      .channel('admin_order_chat_trigger')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
          filter: 'sender_type=eq.customer',
        },
        async (payload) => {
          const row = payload.new as
            | { id: string; thread_id: string; message_type?: string | null; content?: string | null }
            | null;
          if (!row) return;

          let title = 'Order Chat: New message';
          let relatedId: string | undefined;

          try {
            const { data } = await supabase
              .from('order_chat_threads')
              .select('order_id')
              .eq('id', row.thread_id)
              .maybeSingle();
            const orderId = (data as any)?.order_id as number | undefined;
            if (orderId) {
              title = `Order Chat: Order #${orderId}`;
              relatedId = String(orderId);
            }
          } catch (err) {
            console.warn('Fetched order chat thread failed:', err);
          }

          const content =
            row.message_type && row.message_type !== 'text' ? 'Sent an attachment' : truncate(row.content || 'New message', 100);
          const docId = `order_chat_messages_${row.id}`;

          await createNotificationOnce(docId, {
            id: docId,
            type: 'order_chat_message',
            title,
            message: content,
            link_to: '/order-chat-admin',
            related_id: relatedId ?? row.thread_id,
            triggered_by: 'Customer',
          });
        }
      )
      .subscribe();

    // Listen for Order Requests to CREATE notifications
    const orderRequestChannel = supabase
      .channel('admin_order_request_trigger')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_requests',
        },
        async (payload) => {
          const row = payload.new as { id: number; request_data?: unknown } | null;
          if (!row) return;

          const requestData = (row.request_data || {}) as any;
          const customerName = requestData.customerName || requestData.name || 'Customer';
          const quantity = requestData.quantity ? `x${requestData.quantity}` : '';
          const orderType = requestData.orderType || requestData.printType || 'Order';
          const message = `New order request from ${customerName} ${quantity ? `(${quantity} ${orderType})` : ''}`.trim();
          const docId = `order_requests_${row.id}`;

          await createNotificationOnce(docId, {
            id: docId,
            type: 'order_request',
            title: 'Order Request',
            message,
            link_to: '/admin/content?tab=order_requests',
            related_id: String(row.id),
            triggered_by: customerName,
          });
        }
      )
      .subscribe();

    return () => {
      hasSubscribedRef.current = false;
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(supportChannel);
      supabase.removeChannel(orderChatChannel);
      supabase.removeChannel(orderRequestChannel);
    };
  }, [user, userProfile?.role]);
};
