-- Step 9: Create OrderChat System Database Schema
-- This creates the chat system for customer-admin communication about orders

-- Create order_chat_threads table for organizing conversations by order
CREATE TABLE IF NOT EXISTS public.order_chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
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

-- RLS Policies for order_chat_threads
CREATE POLICY "Users can view their own chat threads" ON public.order_chat_threads
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Customers can create chat threads for their orders" ON public.order_chat_threads
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
    );

CREATE POLICY "Users can update their own chat threads" ON public.order_chat_threads
    FOR UPDATE USING (
        customer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for order_chat_messages
CREATE POLICY "Users can view messages in their chat threads" ON public.order_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.order_chat_threads 
            WHERE id = thread_id AND (
                customer_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

CREATE POLICY "Users can create messages in their chat threads" ON public.order_chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.order_chat_threads 
            WHERE id = thread_id AND (
                customer_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

CREATE POLICY "Users can update their own messages" ON public.order_chat_messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

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

-- Function to automatically create notification when new chat message is received
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
    thread_record RECORD;
    recipient_id UUID;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get thread information
    SELECT t.*, o.id as order_number 
    INTO thread_record
    FROM public.order_chat_threads t
    JOIN public.orders o ON o.id = t.order_id
    WHERE t.id = NEW.thread_id;
    
    -- Determine recipient (if sender is customer, notify admin; if sender is admin, notify customer)
    IF NEW.sender_type = 'customer' THEN
        -- Notify admin - for now we'll use a system approach, later can be enhanced for specific admin assignment
        RETURN NEW; -- Skip admin notification for now, will implement in admin interface
    ELSE
        -- Notify customer
        recipient_id := thread_record.customer_id;
        notification_title := 'New Message: Order #' || thread_record.order_number;
        notification_message := 'You have a new message about your order.';
    END IF;
    
    -- Insert notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link_to,
        created_at
    ) VALUES (
        recipient_id,
        'chat_message',
        notification_title,
        notification_message,
        '/customer-portal/orders/' || thread_record.order_id || '/chat',
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when new chat message is added
DROP TRIGGER IF EXISTS notify_new_chat_message_trigger ON public.order_chat_messages;
CREATE TRIGGER notify_new_chat_message_trigger
    AFTER INSERT ON public.order_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_chat_message();

-- Insert some sample data for testing (optional)
-- This would be removed in production
/*
-- Sample chat thread (replace with actual order and customer IDs)
INSERT INTO public.order_chat_threads (order_id, customer_id, subject, status, priority)
VALUES (
    (SELECT id FROM public.orders LIMIT 1),
    (SELECT customer_id FROM public.orders LIMIT 1),
    'Question about delivery',
    'active',
    'normal'
);

-- Sample messages
INSERT INTO public.order_chat_messages (thread_id, sender_id, sender_type, content)
VALUES 
(
    (SELECT id FROM public.order_chat_threads LIMIT 1),
    (SELECT customer_id FROM public.order_chat_threads LIMIT 1),
    'customer',
    'Hi, I wanted to ask about the delivery date for my order. When can I expect it?'
),
(
    (SELECT id FROM public.order_chat_threads LIMIT 1),
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    'admin',
    'Hello! Thank you for your inquiry. Your order is currently being processed and should be ready for delivery by tomorrow. We will send you a notification once it''s out for delivery.'
);
*/

COMMENT ON TABLE public.order_chat_threads IS 'Chat threads for customer-admin communication about specific orders';
COMMENT ON TABLE public.order_chat_messages IS 'Individual messages within order chat threads';
