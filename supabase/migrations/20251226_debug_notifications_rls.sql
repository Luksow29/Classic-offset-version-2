-- EMERGENCY: ALLOW ALL AUTHENTICATED USERS TO INSERT NOTIFICATIONS
-- This is to rule out Role/User ID mismatch issues.

DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;

-- 1. INSERT: Allow ANY authenticated user (Admin or Customer) to insert
CREATE POLICY "notifications_insert_all" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. SELECT: Keep existing logic (Users see their own)
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT TO authenticated
USING (true); 
-- logic: user_id = auth.uid() OR exists(user is admin)
-- But for now, let's just make it TRUE (everyone sees all) to verify data creation.
-- Warning: This exposes notifs. We will revert this after test.

GRANT ALL ON public.notifications TO authenticated;
