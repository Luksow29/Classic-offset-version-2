-- Fixed dashboard metrics using orders table data
-- Since your orders table has amount_received and balance_amount

DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(
    total_revenue numeric,
    total_paid numeric,
    total_expenses numeric,
    balance_due numeric,
    total_orders_count bigint,
    total_customers_count bigint,
    orders_fully_paid_count bigint,
    orders_partial_count bigint,
    orders_due_count bigint,
    orders_overdue_count bigint,
    stock_alerts_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Total Revenue: Sum of amount received from orders (actual payments)
        COALESCE((SELECT SUM(amount_received) FROM orders WHERE is_deleted = false), 0)::numeric AS total_revenue,

        -- Total Amount Paid: Same as total_revenue
        COALESCE((SELECT SUM(amount_received) FROM orders WHERE is_deleted = false), 0)::numeric AS total_paid,

        -- Total Expenses  
        COALESCE((SELECT SUM(amount) FROM expenses), 0)::numeric AS total_expenses,
        
        -- Outstanding Balance: Sum of balance_amount from orders
        COALESCE((SELECT SUM(balance_amount) FROM orders WHERE is_deleted = false AND balance_amount > 0), 0)::numeric AS balance_due,

        -- Total Orders Count
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false), 0)::bigint AS total_orders_count,
        
        -- Total Customers Count
        COALESCE((SELECT COUNT(*) FROM customers), 0)::bigint AS total_customers_count,

        -- Orders fully paid (balance_amount = 0)
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount = 0), 0)::bigint AS orders_fully_paid_count,
        
        -- Orders partially paid (balance > 0 but some amount received)
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount > 0 AND amount_received > 0), 0)::bigint AS orders_partial_count,
        
        -- Orders unpaid (no amount received)
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND amount_received = 0), 0)::bigint AS orders_due_count,
        
        -- Overdue Orders (past delivery date and not fully paid)
        COALESCE((
            SELECT COUNT(*) 
            FROM orders 
            WHERE is_deleted = false 
            AND delivery_date < CURRENT_DATE 
            AND balance_amount > 0
        ), 0)::bigint AS orders_overdue_count,

        -- Stock Alerts (if materials table exists)
        COALESCE((
            SELECT COUNT(*) 
            FROM materials 
            WHERE current_stock <= minimum_stock_level
        ), 0)::bigint AS stock_alerts_count;
END;
$$;
