-- Enable Realtime for Order Requests
-- Run this in Supabase SQL Editor (or via `supabase db push`)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'order_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_requests;
        RAISE NOTICE 'Added order_requests to realtime publication';
    ELSE
        RAISE NOTICE 'order_requests already in realtime publication';
    END IF;
END $$;

