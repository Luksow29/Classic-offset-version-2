-- =============================================================
-- FIX NOTIFICATIONS FOR CUSTOMER PORTAL
-- This enables realtime and proper RLS for the notifications table
-- Run in Supabase SQL Editor
-- =============================================================

-- =====================================================
-- 1. CREATE NOTIFICATIONS TABLE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'system_alert',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB DEFAULT '{}'
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

COMMENT ON TABLE public.notifications IS 'Customer notifications from admin and system';

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- 3. CREATE RLS POLICIES
-- =====================================================

-- SELECT: Users can see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- INSERT: Admins can insert notifications for any user
CREATE POLICY "notifications_insert_admin" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
    OR user_id = auth.uid() -- Users can also create for themselves (system)
);

-- UPDATE: Users can mark their own notifications as read
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 4. ENABLE REALTIME
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

-- Set REPLICA IDENTITY for realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- =====================================================
-- 5. CREATE FUNCTION TO SEND NOTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_customer_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link_to TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link_to, data, is_read, created_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_link_to, p_data, FALSE, NOW())
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_customer_notification TO authenticated;

-- =====================================================
-- 6. CREATE TRIGGER FOR ORDER STATUS CHANGES
-- =====================================================

-- Function to notify customer when order status changes
CREATE OR REPLACE FUNCTION notify_customer_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    customer_uuid UUID;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get customer's user_id (UUID) through the customers table
    SELECT c.user_id INTO customer_uuid
    FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
    WHERE o.id = NEW.order_id;
    
    IF customer_uuid IS NOT NULL THEN
        notification_title := 'Order #' || NEW.order_id || ' Update';
        notification_message := 'Your order status has been updated to: ' || NEW.status;
        
        -- Insert notification
        INSERT INTO public.notifications (user_id, type, title, message, link_to)
        VALUES (
            customer_uuid,
            'order_update',
            notification_title,
            notification_message,
            '/customer-portal/orders'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_notify_customer_order_status ON public.order_status_log;

CREATE TRIGGER trigger_notify_customer_order_status
    AFTER INSERT ON public.order_status_log
    FOR EACH ROW
    EXECUTE FUNCTION notify_customer_on_order_status_change();

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

DO $$
DECLARE
    realtime_ok BOOLEAN;
    policy_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) INTO realtime_ok;
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications';
    
    RAISE NOTICE '';
    RAISE NOTICE '=============== VERIFICATION ===============';
    RAISE NOTICE 'Realtime enabled: %', realtime_ok;
    RAISE NOTICE 'RLS policies count: %', policy_count;
    RAISE NOTICE '=============================================';
    
    IF realtime_ok AND policy_count >= 4 THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED!';
    ELSE
        RAISE WARNING '⚠️ Some checks may have failed.';
    END IF;
END $$;
