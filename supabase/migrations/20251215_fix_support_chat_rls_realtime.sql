-- =============================================================
-- FIX SUPPORT CHAT RLS POLICIES + ENABLE REALTIME
-- - Ensures customers + staff can read/write support chat
-- - Enables realtime for live chat updates
--
-- Run in Supabase SQL Editor (or via `supabase db push`)
-- =============================================================

-- =====================================================
-- 1. ENABLE REALTIME FOR SUPPORT CHAT TABLES
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    RAISE NOTICE '✅ Added support_tickets to realtime publication';
  ELSE
    RAISE NOTICE '✓ support_tickets already in realtime publication';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
    RAISE NOTICE '✅ Added support_messages to realtime publication';
  ELSE
    RAISE NOTICE '✓ support_messages already in realtime publication';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.support_messages REPLICA IDENTITY FULL;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. DROP EXISTING POLICIES (CLEAN SLATE)
-- =====================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_tickets', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_messages', pol.policyname);
  END LOOP;
END $$;

-- =====================================================
-- 4. CREATE NEW RLS POLICIES
--    Admin roles: Owner / Manager / Staff / admin
-- =====================================================

-- SUPPORT_TICKETS: SELECT
CREATE POLICY "support_tickets_select" ON public.support_tickets
FOR SELECT TO authenticated
USING (
  -- Customer can see their own tickets (support_tickets.customer_id -> customers.id -> customers.user_id == auth.uid)
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = support_tickets.customer_id
      AND c.user_id::text = auth.uid()::text
  )
  OR
  -- Staff/admin can see all tickets
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- SUPPORT_TICKETS: INSERT
CREATE POLICY "support_tickets_insert" ON public.support_tickets
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = support_tickets.customer_id
      AND c.user_id::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- SUPPORT_TICKETS: UPDATE
CREATE POLICY "support_tickets_update" ON public.support_tickets
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = support_tickets.customer_id
      AND c.user_id::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = support_tickets.customer_id
      AND c.user_id::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- SUPPORT_MESSAGES: SELECT (messages from accessible tickets)
CREATE POLICY "support_messages_select" ON public.support_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.customers c ON c.id = t.customer_id
    WHERE t.id = support_messages.ticket_id
      AND c.user_id::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- SUPPORT_MESSAGES: INSERT
-- - Customers can only send as `customer` and must use their customer.id as sender_id
-- - Staff can only send as `admin`/`system` and must use auth.uid() as sender_id
CREATE POLICY "support_messages_insert" ON public.support_messages
FOR INSERT TO authenticated
WITH CHECK (
  (
    sender_type = 'customer'
    AND EXISTS (
      SELECT 1
      FROM public.support_tickets t
      JOIN public.customers c ON c.id = t.customer_id
      WHERE t.id = support_messages.ticket_id
        AND t.customer_id::text = support_messages.sender_id::text
        AND c.user_id::text = auth.uid()::text
    )
  )
  OR
  (
    sender_type IN ('admin', 'system')
    AND support_messages.sender_id::text = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id::text = auth.uid()::text
        AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
    )
  )
);

-- SUPPORT_MESSAGES: UPDATE (read receipts)
CREATE POLICY "support_messages_update" ON public.support_messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.customers c ON c.id = t.customer_id
    WHERE t.id = support_messages.ticket_id
      AND c.user_id::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.customers c ON c.id = t.customer_id
    WHERE t.id = support_messages.ticket_id
      AND c.user_id::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

RAISE NOTICE '✅ Support chat realtime + RLS updated successfully!';

