-- Step 9: Create OrderChat System - SAFE RE-RUN VERSION
-- This version can be run multiple times safely

-- Clean up any existing objects first (safe to run even if they don't exist)
DROP TRIGGER IF EXISTS update_chat_thread_last_message_trigger ON public.order_chat_messages;
DROP FUNCTION IF EXISTS public.update_chat_thread_last_message();

-- Drop existing policies (safe even if they don't exist)
DROP POLICY IF EXISTS "Users can view their own chat threads" ON public.order_chat_threads;
DROP POLICY IF EXISTS "Customers can create chat threads" ON public.order_chat_threads;
DROP POLICY IF EXISTS "Users can update their own chat threads" ON public.order_chat_threads;
DROP POLICY IF EXISTS "Users can view messages in their chat threads" ON public.order_chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their chat threads" ON public.order_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.order_chat_messages;

-- Create order_chat_threads table
CREATE TABLE IF NOT EXISTS public.order_chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id BIGINT NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL DEFAULT 'Order Discussion',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_chat_messages table
CREATE TABLE IF NOT EXISTS public.order_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.order_chat_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin', 'system')),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    content TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS is built into CREATE INDEX)
CREATE INDEX IF NOT EXISTS idx_order_chat_threads_order_id ON public.order_chat_threads(order_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_threads_customer_id ON public.order_chat_threads(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_threads_status ON public.order_chat_threads(status);
CREATE INDEX IF NOT EXISTS idx_order_chat_threads_last_message ON public.order_chat_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_chat_messages_thread_id ON public.order_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_sender ON public.order_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_created_at ON public.order_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_unread ON public.order_chat_messages(is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE public.order_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (fresh ones, since we dropped the old ones above)
CREATE POLICY "Users can view their own chat threads" ON public.order_chat_threads
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can create chat threads" ON public.order_chat_threads
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own chat threads" ON public.order_chat_threads
    FOR UPDATE USING (customer_id = auth.uid());

CREATE POLICY "Users can view messages in their chat threads" ON public.order_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.order_chat_threads 
            WHERE id = thread_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their chat threads" ON public.order_chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.order_chat_threads 
            WHERE id = thread_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON public.order_chat_messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Create function to update thread's last_message_at
CREATE OR REPLACE FUNCTION public.update_chat_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.order_chat_threads
    SET 
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.thread_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_chat_thread_last_message_trigger
    AFTER INSERT ON public.order_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_thread_last_message();

-- Add helpful comments
COMMENT ON TABLE public.order_chat_threads IS 'Chat threads for customer-admin communication about specific orders';
COMMENT ON TABLE public.order_chat_messages IS 'Individual messages within order chat threads';

-- Verification queries (these will show you what was created)
SELECT 'Tables created successfully!' as status;

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('order_chat_threads', 'order_chat_messages')
ORDER BY table_name, ordinal_position;
