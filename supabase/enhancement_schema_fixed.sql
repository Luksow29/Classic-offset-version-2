-- Fixed schema for Classic Offset enhancements
-- This addresses the foreign key type mismatch issues

-- First, let's check existing table structures and fix accordingly
-- Drop any existing tables if they were created with wrong types
DROP TABLE IF EXISTS public.loyalty_transactions CASCADE;
DROP TABLE IF EXISTS public.order_materials CASCADE;
DROP TABLE IF EXISTS public.loyalty_customers CASCADE;
DROP TABLE IF EXISTS public.loyalty_rewards CASCADE;
DROP TABLE IF EXISTS public.inventory_adjustments CASCADE;
DROP TABLE IF EXISTS public.business_insights CASCADE;

-- Loyalty Program Tables (Fixed)
CREATE TABLE public.loyalty_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  points_earned integer DEFAULT 0,
  points_redeemed integer DEFAULT 0,
  current_points integer DEFAULT 0,
  tier text CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')) DEFAULT 'Bronze',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(customer_id)
);

CREATE TABLE public.loyalty_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  type text CHECK (type IN ('earned', 'redeemed')) NOT NULL,
  points integer NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.loyalty_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  discount_percent numeric,
  discount_amount numeric,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Inventory Management Enhancements
-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add last_restocked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materials' AND column_name = 'last_restocked') THEN
        ALTER TABLE public.materials ADD COLUMN last_restocked timestamp with time zone;
    END IF;
    
    -- Add supplier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materials' AND column_name = 'supplier') THEN
        ALTER TABLE public.materials ADD COLUMN supplier text;
    END IF;
    
    -- Add reorder_point column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materials' AND column_name = 'reorder_point') THEN
        ALTER TABLE public.materials ADD COLUMN reorder_point integer DEFAULT 10;
    END IF;
END $$;

CREATE TABLE public.inventory_adjustments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  adjustment_type text CHECK (adjustment_type IN ('add', 'remove', 'transfer')) NOT NULL,
  quantity integer NOT NULL,
  reason text,
  adjusted_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Order Materials Tracking (Fixed foreign key type)
CREATE TABLE public.order_materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity_used numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Business Insights Cache
CREATE TABLE public.business_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  impact text CHECK (impact IN ('high', 'medium', 'low')) DEFAULT 'medium',
  actionable boolean DEFAULT false,
  data jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Create indexes for performance
CREATE INDEX idx_loyalty_customers_customer_id ON public.loyalty_customers(customer_id);
CREATE INDEX idx_loyalty_transactions_customer_id ON public.loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_order_id ON public.loyalty_transactions(order_id);
CREATE INDEX idx_inventory_adjustments_material_id ON public.inventory_adjustments(material_id);
CREATE INDEX idx_order_materials_order_id ON public.order_materials(order_id);
CREATE INDEX idx_order_materials_material_id ON public.order_materials(material_id);
CREATE INDEX idx_business_insights_type ON public.business_insights(insight_type);

-- Enable RLS
ALTER TABLE public.loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage loyalty data" ON public.loyalty_customers
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage loyalty transactions" ON public.loyalty_transactions
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view loyalty rewards" ON public.loyalty_rewards
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage inventory adjustments" ON public.inventory_adjustments
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage order materials" ON public.order_materials
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view business insights" ON public.business_insights
FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for automatic point calculation
CREATE OR REPLACE FUNCTION calculate_loyalty_points(order_amount numeric)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1 point per ₹100 spent
  RETURN FLOOR(order_amount / 100);
END;
$$;

-- Trigger to automatically award points when payment is made
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  points_to_award integer;
  customer_id_var uuid;
BEGIN
  -- Get customer ID from order
  SELECT customer_id INTO customer_id_var 
  FROM public.orders 
  WHERE id = NEW.order_id;
  
  -- Calculate points
  points_to_award := calculate_loyalty_points(NEW.amount_paid);
  
  -- Skip if no points to award
  IF points_to_award <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Update loyalty customer record
  INSERT INTO public.loyalty_customers (customer_id, points_earned, current_points)
  VALUES (customer_id_var, points_to_award, points_to_award)
  ON CONFLICT (customer_id) 
  DO UPDATE SET 
    points_earned = loyalty_customers.points_earned + points_to_award,
    current_points = loyalty_customers.current_points + points_to_award,
    updated_at = now();
  
  -- Log the transaction
  INSERT INTO public.loyalty_transactions (customer_id, order_id, type, points, description)
  VALUES (customer_id_var, NEW.order_id, 'earned', points_to_award, 'Points earned from order payment');
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON public.payments;
CREATE TRIGGER trigger_award_loyalty_points
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points();

-- Insert some default loyalty rewards
INSERT INTO public.loyalty_rewards (name, description, points_required, discount_percent, active) VALUES
('5% Discount', 'Get 5% off your next order', 500, 5, true),
('10% Discount', 'Get 10% off your next order', 1000, 10, true),
('15% Discount', 'Get 15% off your next order', 2000, 15, true),
('Free Delivery', 'Free delivery on your next order', 300, NULL, true),
('₹500 Cashback', 'Get ₹500 cashback', 1500, NULL, true)
ON CONFLICT DO NOTHING;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_adjustments;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Classic Offset enhancement schema created successfully! 🚀';
  RAISE NOTICE 'New tables: loyalty_customers, loyalty_transactions, loyalty_rewards, inventory_adjustments, order_materials, business_insights';
  RAISE NOTICE 'Enhanced materials table with: last_restocked, supplier, reorder_point columns';
  RAISE NOTICE 'Automatic loyalty points system is now active!';
END $$;
