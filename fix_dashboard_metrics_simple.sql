-- Fixed dashboard metrics function without user filtering
-- This should work if tables exist and have data

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
        -- Total Revenue: Sum of all received payments
        COALESCE((SELECT SUM(amount_paid) FROM payments), 0)::numeric AS total_revenue,

        -- Total Amount Paid: Same as total_revenue
        COALESCE((SELECT SUM(amount_paid) FROM payments), 0)::numeric AS total_paid,

        -- Total Expenses  
        COALESCE((SELECT SUM(amount) FROM expenses), 0)::numeric AS total_expenses,
        
        -- Outstanding Balance: Calculate from orders and payments
        COALESCE((
            SELECT SUM(o.total_amount - COALESCE(p.total_paid, 0)) 
            FROM orders o 
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_paid 
                FROM payments 
                WHERE order_id IS NOT NULL
                GROUP BY order_id
            ) p ON o.id = p.order_id 
            WHERE (o.is_deleted = false OR o.is_deleted IS NULL)
            AND (o.total_amount - COALESCE(p.total_paid, 0)) > 0
        ), 0)::numeric AS balance_due,

        -- Total Orders Count
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false OR is_deleted IS NULL), 0)::bigint AS total_orders_count,
        
        -- Total Customers Count
        COALESCE((SELECT COUNT(*) FROM customers), 0)::bigint AS total_customers_count,

        -- Orders fully paid (balance <= 0)
        COALESCE((
            SELECT COUNT(*) 
            FROM orders o 
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_paid 
                FROM payments 
                WHERE order_id IS NOT NULL
                GROUP BY order_id
            ) p ON o.id = p.order_id 
            WHERE (o.is_deleted = false OR o.is_deleted IS NULL)
            AND (o.total_amount - COALESCE(p.total_paid, 0)) <= 0
        ), 0)::bigint AS orders_fully_paid_count,
        
        -- Orders partially paid
        COALESCE((
            SELECT COUNT(*) 
            FROM orders o 
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_paid 
                FROM payments 
                WHERE order_id IS NOT NULL
                GROUP BY order_id
            ) p ON o.id = p.order_id 
            WHERE (o.is_deleted = false OR o.is_deleted IS NULL)
            AND (o.total_amount - COALESCE(p.total_paid, 0)) > 0 
            AND COALESCE(p.total_paid, 0) > 0
        ), 0)::bigint AS orders_partial_count,
        
        -- Orders unpaid
        COALESCE((
            SELECT COUNT(*) 
            FROM orders o 
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_paid 
                FROM payments 
                WHERE order_id IS NOT NULL
                GROUP BY order_id
            ) p ON o.id = p.order_id 
            WHERE (o.is_deleted = false OR o.is_deleted IS NULL)
            AND COALESCE(p.total_paid, 0) = 0
            AND o.total_amount > 0
        ), 0)::bigint AS orders_due_count,
        
        -- Overdue Orders (simplified - just count orders past delivery date)
        COALESCE((
            SELECT COUNT(*) 
            FROM orders 
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND delivery_date < CURRENT_DATE
        ), 0)::bigint AS orders_overdue_count,

        -- Stock Alerts (if materials table exists)
        COALESCE((
            SELECT COUNT(*) 
            FROM materials 
            WHERE current_stock <= minimum_stock_level
        ), 0)::bigint AS stock_alerts_count;
END;
$$;
