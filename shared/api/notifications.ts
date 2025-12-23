// shared/api/notifications.ts
// Shared notification utilities for both Main App and Customer Portal

import { getSupabase, getSupabaseUrl } from './supabaseClient';
import type { NotificationType, Notification, NotificationInsert, Json } from '../types';

/**
 * Parameters for sending a notification
 */
export interface SendNotificationParams {
  /** Target user's Supabase Auth UUID */
  userId: string;
  /** Type of notification */
  type: NotificationType | string;
  /** Notification title */
  title: string;
  /** Notification message body */
  message: string;
  /** Optional link for navigation when notification is clicked */
  linkTo?: string;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of sending a notification
 */
export interface SendNotificationResult {
  success: boolean;
  id?: number;
  error?: string;
}

/**
 * Get the notification category based on type
 */
function getNotificationCategory(type: NotificationType | string): string {
  switch (type) {
    case 'order_update':
    case 'quote_ready':
    case 'delivery_update':
      return 'orders';
    case 'payment_received':
      return 'payments';
    case 'system_alert':
      return 'system';
    case 'message':
    case 'support_message':
    case 'order_chat_message':
      return 'messages';
    default:
      return 'orders';
  }
}

/**
 * Send a notification to a user
 * This creates an in-app notification and optionally triggers a push notification
 * 
 * @example
 * ```typescript
 * const result = await sendNotification({
 *   userId: 'customer-uuid',
 *   type: 'order_update',
 *   title: 'Order #123 Updated',
 *   message: 'Your order status has been updated to: In Progress',
 *   linkTo: '/customer-portal/orders'
 * });
 * ```
 */
export async function sendNotification(params: SendNotificationParams): Promise<SendNotificationResult> {
  const supabase = getSupabase();
  
  try {
    // 1. Insert into database (In-App Notification)
    const notificationData: NotificationInsert = {
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link_to: params.linkTo || null,
      is_read: false,
      metadata: (params.metadata as Json) || null,
    };

    const { data: result, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select('id')
      .single();

    if (error) {
      console.error('[sendNotification] Database error:', error);
      return { success: false, error: error.message };
    }

    console.log('[sendNotification] In-app notification created:', result);

    // 2. Trigger Push Notification via Edge Function (fire and forget)
    triggerPushNotification(params, result.id).catch(err => {
      console.warn('[sendNotification] Push notification failed (non-blocking):', err);
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('[sendNotification] Unexpected error:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Trigger push notification via Supabase Edge Function
 * This is called internally by sendNotification
 */
async function triggerPushNotification(
  params: SendNotificationParams,
  notificationId: number
): Promise<void> {
  const supabase = getSupabase();
  const supabaseUrl = getSupabaseUrl();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.log('[triggerPushNotification] No session, skipping push');
      return;
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/push-notifications/send-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: params.userId,
          title: params.title,
          body: params.message,
          category: getNotificationCategory(params.type),
          data: {
            url: params.linkTo || '/customer-portal',
            notificationId,
          },
        }),
      }
    );

    const data = await response.json();
    console.log('[triggerPushNotification] Push result:', data);
  } catch (error) {
    // Don't throw - push notification failure shouldn't break the flow
    console.error('[triggerPushNotification] Error:', error);
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  notification: Omit<SendNotificationParams, 'userId'>
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendNotification({ ...notification, userId });
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
}

// ============================================
// Convenience functions for common notification types
// ============================================

/**
 * Send an order update notification
 */
export async function sendOrderUpdateNotification(
  customerId: string,
  orderId: number,
  status: string,
  additionalMessage?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    userId: customerId,
    type: 'order_update',
    title: `Order #${orderId} Update`,
    message: additionalMessage || `Your order status has been updated to: ${status}`,
    linkTo: '/customer-portal/orders',
    metadata: { orderId, status },
  });
}

/**
 * Send a payment received notification
 */
export async function sendPaymentNotification(
  customerId: string,
  orderId: number,
  amount: number
): Promise<SendNotificationResult> {
  return sendNotification({
    userId: customerId,
    type: 'payment_received',
    title: 'Payment Received',
    message: `Thank you! Your payment of ₹${amount.toLocaleString('en-IN')} for Order #${orderId} has been received.`,
    linkTo: '/customer-portal/orders',
    metadata: { orderId, amount },
  });
}

/**
 * Send a quote ready notification
 */
export async function sendQuoteNotification(
  customerId: string,
  orderId: number,
  totalAmount: number
): Promise<SendNotificationResult> {
  return sendNotification({
    userId: customerId,
    type: 'quote_ready',
    title: 'Quote Ready for Review',
    message: `A quote of ₹${totalAmount.toLocaleString('en-IN')} is ready for your Order #${orderId}. Please review and respond.`,
    linkTo: '/customer-portal/requests',
    metadata: { orderId, totalAmount },
  });
}

/**
 * Send a delivery update notification
 */
export async function sendDeliveryNotification(
  customerId: string,
  orderId: number,
  deliveryDate: string
): Promise<SendNotificationResult> {
  return sendNotification({
    userId: customerId,
    type: 'delivery_update',
    title: 'Delivery Update',
    message: `Your Order #${orderId} is scheduled for delivery on ${deliveryDate}.`,
    linkTo: '/customer-portal/orders',
    metadata: { orderId, deliveryDate },
  });
}

/**
 * Send a custom message notification
 */
export async function sendMessageNotification(
  customerId: string,
  title: string,
  message: string,
  linkTo?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    userId: customerId,
    type: 'message',
    title,
    message,
    linkTo,
  });
}

// ============================================
// Query functions for notifications
// ============================================

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<{ data: Notification[] | null; error: string | null }> {
  const supabase = getSupabase();
  const { limit = 50, unreadOnly = false } = options;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Notification[], error: null };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[getUnreadCount] Error:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[markAsRead] Error:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[markAllAsRead] Error:', error);
    return false;
  }

  return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('[deleteNotification] Error:', error);
    return false;
  }

  return true;
}
