-- =============================================================
-- FIX + EXPAND CUSTOMER PORTAL NOTIFICATION TRIGGERS
-- - Order status updates (order_status_log)
-- - Payment confirmations (payments)
-- - New chat messages (order_chat_messages + support_messages)
-- - Delivery notifications (status contains "deliver")
--
-- Run in Supabase SQL Editor (or via `supabase db push`)
-- =============================================================

-- =====================================================
-- 1. ENSURE REALTIME FOR NOTIFICATIONS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE '✅ Added notifications to realtime publication';
  ELSE
    RAISE NOTICE '✓ notifications already in realtime publication';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.notifications REPLICA IDENTITY FULL;

-- =====================================================
-- 2. ORDER STATUS -> CUSTOMER NOTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_customer_on_order_status_log_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_user_id UUID;
  order_customer_id TEXT;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF NEW.order_id IS NULL OR NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  -- Primary mapping: orders.customer_id -> customers.id -> customers.user_id
  SELECT o.customer_id::text, c.user_id
  INTO order_customer_id, customer_user_id
  FROM public.orders o
  LEFT JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = NEW.order_id;

  -- Fallback mapping (some setups store auth user_id directly in orders.customer_id)
  IF customer_user_id IS NULL AND order_customer_id IS NOT NULL THEN
    SELECT c.user_id
    INTO customer_user_id
    FROM public.customers c
    WHERE c.user_id::text = order_customer_id
    LIMIT 1;
  END IF;

  IF customer_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF lower(NEW.status) LIKE '%deliver%' THEN
    notification_type := 'delivery_update';
    notification_title := CASE WHEN lower(NEW.status) = 'delivered' THEN 'Order Delivered ✅' ELSE 'Delivery Update' END;
  ELSE
    notification_type := 'order_update';
    notification_title := 'Order Status Updated';
  END IF;

  notification_message :=
    CASE NEW.status
      WHEN 'Design' THEN 'Great news! Your order is now in the design phase. Our team is working on your project.'
      WHEN 'Printing' THEN 'Excellent! Your order is now being printed. We''ll notify you once it''s ready.'
      WHEN 'Delivered' THEN 'Your order has been delivered successfully! Thank you for choosing Classic Offset!'
      ELSE 'Your order status has been updated to: ' || NEW.status
    END;

  PERFORM public.send_customer_notification(
    customer_user_id,
    notification_type,
    notification_title,
    notification_message,
    '/customer-portal/orders',
    jsonb_build_object(
      'order_id', NEW.order_id,
      'status', NEW.status,
      'updated_by', NEW.updated_by
    )
  );

  RETURN NEW;
END $$;

-- Clean up known legacy triggers to avoid duplicates
DROP TRIGGER IF EXISTS trigger_notify_customer_order_status ON public.order_status_log;
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON public.order_status_log;

CREATE TRIGGER trigger_notify_customer_order_status
AFTER INSERT ON public.order_status_log
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_on_order_status_log_insert();

-- =====================================================
-- 3. PAYMENT INSERT -> CUSTOMER NOTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_customer_on_payment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  order_id_num INTEGER;
BEGIN
  -- Determine customer_user_id (auth user id)
  IF NEW.customer_id IS NOT NULL THEN
    SELECT c.user_id
    INTO customer_user_id
    FROM public.customers c
    WHERE c.id = NEW.customer_id
    LIMIT 1;

    -- Fallback (some setups store auth user_id directly in payments.customer_id)
    IF customer_user_id IS NULL THEN
      SELECT c.user_id
      INTO customer_user_id
      FROM public.customers c
      WHERE c.user_id::text = NEW.customer_id::text
      LIMIT 1;
    END IF;
  END IF;

  IF customer_user_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT c.user_id
    INTO customer_user_id
    FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
    WHERE o.id = NEW.order_id
    LIMIT 1;
  END IF;

  IF customer_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  order_id_num := NEW.order_id;
  notification_title := 'Payment Confirmed ✅';
  notification_message :=
    'Your payment of ₹' || COALESCE(NEW.amount_paid, 0)::text ||
    CASE WHEN order_id_num IS NOT NULL THEN ' for Order #' || order_id_num::text ELSE '' END ||
    ' has been received. Thank you!';

  PERFORM public.send_customer_notification(
    customer_user_id,
    'payment_received',
    notification_title,
    notification_message,
    '/customer-portal/invoices',
    jsonb_build_object(
      'payment_id', NEW.id,
      'order_id', NEW.order_id,
      'amount_paid', NEW.amount_paid,
      'payment_method', NEW.payment_method,
      'status', NEW.status
    )
  );

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_notify_customer_payment ON public.payments;
DROP TRIGGER IF EXISTS trigger_notify_payment_received ON public.payments;

CREATE TRIGGER trigger_notify_customer_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_on_payment_insert();

-- =====================================================
-- 4. ORDER CHAT (ADMIN/SYSTEM MSG) -> CUSTOMER NOTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_customer_on_order_chat_admin_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_user_id UUID;
  order_id_num INTEGER;
  preview TEXT;
BEGIN
  IF NEW.sender_type NOT IN ('admin', 'system') THEN
    RETURN NEW;
  END IF;

  SELECT t.customer_id, t.order_id
  INTO customer_user_id, order_id_num
  FROM public.order_chat_threads t
  WHERE t.id = NEW.thread_id;

  IF customer_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  preview := regexp_replace(COALESCE(NEW.content, ''), '\\s+', ' ', 'g');
  IF length(preview) > 120 THEN
    preview := left(preview, 119) || '…';
  END IF;

  PERFORM public.send_customer_notification(
    customer_user_id,
    'message',
    CASE WHEN order_id_num IS NOT NULL THEN 'New message on Order #' || order_id_num::text ELSE 'New message' END,
    preview,
    '/customer-portal/orders',
    jsonb_build_object(
      'thread_id', NEW.thread_id,
      'order_id', order_id_num,
      'message_id', NEW.id
    )
  );

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_notify_customer_order_chat_message ON public.order_chat_messages;

CREATE TRIGGER trigger_notify_customer_order_chat_message
AFTER INSERT ON public.order_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_on_order_chat_admin_message();

-- =====================================================
-- 5. SUPPORT CHAT (ADMIN/SYSTEM MSG) -> CUSTOMER NOTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_customer_on_support_admin_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_user_id UUID;
  ticket_subject TEXT;
  preview TEXT;
BEGIN
  IF NEW.sender_type NOT IN ('admin', 'system') THEN
    RETURN NEW;
  END IF;

  SELECT c.user_id, COALESCE(t.subject, 'Support')
  INTO customer_user_id, ticket_subject
  FROM public.support_tickets t
  JOIN public.customers c ON c.id = t.customer_id
  WHERE t.id = NEW.ticket_id;

  IF customer_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  preview := regexp_replace(COALESCE(NEW.message, ''), '\\s+', ' ', 'g');
  IF length(preview) > 140 THEN
    preview := left(preview, 139) || '…';
  END IF;

  PERFORM public.send_customer_notification(
    customer_user_id,
    'message',
    'Support reply: ' || ticket_subject,
    preview,
    '/customer-portal/support',
    jsonb_build_object(
      'ticket_id', NEW.ticket_id,
      'message_id', NEW.id
    )
  );

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_notify_customer_support_message ON public.support_messages;

CREATE TRIGGER trigger_notify_customer_support_message
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_on_support_admin_message();

RAISE NOTICE '✅ Customer portal notification triggers updated.';

