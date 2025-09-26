-- Migration: Add Customer Support Live Chat System
-- Purpose: Enable real-time chat between customers and admin support team
-- Date: 16 September 2025

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id BIGSERIAL PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_by_admin BOOLEAN DEFAULT TRUE,
    unread_by_customer BOOLEAN DEFAULT FALSE
);

-- 2. Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    sender_id UUID NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system'))
);

-- 3. Create support_typing_indicators table (for real-time typing status)
CREATE TABLE IF NOT EXISTS public.support_typing_indicators (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'admin')),
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_id, user_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_message_at ON public.support_tickets(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_typing_indicators_ticket_id ON public.support_typing_indicators(ticket_id);

-- 5. Create function to update ticket's last_message_at
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_tickets 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at,
        unread_by_admin = CASE WHEN NEW.sender_type = 'customer' THEN TRUE ELSE unread_by_admin END,
        unread_by_customer = CASE WHEN NEW.sender_type = 'admin' THEN TRUE ELSE unread_by_customer END
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for message updates
DROP TRIGGER IF EXISTS trigger_update_ticket_last_message ON public.support_messages;
CREATE TRIGGER trigger_update_ticket_last_message
    AFTER INSERT ON public.support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_last_message();

-- 7. Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.support_typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '30 seconds';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-cleanup typing indicators
DROP TRIGGER IF EXISTS trigger_cleanup_typing_indicators ON public.support_typing_indicators;
CREATE TRIGGER trigger_cleanup_typing_indicators
    AFTER INSERT OR UPDATE ON public.support_typing_indicators
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_typing_indicators();

-- 9. RLS (Row Level Security) policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own tickets and messages
CREATE POLICY "Customers can view own tickets" ON public.support_tickets
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can view own messages" ON public.support_messages
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM public.support_tickets 
            WHERE customer_id IN (
                SELECT id FROM public.customers WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Customers can send messages" ON public.support_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'customer' AND
        ticket_id IN (
            SELECT id FROM public.support_tickets 
            WHERE customer_id IN (
                SELECT id FROM public.customers WHERE user_id = auth.uid()
            )
        )
    );

-- Admin users can see all tickets and messages
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view all messages" ON public.support_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Typing indicators policies
CREATE POLICY "Users can manage own typing status" ON public.support_typing_indicators
    FOR ALL USING (user_id = auth.uid());

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_typing_indicators TO authenticated;
GRANT USAGE ON SEQUENCE public.support_tickets_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.support_messages_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.support_typing_indicators_id_seq TO authenticated;

-- 11. Create helper functions for common operations
CREATE OR REPLACE FUNCTION create_support_ticket(
    p_customer_id UUID,
    p_subject TEXT,
    p_priority VARCHAR(20) DEFAULT 'medium',
    p_initial_message TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_ticket_id BIGINT;
BEGIN
    -- Create the ticket
    INSERT INTO public.support_tickets (customer_id, subject, priority)
    VALUES (p_customer_id, p_subject, p_priority)
    RETURNING id INTO v_ticket_id;
    
    -- Add initial message if provided
    IF p_initial_message IS NOT NULL THEN
        INSERT INTO public.support_messages (ticket_id, sender_type, sender_id, message_text)
        VALUES (v_ticket_id, 'customer', (
            SELECT user_id FROM public.customers WHERE id = p_customer_id
        ), p_initial_message);
    END IF;
    
    RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_ticket_id BIGINT,
    p_user_type VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.support_messages 
    SET is_read = TRUE 
    WHERE ticket_id = p_ticket_id 
    AND sender_type != p_user_type;
    
    -- Update ticket unread flags
    IF p_user_type = 'admin' THEN
        UPDATE public.support_tickets SET unread_by_admin = FALSE WHERE id = p_ticket_id;
    ELSE
        UPDATE public.support_tickets SET unread_by_customer = FALSE WHERE id = p_ticket_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_support_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;

-- 12. Comments for documentation
COMMENT ON TABLE public.support_tickets IS 'Customer support tickets for live chat system';
COMMENT ON TABLE public.support_messages IS 'Messages within support tickets';
COMMENT ON TABLE public.support_typing_indicators IS 'Real-time typing indicators for chat';
COMMENT ON FUNCTION create_support_ticket IS 'Creates a new support ticket with optional initial message';
COMMENT ON FUNCTION mark_messages_as_read IS 'Marks messages as read and updates ticket unread flags';

-- Success message
SELECT 'Customer Support Live Chat database schema created successfully! 🎉' as message,
       'Tables: support_tickets, support_messages, support_typing_indicators' as tables_created,
       'RLS policies and helper functions enabled' as security_status;
