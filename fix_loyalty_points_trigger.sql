-- Fix the loyalty points trigger to handle BIGINT order IDs properly
-- The issue: reference_id is UUID but order IDs are BIGINT

-- 1. Update the award_order_points function to handle the type mismatch
CREATE OR REPLACE FUNCTION award_order_points(customer_uuid UUID, order_total DECIMAL, order_uuid BIGINT)
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
    
    -- Award points in new loyalty_points table
    -- FIX: Don't use reference_id for order references since it's UUID and order IDs are BIGINT
    INSERT INTO loyalty_points (customer_id, points_earned, transaction_type, reference_type, description)
    VALUES (customer_uuid, points_to_award, 'earned', 'order', 'Points earned from order #' || order_uuid);
    
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

-- 2. Also update the tier upgrade function to avoid UUID reference_id issues
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
        -- FIX: Don't use reference_id for tier upgrades since we don't have a UUID reference
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

-- 3. Update the trigger function to ensure it works properly
CREATE OR REPLACE FUNCTION auto_award_order_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Award points for new orders
    IF NEW.customer_id IS NOT NULL AND NEW.total_amount > 0 THEN
        PERFORM award_order_points(NEW.customer_id, NEW.total_amount, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Loyalty trigger fixed! Order creation should now work without UUID errors.' as message;