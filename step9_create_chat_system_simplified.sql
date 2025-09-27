-- Step 9: Create OrderChat System Database Schema (Simplified Version)
-- This creates the chat system for customer-admin communication about orders

-- Create order_chat_threads table for organizing conversations by order
CREATE TABLE IF NOT EXISTS public.order_chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id BIGINT NOT NULL, -- References orders table but without FK constraint for now
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL DEFAULT 'Order Discussion',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_chat_messages table for individual messages
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

-- Create indexes for performance
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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own chat threads" ON public.order_chat_threads;
DROP POLICY IF EXISTS "Customers can create chat threads" ON public.order_chat_threads;
DROP POLICY IF EXISTS "Users can update their own chat threads" ON public.order_chat_threads;
DROP POLICY IF EXISTS "Users can view messages in their chat threads" ON public.order_chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their chat threads" ON public.order_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.order_chat_messages;

-- Simplified RLS Policies for order_chat_threads (customers can see their own threads)
CREATE POLICY "Users can view their own chat threads" ON public.order_chat_threads
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can create chat threads" ON public.order_chat_threads
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own chat threads" ON public.order_chat_threads
    FOR UPDATE USING (customer_id = auth.uid());

-- Simplified RLS Policies for order_chat_messages
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

-- Function to update thread's last_message_at when new message is added
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

-- Trigger to update thread when message is added
DROP TRIGGER IF EXISTS update_chat_thread_last_message_trigger ON public.order_chat_messages;
CREATE TRIGGER update_chat_thread_last_message_trigger
    AFTER INSERT ON public.order_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_thread_last_message();

COMMENT ON TABLE public.order_chat_threads IS 'Chat threads for customer-admin communication about specific orders';
COMMENT ON TABLE public.order_chat_messages IS 'Individual messages within order chat threads';
