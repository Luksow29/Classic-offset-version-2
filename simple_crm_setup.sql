-- Simplified CRM Database Setup
-- Run this first to test the CRM functionality

-- Add CRM-specific columns to existing customers table if they don't exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'New',
ADD COLUMN IF NOT EXISTS communication_preference VARCHAR(20) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_lifetime_value DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Create customer_interactions table for tracking all customer communications
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  outcome TEXT,
  next_action TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing customers with sample CRM data
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
  customer_since = created_at,
  loyalty_points = FLOOR(RANDOM() * 1000)
WHERE customer_type IS NULL;

-- Verify the setup
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
AND table_schema = 'public'
ORDER BY ordinal_position;
