-- FIX NOTIFICATIONS RLS TO ALLOW ADMIN INSERTS
-- This migration updates the RLS policy to be case-insensitive for Admin roles
-- enabling them to insert notifications for ANY user (customers).

-- 1. Drop the existing restrictive policy
DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;

-- 2. Create a new, robust, case-insensitive policy
CREATE POLICY "notifications_insert_admin" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
    -- Allow if user is an Admin/Manager/Staff/Owner/Office/Production/Designer (case-insensitive)
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND lower(u.role) IN ('owner', 'manager', 'staff', 'admin', 'office', 'production', 'designer')
    )
    OR 
    -- Allow users to create notifications for themselves (e.g. system usage or triggers)
    user_id = auth.uid()
);

-- 3. Grant permissions just in case
GRANT INSERT ON public.notifications TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- 4. Verify Realtime is still enabled (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
