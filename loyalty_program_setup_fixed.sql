-- Fixed SQL to create Advanced Loyalty Program database tables
-- Run this in your Supabase SQL Editor for Week 4 Enhancement

-- First, let's check if the table exists and drop it if it has wrong structure
DROP TABLE IF EXISTS public.loyalty_redemptions;
DROP TABLE IF EXISTS public.loyalty_referrals;
DROP TABLE IF EXISTS public.loyalty_rewards;
DROP TABLE IF EXISTS public.loyalty_points;
DROP TABLE IF EXISTS public.loyalty_tiers;

-- Create loyalty_tiers table for customer tier management
CREATE TABLE public.loyalty_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name VARCHAR(50) NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  min_points INTEGER NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  benefits JSONB,
  tier_color VARCHAR(20) DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loyalty_points table for tracking point transactions
CREATE TABLE public.loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  points_spent INTEGER DEFAULT 0,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('earned', 'spent', 'expired', 'adjustment')) NOT NULL,
  reference_type VARCHAR(20) CHECK (reference_type IN ('order', 'referral', 'bonus', 'reward', 'manual')) NOT NULL,
  reference_id UUID, -- Can reference orders, rewards, etc.
  description TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Create loyalty_rewards table for reward catalog
CREATE TABLE public.loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type VARCHAR(20) CHECK (reward_type IN ('discount', 'product', 'service', 'cashback')) NOT NULL,
  reward_value DECIMAL(10,2), -- Discount amount or product value
  min_tier_required INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER, -- For physical rewards
  terms_conditions TEXT,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loyalty_redemptions table for tracking reward redemptions
CREATE TABLE public.loyalty_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redemption_code VARCHAR(20) UNIQUE,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'redeemed', 'expired', 'cancelled')) DEFAULT 'pending',
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  order_id UUID, -- Reference to order if applicable
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loyalty_referrals table for referral program
CREATE TABLE public.loyalty_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  referred_customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE,
  status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'rewarded')) DEFAULT 'pending',
  referrer_points INTEGER DEFAULT 0,
  referred_points INTEGER DEFAULT 0,
  first_order_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add loyalty columns to existing customers table (only if they don't exist)
DO $$
BEGIN
    -- Add loyalty_points column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='loyalty_points') THEN
        ALTER TABLE public.customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;
    
    -- Add loyalty_tier_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='loyalty_tier_id') THEN
        ALTER TABLE public.customers ADD COLUMN loyalty_tier_id UUID REFERENCES public.loyalty_tiers(id);
    END IF;
    
    -- Add referral_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='referral_code') THEN
        ALTER TABLE public.customers ADD COLUMN referral_code VARCHAR(20) UNIQUE;
    END IF;
    
    -- Add total_points_earned column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='total_points_earned') THEN
        ALTER TABLE public.customers ADD COLUMN total_points_earned INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_points_spent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='total_points_spent') THEN
        ALTER TABLE public.customers ADD COLUMN total_points_spent INTEGER DEFAULT 0;
    END IF;
    
    -- Add tier_upgraded_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='tier_upgraded_at') THEN
        ALTER TABLE public.customers ADD COLUMN tier_upgraded_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Insert default loyalty tiers
INSERT INTO public.loyalty_tiers (tier_name, tier_level, min_points, discount_percentage, benefits, tier_color) VALUES
('Bronze', 1, 0, 2.00, '["Welcome bonus: 100 points", "Birthday discount: 5%", "Free delivery on orders above ₹1000"]', '#CD7F32'),
('Silver', 2, 1000, 5.00, '["All Bronze benefits", "Priority support", "Early access to new services", "Quarterly bonus: 50 points"]', '#C0C0C0'),
('Gold', 3, 5000, 8.00, '["All Silver benefits", "Dedicated account manager", "Free rush orders", "Monthly bonus: 100 points"]', '#FFD700'),
('Platinum', 4, 15000, 12.00, '["All Gold benefits", "VIP treatment", "Custom pricing", "Exclusive events", "Bi-weekly bonus: 150 points"]', '#E5E4E2'),
('Diamond', 5, 50000, 15.00, '["All Platinum benefits", "Premium consultation", "Unlimited revisions", "Annual appreciation gift", "Weekly bonus: 200 points"]', '#B9F2FF')
ON CONFLICT (tier_name) DO NOTHING;

