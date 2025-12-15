-- Migration: loyalty_points_trigger
-- Description: Automates the calculation of customer loyalty points using a database trigger.
-- Date: 2025-12-14

-- 1. Create the function to update customer balances
CREATE OR REPLACE FUNCTION update_customer_loyalty_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the customer's aggregate columns based on the new transaction
  -- precise logic: 
  --   loyalty_points = current + earned - spent
  --   total_points_earned = current + earned
  --   total_points_spent = current + spent
  
  -- We use COALESCE to handle potential NULLs in the customers table safely
  UPDATE customers
  SET 
    loyalty_points = COALESCE(loyalty_points, 0) + NEW.points_earned - NEW.points_spent,
    total_points_earned = COALESCE(total_points_earned, 0) + NEW.points_earned,
    total_points_spent = COALESCE(total_points_spent, 0) + NEW.points_spent,
    updated_at = NOW()
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger to fire after a new transaction is inserted
DROP TRIGGER IF EXISTS tr_update_customer_loyalty_balance ON loyalty_points;

CREATE TRIGGER tr_update_customer_loyalty_balance
AFTER INSERT ON loyalty_points
FOR EACH ROW
EXECUTE FUNCTION update_customer_loyalty_balance();
