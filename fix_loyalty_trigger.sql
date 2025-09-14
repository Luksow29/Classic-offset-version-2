-- Fix the loyalty program trigger that's causing the "cannot cast type bigint to uuid" error
-- This script fixes the award_order_points function

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
    -- FIX: Don't try to cast BIGINT to UUID, use NULL for reference_id instead
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