-- Remove legacy triggers found in step8_create_notification_triggers.sql
-- These triggers were writing to 'notifications' table for Admins, causing "Leakage" and duplication
-- because the new system uses 'admin_notifications' table.

DROP TRIGGER IF EXISTS trigger_notify_new_order_request ON public.order_requests;
DROP FUNCTION IF EXISTS public.notify_new_order_request();

DROP TRIGGER IF EXISTS trigger_notify_new_order_created ON public.orders;
DROP FUNCTION IF EXISTS public.notify_new_order_created();

DROP TRIGGER IF EXISTS trigger_notify_payment_received ON public.payments;
DROP FUNCTION IF EXISTS public.notify_payment_received();

DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON public.order_status_log;
DROP FUNCTION IF EXISTS public.notify_order_status_change();

DROP TRIGGER IF EXISTS trigger_notify_payment_status_change ON public.payments;
DROP FUNCTION IF EXISTS public.notify_payment_status_change();

-- Note: We keep the triggers from '20251215_fix_customer_notifications_triggers.sql' 
-- if they are distinctly named (they seem to be).
-- Check conflicts: 
-- 20251215 uses 'trigger_notify_customer_order_status' - OK
-- 20251215 uses 'trigger_notify_customer_payment' - OK

-- This ensures that only the NEW logic (Admin Notifications Table + Client Listener) controls Admin alerts.