-- Insert sample loyalty rewards
INSERT INTO public.loyalty_rewards (reward_name, description, points_required, reward_type, reward_value, min_tier_required, terms_conditions) VALUES
('₹100 Discount Voucher', 'Get ₹100 off on your next order', 500, 'discount', 100.00, 1, 'Valid for 90 days. Minimum order value ₹1000. Cannot be combined with other offers.'),
('₹250 Discount Voucher', 'Get ₹250 off on your next order', 1200, 'discount', 250.00, 2, 'Valid for 90 days. Minimum order value ₹2500. Cannot be combined with other offers.'),
('₹500 Discount Voucher', 'Get ₹500 off on your next order', 2200, 'discount', 500.00, 3, 'Valid for 90 days. Minimum order value ₹5000. Cannot be combined with other offers.'),
('Free Business Card Design', 'Get a professional business card design for free', 800, 'service', 500.00, 1, 'Includes 3 design concepts and 2 revisions. Valid for 6 months.'),
('Free Logo Design', 'Get a custom logo design for your business', 1500, 'service', 1500.00, 2, 'Includes 5 design concepts and unlimited revisions. Valid for 6 months.'),
('Premium Branding Package', 'Complete branding package with logo, cards, and letterhead', 3000, 'service', 5000.00, 3, 'Includes logo design, business cards, letterhead, and brand guidelines. Valid for 1 year.'),
('Rush Order Priority', 'Get your orders processed with highest priority', 1000, 'service', 200.00, 2, 'Valid for 3 rush orders. Must be redeemed within 6 months.'),
('₹1000 Cashback', 'Direct cashback to your account', 4500, 'cashback', 1000.00, 4, 'Cashback will be credited within 7 working days. Valid for 1 year.'),
('Exclusive Design Consultation', '1-hour consultation with senior designer', 2000, 'service', 2000.00, 3, 'Personalized design consultation via video call. Valid for 6 months.'),
('Anniversary Special Bonus', 'Special bonus points on your account anniversary', 300, 'discount', 0.00, 1, 'Bonus 200 points will be credited to your account.');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_transaction_type ON public.loyalty_points(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_created_at ON public.loyalty_points(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_customer_id ON public.loyalty_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status ON public.loyalty_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_referrals_referrer_id ON public.loyalty_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON public.customers(loyalty_points);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier_id ON public.customers(loyalty_tier_id);

-- Function to calculate and update customer tier based on points
CREATE OR REPLACE FUNCTION update_customer_tier(customer_uuid UUID)
RETURNS VOID AS $$
DECLARE
    customer_points INTEGER;
    new_tier_id UUID;
    current_tier_level INTEGER;
    new_tier_level INTEGER;
BEGIN
    -- Get customer's current points
    SELECT loyalty_points INTO customer_points
    FROM customers 
    WHERE id = customer_uuid;
    
    -- Get current tier level
    SELECT COALESCE(lt.tier_level, 0) INTO current_tier_level
    FROM customers c
    LEFT JOIN loyalty_tiers lt ON c.loyalty_tier_id = lt.id
    WHERE c.id = customer_uuid;
    
    -- Find the appropriate tier
    SELECT id, tier_level INTO new_tier_id, new_tier_level
    FROM loyalty_tiers
    WHERE min_points <= customer_points
    ORDER BY tier_level DESC
    LIMIT 1;
    
    -- Update customer tier if changed
    IF new_tier_id IS NOT NULL AND new_tier_level > current_tier_level THEN
        UPDATE customers 
        SET loyalty_tier_id = new_tier_id,
            tier_upgraded_at = NOW()
        WHERE id = customer_uuid;
        
        -- Add tier upgrade bonus points (100 points for each tier upgrade)
        INSERT INTO loyalty_points (customer_id, points_earned, transaction_type, reference_type, description)
        VALUES (customer_uuid, 100, 'earned', 'bonus', 'Tier upgrade bonus to ' || (SELECT tier_name FROM loyalty_tiers WHERE id = new_tier_id));
        
        -- Update customer total points
        UPDATE customers 
        SET loyalty_points = loyalty_points + 100,
            total_points_earned = total_points_earned + 100
        WHERE id = customer_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for orders
CREATE OR REPLACE FUNCTION award_order_points(customer_uuid UUID, order_total DECIMAL, order_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    points_to_award INTEGER;
    tier_multiplier DECIMAL DEFAULT 1.0;
BEGIN
    -- Get tier multiplier (higher tiers get more points)
    SELECT 
        CASE 
            WHEN lt.tier_level = 1 THEN 1.0
            WHEN lt.tier_level = 2 THEN 1.2
            WHEN lt.tier_level = 3 THEN 1.5
            WHEN lt.tier_level = 4 THEN 1.8
            WHEN lt.tier_level = 5 THEN 2.0
            ELSE 1.0
        END INTO tier_multiplier
    FROM customers c
    LEFT JOIN loyalty_tiers lt ON c.loyalty_tier_id = lt.id
    WHERE c.id = customer_uuid;
    
    -- Calculate points (1 point per ₹10 spent, with tier multiplier)
    points_to_award := FLOOR((order_total / 10) * tier_multiplier);
    
    -- Award points
    INSERT INTO loyalty_points (customer_id, points_earned, transaction_type, reference_type, reference_id, description)
    VALUES (customer_uuid, points_to_award, 'earned', 'order', order_uuid, 'Points earned from order #' || order_uuid);
    
    -- Update customer totals
    UPDATE customers 
    SET loyalty_points = loyalty_points + points_to_award,
        total_points_earned = total_points_earned + points_to_award
    WHERE id = customer_uuid;
    
    -- Check for tier upgrade
    PERFORM update_customer_tier(customer_uuid);
    
    RETURN points_to_award;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(customer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base code from customer name
    base_code := UPPER(LEFT(REGEXP_REPLACE(customer_name, '[^a-zA-Z]', '', 'g'), 4));
    
    -- Add random numbers
    final_code := base_code || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM customers WHERE referral_code = final_code) LOOP
        final_code := base_code || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            final_code := 'REF' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Update existing customers with default tier and referral codes
UPDATE customers 
SET loyalty_tier_id = (SELECT id FROM loyalty_tiers WHERE tier_name = 'Bronze' LIMIT 1),
    referral_code = generate_referral_code(name)
WHERE loyalty_tier_id IS NULL;

-- Sample loyalty point transactions for existing customers
INSERT INTO loyalty_points (customer_id, points_earned, transaction_type, reference_type, description, created_at)
SELECT 
  id,
  FLOOR(RANDOM() * 500) + 100, -- Random points between 100-600
  'earned',
  'bonus',
  'Welcome bonus points',
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM customers
WHERE id IN (SELECT id FROM customers LIMIT 5);

-- Update customer loyalty points based on their order history
UPDATE customers 
SET 
  loyalty_points = COALESCE((
    SELECT SUM(points_earned) - COALESCE(SUM(points_spent), 0)
    FROM loyalty_points 
    WHERE customer_id = customers.id
  ), 0),
  total_points_earned = COALESCE((
    SELECT SUM(points_earned)
    FROM loyalty_points 
    WHERE customer_id = customers.id
  ), 0);

-- Create a view for loyalty analytics
CREATE OR REPLACE VIEW public.loyalty_analytics AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.loyalty_points,
  lt.tier_name,
  lt.tier_level,
  lt.discount_percentage,
  c.total_points_earned,
  c.total_points_spent,
  c.referral_code,
  COUNT(DISTINCT lr.id) as total_redemptions,
  COUNT(DISTINCT lref.id) FILTER (WHERE lref.referrer_id = c.id) as referrals_made,
  COUNT(DISTINCT lref.id) FILTER (WHERE lref.referred_customer_id = c.id) as referred_by_count
FROM customers c
LEFT JOIN loyalty_tiers lt ON c.loyalty_tier_id = lt.id
LEFT JOIN loyalty_redemptions lr ON c.id = lr.customer_id
LEFT JOIN loyalty_referrals lref ON (c.id = lref.referrer_id OR c.id = lref.referred_customer_id)
GROUP BY c.id, c.name, c.email, c.loyalty_points, lt.tier_name, lt.tier_level, lt.discount_percentage, c.total_points_earned, c.total_points_spent, c.referral_code;

-- Success message
SELECT 'Loyalty Program database setup completed successfully!' as message;
