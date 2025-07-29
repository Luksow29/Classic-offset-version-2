-- SQL to create Advanced CRM database tables
-- Run this in your Supabase SQL Editor

-- Create customer_interactions table for tracking all customer communications
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('call', 'email', 'meeting', 'order', 'complaint', 'follow_up')) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  outcome TEXT,
  next_action TEXT,
  created_by UUID, -- Can reference auth.users if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_segments table for categorizing customers
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  criteria JSONB, -- Store segmentation rules as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_follow_ups table for managing follow-up tasks
CREATE TABLE IF NOT EXISTS public.customer_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  assigned_to UUID, -- Can reference auth.users if needed
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add CRM-specific columns to existing customers table if they don't exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) CHECK (customer_type IN ('VIP', 'Regular', 'New', 'Inactive')) DEFAULT 'New',
ADD COLUMN IF NOT EXISTS communication_preference VARCHAR(20) CHECK (communication_preference IN ('email', 'phone', 'whatsapp')) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_lifetime_value DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Insert sample customer segments
INSERT INTO public.customer_segments (name, description, criteria) VALUES
('VIP Customers', 'High-value customers with significant spending', '{"min_total_spent": 50000, "min_orders": 10}'),
('Regular Customers', 'Consistent customers with moderate spending', '{"min_total_spent": 10000, "min_orders": 5}'),
('New Customers', 'Recently acquired customers', '{"max_days_since_first_order": 30}'),
('At-Risk Customers', 'Customers who haven''t ordered recently', '{"max_days_since_last_order": 90}'),
('High-Potential', 'Customers with growth potential', '{"min_order_frequency": 2, "growth_trend": "positive"}')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON public.customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_type ON public.customer_interactions(type);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_at ON public.customer_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_follow_ups_customer_id ON public.customer_follow_ups(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_follow_ups_due_date ON public.customer_follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_follow_ups_status ON public.customer_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_last_interaction_date ON public.customers(last_interaction_date);

-- Sample data for customer interactions (for existing customers)
INSERT INTO public.customer_interactions (customer_id, type, subject, description, outcome, created_at)
SELECT 
  id,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'call'
    WHEN 1 THEN 'email'
    WHEN 2 THEN 'meeting'
    ELSE 'follow_up'
  END,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Initial consultation'
    WHEN 1 THEN 'Order follow-up'
    ELSE 'Service inquiry'
  END,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Discussed printing requirements for upcoming project'
    WHEN 1 THEN 'Followed up on recent order delivery and quality'
    ELSE 'Provided quote for new printing services'
  END,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Customer satisfied with service'
    WHEN 1 THEN 'Scheduled follow-up meeting'
    ELSE 'Sent detailed quote via email'
  END,
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM public.customers
WHERE id IN (SELECT id FROM public.customers LIMIT 5);

-- Update customers with sample CRM data
UPDATE public.customers 
SET 
  customer_type = CASE 
    WHEN RANDOM() < 0.1 THEN 'VIP'
    WHEN RANDOM() < 0.5 THEN 'Regular'
    WHEN RANDOM() < 0.8 THEN 'New'
    ELSE 'Inactive'
  END,
  communication_preference = CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'email'
    WHEN 1 THEN 'phone'
    ELSE 'whatsapp'
  END,
  notes = CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Prefers morning communication. Large volume orders.'
    WHEN 1 THEN 'Price-sensitive customer. Requires detailed quotes.'
    ELSE 'Quick decision maker. Repeat customer for marketing materials.'
  END,
  last_interaction_date = NOW() - (RANDOM() * INTERVAL '30 days'),
  customer_since = created_at,
  loyalty_points = FLOOR(RANDOM() * 1000)
WHERE customer_type IS NULL;

-- Add some sample follow-ups
INSERT INTO public.customer_follow_ups (customer_id, title, description, due_date, priority, status)
SELECT 
  id,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'Follow up on quote'
    WHEN 1 THEN 'Check project progress'
    WHEN 2 THEN 'Schedule next meeting'
    ELSE 'Send satisfaction survey'
  END,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Follow up on the quote sent last week'
    WHEN 1 THEN 'Check if customer needs any assistance with current project'
    ELSE 'Schedule meeting to discuss future printing needs'
  END,
  NOW() + (RANDOM() * INTERVAL '14 days'),
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    WHEN 2 THEN 'high'
    ELSE 'urgent'
  END,
  CASE 
    WHEN RANDOM() < 0.7 THEN 'pending'
    ELSE 'completed'
  END
FROM public.customers
WHERE id IN (SELECT id FROM public.customers LIMIT 3);

-- Create a view for customer analytics
CREATE OR REPLACE VIEW public.customer_analytics AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.customer_type,
  c.total_lifetime_value,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_spent,
  MAX(o.created_at) as last_order_date,
  COUNT(DISTINCT ci.id) as total_interactions,
  MAX(ci.created_at) as last_interaction_date,
  COUNT(DISTINCT cf.id) FILTER (WHERE cf.status = 'pending') as pending_follow_ups
FROM public.customers c
LEFT JOIN public.orders o ON c.id = o.customer_id
LEFT JOIN public.customer_interactions ci ON c.id = ci.customer_id
LEFT JOIN public.customer_follow_ups cf ON c.id = cf.customer_id
GROUP BY c.id, c.name, c.email, c.customer_type, c.total_lifetime_value;

-- Verify the new structure
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('customer_interactions', 'customer_segments', 'customer_follow_ups', 'customers')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
