-- Updated dashboard metrics function to use payments table for accurate totals

DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
DROP FUNCTION IF EXISTS get_dashboard_metrics();
DROP FUNCTION IF EXISTS get_dashboard_metrics_table();

-- Create function using payments table for accurate revenue calculation
CREATE OR REPLACE FUNCTION get_dashboard_metrics_table()
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
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Total Revenue: Sum of all payments received (most accurate)
        COALESCE((SELECT SUM(amount_paid) FROM payments), 0)::numeric,
        -- Total Amount Paid: Same as total_revenue
        COALESCE((SELECT SUM(amount_paid) FROM payments), 0)::numeric,
        -- Total Expenses
        COALESCE((SELECT SUM(amount) FROM expenses), 0)::numeric,
        -- Outstanding Balance: Calculate difference between order totals and payments
        COALESCE((
            SELECT SUM(o.total_amount) - COALESCE(SUM(p.total_payments), 0)
            FROM orders o
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_payments
                FROM payments
                GROUP BY order_id
            ) p ON o.id = p.order_id
            WHERE o.is_deleted = false
        ), 0)::numeric,
        -- Total Orders Count
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false), 0)::bigint,
        -- Total Customers Count
        COALESCE((SELECT COUNT(*) FROM customers), 0)::bigint,
        -- Orders fully paid (where total payments >= order total)
        COALESCE((
            SELECT COUNT(*)
            FROM orders o
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_payments
                FROM payments
                GROUP BY order_id
            ) p ON o.id = p.order_id
            WHERE o.is_deleted = false
            AND COALESCE(p.total_payments, 0) >= o.total_amount
        ), 0)::bigint,
        -- Orders partially paid (some payments but not fully paid)
        COALESCE((
            SELECT COUNT(*)
            FROM orders o
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_payments
                FROM payments
                GROUP BY order_id
            ) p ON o.id = p.order_id
            WHERE o.is_deleted = false
            AND COALESCE(p.total_payments, 0) > 0
            AND COALESCE(p.total_payments, 0) < o.total_amount
        ), 0)::bigint,
        -- Orders unpaid (no payments)
        COALESCE((
            SELECT COUNT(*)
            FROM orders o
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_payments
                FROM payments
                GROUP BY order_id
            ) p ON o.id = p.order_id
            WHERE o.is_deleted = false
            AND COALESCE(p.total_payments, 0) = 0
        ), 0)::bigint,
        -- Overdue Orders (past delivery date and not fully paid)
        COALESCE((
            SELECT COUNT(*)
            FROM orders o
            LEFT JOIN (
                SELECT order_id, SUM(amount_paid) as total_payments
                FROM payments
                GROUP BY order_id
            ) p ON o.id = p.order_id
            WHERE o.is_deleted = false
            AND o.delivery_date < CURRENT_DATE
            AND COALESCE(p.total_payments, 0) < o.total_amount
        ), 0)::bigint,
        -- Stock Alerts
        COALESCE((SELECT COUNT(*) FROM materials WHERE current_stock <= minimum_stock_level), 0)::bigint;
END;
$$ LANGUAGE plpgsql;
