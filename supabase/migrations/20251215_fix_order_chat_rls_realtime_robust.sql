-- =============================================================
-- ROBUST ORDER CHAT RLS POLICIES + REALTIME
-- - Case-insensitive role checks
-- - Avoid uuid cast pitfalls by comparing as text
--
-- Run in Supabase SQL Editor (or via `supabase db push`)
-- =============================================================

-- =====================================================
-- 1. ENABLE REALTIME FOR ORDER CHAT TABLES
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_chat_messages;
    RAISE NOTICE '✅ Added order_chat_messages to realtime publication';
  ELSE
    RAISE NOTICE '✓ order_chat_messages already in realtime publication';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_chat_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_chat_threads;
    RAISE NOTICE '✅ Added order_chat_threads to realtime publication';
  ELSE
    RAISE NOTICE '✓ order_chat_threads already in realtime publication';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.order_chat_threads REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.order_chat_messages REPLICA IDENTITY FULL;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================
ALTER TABLE IF EXISTS public.order_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_chat_messages ENABLE ROW LEVEL SECURITY;

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
    WHERE schemaname = 'public' AND tablename = 'order_chat_threads'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_chat_threads', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_chat_messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_chat_messages', pol.policyname);
  END LOOP;
END $$;

-- Helper admin check inline:
--   EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND lower(coalesce(u.role,'')) IN (...))

-- =====================================================
-- 4. CREATE NEW POLICIES
-- =====================================================

-- THREADS: SELECT
CREATE POLICY "order_chat_threads_select" ON public.order_chat_threads
FOR SELECT TO authenticated
USING (
  customer_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- THREADS: INSERT
CREATE POLICY "order_chat_threads_insert" ON public.order_chat_threads
FOR INSERT TO authenticated
WITH CHECK (
  customer_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- THREADS: UPDATE
CREATE POLICY "order_chat_threads_update" ON public.order_chat_threads
FOR UPDATE TO authenticated
USING (
  customer_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
)
WITH CHECK (
  customer_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
      AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
  )
);

-- MESSAGES: SELECT
CREATE POLICY "order_chat_messages_select" ON public.order_chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_chat_threads t
    WHERE t.id = order_chat_messages.thread_id
      AND (
        t.customer_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.id::text = auth.uid()::text
            AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
        )
      )
  )
);

-- MESSAGES: INSERT
CREATE POLICY "order_chat_messages_insert" ON public.order_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id::text = auth.uid()::text
  AND (
    (
      sender_type = 'customer'
      AND EXISTS (
        SELECT 1
        FROM public.order_chat_threads t
        WHERE t.id = order_chat_messages.thread_id
          AND t.customer_id::text = auth.uid()::text
      )
    )
    OR (
      sender_type IN ('admin', 'system')
      AND EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id::text = auth.uid()::text
          AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
      )
    )
  )
);

-- MESSAGES: UPDATE (read receipts)
CREATE POLICY "order_chat_messages_update" ON public.order_chat_messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_chat_threads t
    WHERE t.id = order_chat_messages.thread_id
      AND (
        t.customer_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.id::text = auth.uid()::text
            AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_chat_threads t
    WHERE t.id = order_chat_messages.thread_id
      AND (
        t.customer_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.id::text = auth.uid()::text
            AND lower(coalesce(u.role, '')) IN ('owner', 'manager', 'staff', 'admin')
        )
      )
  )
);

RAISE NOTICE '✅ Order chat realtime + robust RLS updated successfully!';

