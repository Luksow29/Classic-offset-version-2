import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { normalizeStaffRole } from '@/lib/rbac';

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

// Helper to generate deterministic UUID from string (v4-like format)
async function generateDeterministicUUID(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(input));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Format as UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return [
      hashHex.substring(0, 8),
      hashHex.substring(8, 12),
      '4' + hashHex.substring(13, 16),
      ((parseInt(hashHex.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hashHex.substring(18, 20),
      hashHex.substring(20, 32)
  ].join('-');
}

const createNotificationOnce = async (docId: string, data: Omit<AdminNotificationDoc, 'created_at' | 'is_read'>) => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .upsert({
        id: docId,
        ...data,
        is_read: false,
        created_at: new Date().toISOString()
      }, { onConflict: 'id', ignoreDuplicates: true });
      
    if (error) {
      console.warn('Failed to insert admin notification:', error);
      throw error;
    }
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
    const normalizedRole = normalizeStaffRole(userProfile?.role);
    if (!user || !normalizedRole || !ADMIN_ROLES.has(normalizedRole)) return;
    if (hasSubscribedRef.current) return;
    
    hasSubscribedRef.current = true;

    // Listen for NEW admin notifications to show toasts -> MOVED TO CONTEXT
    // const notificationChannel = supabase...

    // Listen for Support Messages -> HANDLED BY DB TRIGGER
    // Listen for Order Chat Messages -> HANDLED BY DB TRIGGER

    // Listen for Order Requests to CREATE notifications
    const orderRequestChannel = supabase
      .channel('admin_order_request_trigger')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_requests',
        },
        async (payload) => {
          // Handle INSERT (New Request)
          if (payload.eventType === 'INSERT') {
            const row = payload.new as { id: number; request_data?: unknown } | null;
            if (!row) return;

            const requestData = (row.request_data || {}) as any;
            const customerName = requestData.customerName || requestData.name || 'Customer';
            const quantity = requestData.quantity ? `x${requestData.quantity}` : '';
            const orderType = requestData.orderType || requestData.printType || 'Order';
            const message = `New order request from ${customerName} ${quantity ? `(${quantity} ${orderType})` : ''}`.trim();
            const docId = await generateDeterministicUUID(`order_requests_${row.id}`);

            await createNotificationOnce(docId, {
              id: docId,
              type: 'order_request',
              title: 'New Order Request',
              message,
              link_to: '/admin/content?tab=order_requests',
              related_id: String(row.id),
              triggered_by: customerName,
            });
          }

          // Handle UPDATE (Quote Accepted/Rejected)
          if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as { id: number; pricing_status?: string; request_data?: unknown };
            const oldRow = payload.old as { id: number; pricing_status?: string };

            // Check if status changed to 'accepted'
            if (newRow.pricing_status === 'accepted' && oldRow.pricing_status !== 'accepted') {
               const requestData = (newRow.request_data || {}) as any;
               const customerName = requestData.customerName || requestData.name || 'Customer';
               const docId = await generateDeterministicUUID(`quote_accepted_${newRow.id}`);

               await createNotificationOnce(docId, {
                 id: docId,
                 type: 'order_request', // Re-using type or add 'quote_accepted' if supported
                 title: 'Quote Accepted',
                 message: `${customerName} accepted the quote for Order #${newRow.id}`,
                 link_to: '/admin/content?tab=order_requests',
                 related_id: String(newRow.id),
                 triggered_by: customerName,
               });
            }
          }
        }
      )
      .subscribe();

    return () => {
      hasSubscribedRef.current = false;
      // supabase.removeChannel(notificationChannel);
      // supabase.removeChannel(supportChannel); // Removed
      // supabase.removeChannel(orderChatChannel); // Removed
      supabase.removeChannel(orderRequestChannel);
    };
  }, [user, userProfile?.role]);
};
