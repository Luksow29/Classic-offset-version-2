-- =============================================================
-- COMPLETE FIX FOR CUSTOMER PORTAL CHAT REALTIME
-- Run this in Supabase SQL Editor
-- =============================================================

-- =====================================================
-- 1. CHECK IF TABLES EXIST
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_chat_threads') THEN
        RAISE EXCEPTION 'order_chat_threads table does not exist. Run the chat setup migration first.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_chat_messages') THEN
        RAISE EXCEPTION 'order_chat_messages table does not exist. Run the chat setup migration first.';
    END IF;
    RAISE NOTICE 'Tables exist. Proceeding with realtime and RLS setup...';
END $$;

-- =====================================================
-- 2. ENABLE REALTIME FOR CHAT TABLES
-- =====================================================

-- Enable realtime for order_chat_messages
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

-- Enable realtime for order_chat_threads
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

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE IF EXISTS public.order_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_chat_messages ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS enabled for both tables';

-- =====================================================
-- 4. DROP ALL EXISTING POLICIES (CLEAN SLATE)
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
        RAISE NOTICE 'Dropped policy: % on order_chat_threads', pol.policyname;
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
        RAISE NOTICE 'Dropped policy: % on order_chat_messages', pol.policyname;
    END LOOP;
END $$;

-- =====================================================
-- 5. CREATE PERMISSIVE RLS POLICIES
-- =====================================================

-- THREADS: SELECT - Customer sees own, Admin sees all
CREATE POLICY "threads_select_policy" ON public.order_chat_threads
FOR SELECT TO authenticated
USING (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
);

-- THREADS: INSERT - Customer creates own, Admin can create any
CREATE POLICY "threads_insert_policy" ON public.order_chat_threads
FOR INSERT TO authenticated
WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
);

-- THREADS: UPDATE - Allow updates for status, last_message_at
CREATE POLICY "threads_update_policy" ON public.order_chat_threads
FOR UPDATE TO authenticated
USING (
    customer_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id::uuid = auth.uid()
          AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
    )
);

RAISE NOTICE '✅ Created thread policies';

-- MESSAGES: SELECT - See messages from threads you have access to
CREATE POLICY "messages_select_policy" ON public.order_chat_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.order_chat_threads t
        WHERE t.id = order_chat_messages.thread_id
          AND (
              t.customer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users u
                  WHERE u.id::uuid = auth.uid()
                    AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
              )
          )
    )
);

-- MESSAGES: INSERT - Customer sends as 'customer', Admin sends as 'admin'
CREATE POLICY "messages_insert_policy" ON public.order_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND (
        -- Customer inserting into their own thread
        (
            sender_type = 'customer'
            AND EXISTS (
                SELECT 1 FROM public.order_chat_threads t
                WHERE t.id = order_chat_messages.thread_id
                  AND t.customer_id = auth.uid()
            )
        )
        OR
        -- Admin/Staff inserting into any thread
        (
            sender_type IN ('admin', 'system')
            AND EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id::uuid = auth.uid()
                  AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
            )
        )
    )
);

-- MESSAGES: UPDATE - For read receipts
CREATE POLICY "messages_update_policy" ON public.order_chat_messages
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.order_chat_threads t
        WHERE t.id = order_chat_messages.thread_id
          AND (
              t.customer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users u
                  WHERE u.id::uuid = auth.uid()
                    AND u.role IN ('Owner', 'Manager', 'Staff', 'admin')
              )
          )
    )
);

RAISE NOTICE '✅ Created message policies';

-- =====================================================
-- 6. SET REPLICA IDENTITY FOR REALTIME
-- =====================================================

ALTER TABLE public.order_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.order_chat_threads REPLICA IDENTITY FULL;

RAISE NOTICE '✅ Set REPLICA IDENTITY FULL for realtime updates';

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

DO $$
DECLARE
    realtime_count INTEGER;
    threads_policy_count INTEGER;
    messages_policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO realtime_count
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename IN ('order_chat_messages', 'order_chat_threads');
    
    SELECT COUNT(*) INTO threads_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_chat_threads';
    
    SELECT COUNT(*) INTO messages_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_chat_messages';
    
    RAISE NOTICE '';
    RAISE NOTICE '=============== VERIFICATION ===============';
    RAISE NOTICE 'Tables in realtime publication: %', realtime_count;
    RAISE NOTICE 'Policies on order_chat_threads: %', threads_policy_count;
    RAISE NOTICE 'Policies on order_chat_messages: %', messages_policy_count;
    RAISE NOTICE '=============================================';
    
    IF realtime_count = 2 AND threads_policy_count >= 3 AND messages_policy_count >= 3 THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED! Chat realtime should now work.';
    ELSE
        RAISE WARNING '⚠️ Some checks may have failed. Review the output above.';
    END IF;
END $$;
