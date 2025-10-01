-- Service Charge Integration with Payment Flow
-- This script adds service charge support while maintaining payment flow integrity

-- 1. Add service charge columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_charge_type varchar(20) DEFAULT 'none';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_charge_value numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_charge_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_charge_description text;

-- 2. Update existing orders to maintain data integrity
UPDATE public.orders 
SET subtotal = total_amount,
    service_charge_amount = 0,
    service_charge_type = 'none'
WHERE subtotal IS NULL OR subtotal = 0;

-- 3. Create function to calculate order totals with service charges
CREATE OR REPLACE FUNCTION calculate_order_total(
    p_quantity integer,
    p_rate numeric,
    p_service_charge_type varchar(20),
    p_service_charge_value numeric
)
RETURNS TABLE(
    subtotal numeric,
    service_charge_amount numeric,
    final_total numeric
) AS $$
DECLARE
    v_subtotal numeric;
    v_service_charge numeric;
    v_final_total numeric;
BEGIN
    -- Calculate subtotal
    v_subtotal := p_quantity * p_rate;
    
    -- Calculate service charge based on type
    CASE p_service_charge_type
        WHEN 'fixed' THEN
            v_service_charge := p_service_charge_value;
        WHEN 'percentage' THEN
            v_service_charge := (v_subtotal * p_service_charge_value) / 100;
        WHEN 'custom' THEN
            v_service_charge := p_service_charge_value;
        ELSE
            v_service_charge := 0;
    END CASE;
    
    -- Calculate final total
    v_final_total := v_subtotal + v_service_charge;
    
    RETURN QUERY SELECT v_subtotal, v_service_charge, v_final_total;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-calculate totals when orders are inserted/updated
CREATE OR REPLACE FUNCTION auto_calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    calc_result RECORD;
BEGIN
    -- Calculate totals using the function
    SELECT * INTO calc_result 
    FROM calculate_order_total(
        NEW.quantity,
        NEW.rate,
        COALESCE(NEW.service_charge_type, 'none'),
        COALESCE(NEW.service_charge_value, 0)
    );
    
    -- Update the NEW record with calculated values
    NEW.subtotal := calc_result.subtotal;
    NEW.service_charge_amount := calc_result.service_charge_amount;
    NEW.total_amount := calc_result.final_total;
    NEW.balance_amount := calc_result.final_total - COALESCE(NEW.amount_received, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_auto_calculate_order_totals ON public.orders;
CREATE TRIGGER trigger_auto_calculate_order_totals
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_order_totals();

-- 5. Update the loyalty points function to use service charge aware calculations
CREATE OR REPLACE FUNCTION award_order_points_with_service_charge(customer_uuid UUID, order_total DECIMAL, order_uuid BIGINT)
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
    
    -- Calculate points (1 point per ₹10 spent on TOTAL including service charges, with tier multiplier)
    points_to_award := FLOOR((order_total / 10) * tier_multiplier);
    
    -- Award points in loyalty_points table
    INSERT INTO loyalty_points (customer_id, points_earned, transaction_type, reference_type, reference_id, description)
    VALUES (customer_uuid, points_to_award, 'earned', 'order', order_uuid::text, 'Points earned from order #' || order_uuid);
    
    -- Also maintain compatibility with existing loyalty_transactions table
    INSERT INTO loyalty_transactions (customer_id, order_id, type, points, description)
    VALUES (customer_uuid, order_uuid, 'earned', points_to_award, 'Points earned from order #' || order_uuid);
    
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

-- 6. Update the existing auto_award_order_points trigger to use new function
CREATE OR REPLACE FUNCTION auto_award_order_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Award points for new orders using service charge aware function
    IF NEW.customer_id IS NOT NULL AND NEW.total_amount > 0 THEN
        PERFORM award_order_points_with_service_charge(NEW.customer_id, NEW.total_amount, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create view for payment calculations with service charge breakdown
-- First drop the existing view if it exists to avoid conflicts
DROP VIEW IF EXISTS order_payment_summary CASCADE;

CREATE VIEW order_payment_summary AS
SELECT 
    o.id as order_id,
    o.customer_id,
    o.customer_name,
    o.subtotal,
    o.service_charge_type,
    o.service_charge_value,
    o.service_charge_amount,
    o.service_charge_description,
    o.total_amount as final_total,
    o.amount_received,
    o.balance_amount,
    CASE 
        WHEN o.balance_amount <= 0 THEN 'Paid'
        WHEN o.amount_received > 0 THEN 'Partial'
        ELSE 'Due'
    END as payment_status,
    o.delivery_date,
    CASE 
        WHEN o.delivery_date < CURRENT_DATE AND o.balance_amount > 0 THEN true
        ELSE false
    END as is_overdue
FROM orders o
WHERE (o.is_deleted IS NULL OR o.is_deleted = false);

-- Success message
SELECT 'Service Charge + Payment Flow Integration completed successfully! 🎉' as message,
       'Orders table updated with service charge columns' as status,
       'Payment calculations will now include service charges' as note;