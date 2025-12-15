// Utility functions for sending notifications to customers via Supabase
// This enables admin to send notifications that appear in customer portal

import { supabase } from '@/lib/supabaseClient';

export type NotificationType = 'order_update' | 'payment_received' | 'quote_ready' | 'delivery_update' | 'message' | 'system_alert';

export interface SendNotificationParams {
  userId: string;  // Customer's Supabase UUID
  type: NotificationType;
  title: string;
  message: string;
  linkTo?: string;
}

/**
 * Send a notification to a customer via Supabase
 * This will appear in the customer portal's notification bell
 * and trigger a browser push notification if enabled
 */
export async function sendCustomerNotification({
  userId,
  type,
  title,
  message,
  linkTo
}: SendNotificationParams): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link_to: linkTo,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('[sendCustomerNotification] Error:', error);
      return { success: false, error: error.message };
    }

    console.log('[sendCustomerNotification] Notification sent:', result);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[sendCustomerNotification] Unexpected error:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Send notification to multiple customers
 */
export async function sendBulkNotification(
  userIds: string[],
  notification: Omit<SendNotificationParams, 'userId'>
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendCustomerNotification({ ...notification, userId });
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
}

/**
 * Send order update notification
 */
export async function sendOrderUpdateNotification(
  customerId: string,
  orderId: number,
  status: string,
  additionalMessage?: string
): Promise<{ success: boolean; error?: string }> {
  return sendCustomerNotification({
    userId: customerId,
    type: 'order_update',
    title: `Order #${orderId} Update`,
    message: additionalMessage || `Your order status has been updated to: ${status}`,
    linkTo: '/customer-portal/orders'
  });
}

/**
 * Send payment received notification
 */
export async function sendPaymentNotification(
  customerId: string,
  orderId: number,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  return sendCustomerNotification({
    userId: customerId,
    type: 'payment_received',
    title: 'Payment Received',
    message: `Thank you! Your payment of ₹${amount.toLocaleString('en-IN')} for Order #${orderId} has been received.`,
    linkTo: '/customer-portal/orders'
  });
}

/**
 * Send quote ready notification
 */
export async function sendQuoteNotification(
  customerId: string,
  orderId: number,
  totalAmount: number
): Promise<{ success: boolean; error?: string }> {
  return sendCustomerNotification({
    userId: customerId,
    type: 'quote_ready',
    title: 'Quote Ready for Review',
    message: `A quote of ₹${totalAmount.toLocaleString('en-IN')} is ready for your Order #${orderId}. Please review and respond.`,
    linkTo: '/customer-portal/orders'
  });
}

/**
 * Send custom message notification
 */
export async function sendMessageNotification(
  customerId: string,
  title: string,
  message: string,
  linkTo?: string
): Promise<{ success: boolean; error?: string }> {
  return sendCustomerNotification({
    userId: customerId,
    type: 'message',
    title,
    message,
    linkTo
  });
}
