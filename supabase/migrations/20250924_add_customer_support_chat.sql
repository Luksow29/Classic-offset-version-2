-- Migration: Add Customer Support Chat System
-- Purpose: Enable live chat between customers and admin support team
-- Date: 2025-09-24

-- Create support_tickets table for chat sessions
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  subject text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to uuid, -- Admin user handling the ticket
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  last_message_at timestamp with time zone DEFAULT now(),
  customer_name text, -- Denormalized for quick access
  customer_phone text, -- Denormalized for quick access
  unread_admin_count integer DEFAULT 0, -- Messages unread by admin
  unread_customer_count integer DEFAULT 0, -- Messages unread by customer
  
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create support_messages table for individual chat messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_id uuid NOT NULL, -- Either customer_id or admin user_id
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  
  -- Optional metadata for files/images
  attachment_url text,
  attachment_name text,
  attachment_size integer,
  
  CONSTRAINT support_messages_pkey PRIMARY KEY (id),
  CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_message_at ON public.support_tickets(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON public.support_messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON public.support_messages(is_read) WHERE is_read = false;

-- Function to update ticket's last_message_at and unread counts
CREATE OR REPLACE FUNCTION update_ticket_on_new_message()
RETURNS trigger AS $$
BEGIN
  -- Update last message time
  UPDATE public.support_tickets 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    -- Increment unread count for the opposite party
    unread_admin_count = CASE 
      WHEN NEW.sender_type = 'customer' THEN unread_admin_count + 1
      ELSE unread_admin_count
    END,
    unread_customer_count = CASE 
      WHEN NEW.sender_type = 'admin' THEN unread_customer_count + 1
      ELSE unread_customer_count
    END
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update ticket when new message is added
DROP TRIGGER IF EXISTS trigger_update_ticket_on_message ON public.support_messages;
CREATE TRIGGER trigger_update_ticket_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_new_message();

-- Function to mark messages as read and update unread counts
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_ticket_id uuid,
  p_reader_type text -- 'customer' or 'admin'
)
RETURNS void AS $$
DECLARE
  unread_count integer;
BEGIN
  -- Count unread messages from the opposite party
  SELECT COUNT(*) INTO unread_count
  FROM public.support_messages 
  WHERE ticket_id = p_ticket_id 
    AND is_read = false 
    AND sender_type != p_reader_type;
  
  -- Mark messages as read
  UPDATE public.support_messages
  SET 
    is_read = true,
    read_at = now()
  WHERE ticket_id = p_ticket_id 
    AND is_read = false 
    AND sender_type != p_reader_type;
  
  -- Reset unread count for the reader
  UPDATE public.support_tickets
  SET 
    unread_admin_count = CASE 
      WHEN p_reader_type = 'admin' THEN 0 
      ELSE unread_admin_count 
    END,
    unread_customer_count = CASE 
      WHEN p_reader_type = 'customer' THEN 0 
      ELSE unread_customer_count 
    END,
    updated_at = now()
  WHERE id = p_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new support ticket
CREATE OR REPLACE FUNCTION create_support_ticket(
  p_customer_id uuid,
  p_subject text,
  p_description text,
  p_initial_message text
)
RETURNS uuid AS $$
DECLARE
  v_ticket_id uuid;
  v_customer_name text;
  v_customer_phone text;
BEGIN
  -- Get customer details
  SELECT name, phone INTO v_customer_name, v_customer_phone
  FROM public.customers 
  WHERE id = p_customer_id;
  
  -- Create the ticket
  INSERT INTO public.support_tickets (
    customer_id,
    subject,
    description,
    customer_name,
    customer_phone,
    unread_admin_count
  ) VALUES (
    p_customer_id,
    p_subject,
    COALESCE(p_description, p_initial_message),
    v_customer_name,
    v_customer_phone,
    1 -- Initial message will be unread by admin
  ) RETURNING id INTO v_ticket_id;
  
  -- Add the initial message
  INSERT INTO public.support_messages (
    ticket_id,
    sender_type,
    sender_id,
    message
  ) VALUES (
    v_ticket_id,
    'customer',
    p_customer_id,
    p_initial_message
  );
  
  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
-- Customers can only see their own tickets
CREATE POLICY "Customers can view own tickets" ON public.support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = support_tickets.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

-- Customers can create tickets for themselves
CREATE POLICY "Customers can create own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = customer_id 
      AND customers.user_id = auth.uid()
    )
  );

-- Admins can see all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'support')
    )
  );

-- RLS Policies for support_messages
-- Customers can see messages in their tickets
CREATE POLICY "Customers can view own ticket messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      JOIN public.customers c ON c.id = st.customer_id
      WHERE st.id = support_messages.ticket_id 
      AND c.user_id = auth.uid()
    )
  );

-- Customers can create messages in their tickets
CREATE POLICY "Customers can create messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      JOIN public.customers c ON c.id = st.customer_id
      WHERE st.id = ticket_id 
      AND c.user_id = auth.uid()
      AND sender_type = 'customer'
      AND sender_id = c.id
    )
  );

-- Admins can see and create all messages
CREATE POLICY "Admins can manage all messages" ON public.support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'support')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT EXECUTE ON FUNCTION create_support_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;

-- Create a view for admin dashboard with ticket summary
CREATE OR REPLACE VIEW public.support_tickets_summary AS
SELECT 
  t.*,
  c.email as customer_email,
  u.name as assigned_admin_name,
  (
    SELECT message 
    FROM public.support_messages 
    WHERE ticket_id = t.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as last_message,
  (
    SELECT COUNT(*) 
    FROM public.support_messages 
    WHERE ticket_id = t.id
  ) as total_messages
FROM public.support_tickets t
LEFT JOIN public.customers c ON c.id = t.customer_id
LEFT JOIN public.users u ON u.id = t.assigned_to
ORDER BY t.last_message_at DESC;

GRANT SELECT ON public.support_tickets_summary TO authenticated;

-- Success message
SELECT 'Customer Support Chat System migration completed successfully! 🎉' as message,
       'Created support_tickets and support_messages tables with RLS policies' as status,
       'Real-time chat functionality ready for implementation' as note;
