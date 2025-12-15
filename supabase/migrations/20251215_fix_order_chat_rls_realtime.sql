-- Fix Order Chat RLS Policies and Enable Realtime
-- Run this in Supabase SQL Editor (or via `supabase db push`)

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
        RAISE NOTICE 'Added order_chat_messages to realtime publication';
    ELSE
        RAISE NOTICE 'order_chat_messages already in realtime publication';
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
        RAISE NOTICE 'Added order_chat_threads to realtime publication';
    ELSE
        RAISE NOTICE 'order_chat_threads already in realtime publication';
    END IF;
END $$;

-- =====================================================
-- 2. ENABLE RLS (IF NOT ALREADY)
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
        WHERE schemaname = 'public'
          AND tablename = 'order_chat_threads'
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
        WHERE schemaname = 'public'
          AND tablename = 'order_chat_messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_chat_messages', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- 4. CREATE NEW RLS POLICIES
--    Roles in this project: Owner / Manager / Staff
-- =====================================================

-- THREADS: Customer sees own threads, Staff can see all
CREATE POLICY "order_chat_threads_select" ON public.order_chat_threads
FOR SELECT TO authenticated
USING (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
);

-- THREADS: Customer can create their own threads; Staff can create threads if needed
CREATE POLICY "order_chat_threads_insert" ON public.order_chat_threads
FOR INSERT TO authenticated
WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
);

-- THREADS: Customer can update their threads; Staff can update any thread (e.g., status)
CREATE POLICY "order_chat_threads_update" ON public.order_chat_threads
FOR UPDATE TO authenticated
USING (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
)
WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
);

-- MESSAGES: Select messages from visible threads
CREATE POLICY "order_chat_messages_select" ON public.order_chat_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.order_chat_threads t
        WHERE t.id = order_chat_messages.thread_id
          AND (
              t.customer_id = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.users u
                  WHERE u.id::uuid = auth.uid()
                    AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
              )
          )
    )
);

-- MESSAGES: Insert messages into visible threads
-- - Customers can only send as `customer` in their own threads
-- - Staff can only send as `admin` (or `system`) in any thread
CREATE POLICY "order_chat_messages_insert" ON public.order_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND (
        (
            sender_type = 'customer'
            AND EXISTS (
                SELECT 1
                FROM public.order_chat_threads t
                WHERE t.id = order_chat_messages.thread_id
                  AND t.customer_id = auth.uid()
            )
        )
        OR (
            sender_type IN ('admin', 'system')
            AND EXISTS (
                SELECT 1
                FROM public.users u
                WHERE u.id::uuid = auth.uid()
                  AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
            )
        )
    )
);

-- MESSAGES: Allow participants to update messages in visible threads (read receipts)
CREATE POLICY "order_chat_messages_update" ON public.order_chat_messages
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.order_chat_threads t
        WHERE t.id = order_chat_messages.thread_id
          AND (
              t.customer_id = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.users u
                  WHERE u.id::uuid = auth.uid()
                    AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
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
              t.customer_id = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.users u
                  WHERE u.id::uuid = auth.uid()
                    AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
              )
          )
    )
);

-- =====================================================
-- 5. VERIFY REALTIME + POLICIES (OPTIONAL)
-- =====================================================

SELECT 'Tables in supabase_realtime publication:' as info;
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY schemaname, tablename;

SELECT 'Order chat policies:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('order_chat_threads', 'order_chat_messages')
ORDER BY tablename, policyname;

RAISE NOTICE 'Order chat realtime + RLS updated successfully!';
