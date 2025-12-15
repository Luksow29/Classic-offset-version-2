import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';

import { supabase } from '@/lib/supabaseClient';
import { db } from '@/lib/firebaseClient';
import { useUser } from '@/context/UserContext';

type AdminNotificationType = 'support_message' | 'order_chat_message' | 'order_request';

type AdminNotificationDoc = {
  type: AdminNotificationType;
  title?: string;
  message: string;
  route?: string;
  relatedId?: string | number;
  triggeredBy?: string;
  timestamp: unknown;
  read: boolean;
};

const ADMIN_ROLES = new Set(['Owner', 'Manager', 'Staff', 'admin']);
const TOAST_NOTIFICATION_TYPES = new Set<AdminNotificationType>(['support_message', 'order_chat_message', 'order_request']);

const truncate = (value: string, maxLen = 80) => {
  const text = value.trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
};

const createNotificationOnce = async (docId: string, data: Omit<AdminNotificationDoc, 'timestamp' | 'read'>) => {
  const ref = doc(db, 'notifications', docId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return false;
    tx.set(ref, { ...data, timestamp: serverTimestamp(), read: false } satisfies AdminNotificationDoc);
    return true;
  });
};

export const useAdminInAppNotifications = () => {
  const { user, userProfile } = useUser();
  const location = useLocation();
  const locationRef = useRef({ pathname: location.pathname, search: location.search });
  const isFirestoreListenerReadyRef = useRef(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    locationRef.current = { pathname: location.pathname, search: location.search };
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user || !userProfile?.role || !ADMIN_ROLES.has(userProfile.role)) return;

    const notificationsQuery = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      if (!isFirestoreListenerReadyRef.current) {
        snapshot.docs.forEach((d) => seenNotificationIdsRef.current.add(d.id));
        isFirestoreListenerReadyRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;

        const id = change.doc.id;
        if (seenNotificationIdsRef.current.has(id)) return;
        seenNotificationIdsRef.current.add(id);

        const data = change.doc.data() as Partial<AdminNotificationDoc> | undefined;
        const type = data?.type as AdminNotificationType | undefined;
        if (!type || !TOAST_NOTIFICATION_TYPES.has(type)) return;

        const title = typeof data?.title === 'string' ? data.title : null;
        const message = typeof data?.message === 'string' ? data.message : 'New notification';
        const toastText = title ? `${title} — ${message}` : message;

        if (type === 'order_request') {
          toast.success(truncate(toastText, 140), { duration: 6000, position: 'top-center' });
        } else {
          toast(truncate(toastText, 140), { duration: 6000, position: 'top-center' });
        }
      });
    });

    const supportChannel = supabase
      .channel('admin_support_in_app_notifications')
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
            console.warn('Failed to fetch support ticket summary for notification:', err);
          }

          const preview = truncate(row.message, 100);
          const title = `Support: ${customerName}`;
          const message = subject ? `${subject} — ${preview}` : preview;
          const docId = `support_messages_${row.id}`;

          try {
            await createNotificationOnce(docId, {
              type: 'support_message',
              title,
              message,
              route: '/customer-support',
              relatedId: row.ticket_id,
              triggeredBy: customerName,
            });
          } catch (err) {
            console.error('Failed to create support notification:', err);
          }
        }
      )
      .subscribe();

    const orderChatChannel = supabase
      .channel('admin_order_chat_in_app_notifications')
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
          let relatedId: string | number | undefined;

          try {
            const { data } = await supabase
              .from('order_chat_threads')
              .select('order_id')
              .eq('id', row.thread_id)
              .maybeSingle();
            const orderId = (data as any)?.order_id as number | undefined;
            if (orderId) {
              title = `Order Chat: Order #${orderId}`;
              relatedId = orderId;
            }
          } catch (err) {
            console.warn('Failed to fetch order chat thread for notification:', err);
          }

          const content =
            row.message_type && row.message_type !== 'text' ? 'Sent an attachment' : truncate(row.content || 'New message', 100);
          const docId = `order_chat_messages_${row.id}`;

          try {
            await createNotificationOnce(docId, {
              type: 'order_chat_message',
              title,
              message: content,
              route: '/order-chat-admin',
              relatedId: relatedId ?? row.thread_id,
              triggeredBy: 'Customer',
            });
          } catch (err) {
            console.error('Failed to create order chat notification:', err);
          }
        }
      )
      .subscribe();

    const orderRequestChannel = supabase
      .channel('admin_order_request_in_app_notifications')
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

          try {
            await createNotificationOnce(docId, {
              type: 'order_request',
              title: 'Order Request',
              message,
              route: '/admin/content?tab=order_requests',
              relatedId: row.id,
              triggeredBy: customerName,
            });
          } catch (err) {
            console.error('Failed to create order request notification:', err);
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeNotifications();
      supabase.removeChannel(supportChannel);
      supabase.removeChannel(orderChatChannel);
      supabase.removeChannel(orderRequestChannel);
    };
  }, [user, userProfile?.role]);
};
