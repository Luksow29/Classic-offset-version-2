-- Create function that definitely works with your data
-- Using exactly the same column names and structure you have

DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
DROP FUNCTION IF EXISTS get_dashboard_metrics();

-- Create in default schema
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_revenue', COALESCE((SELECT SUM(amount_received) FROM orders WHERE is_deleted = false), 0),
        'total_paid', COALESCE((SELECT SUM(amount_received) FROM orders WHERE is_deleted = false), 0),
        'total_expenses', COALESCE((SELECT SUM(amount) FROM expenses), 0),
        'balance_due', COALESCE((SELECT SUM(balance_amount) FROM orders WHERE is_deleted = false), 0),
        'total_orders_count', COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false), 0),
        'total_customers_count', COALESCE((SELECT COUNT(*) FROM customers), 0),
        'orders_fully_paid_count', COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount = 0), 0),
        'orders_partial_count', COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount > 0 AND amount_received > 0), 0),
        'orders_due_count', COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND amount_received = 0), 0),
        'orders_overdue_count', COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND delivery_date < CURRENT_DATE AND balance_amount > 0), 0),
        'stock_alerts_count', 0
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Test the function
SELECT get_dashboard_metrics();

-- Also create the original format function
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
        COALESCE((SELECT SUM(amount_received) FROM orders WHERE is_deleted = false), 0)::numeric,
        COALESCE((SELECT SUM(amount_received) FROM orders WHERE is_deleted = false), 0)::numeric,
        COALESCE((SELECT SUM(amount) FROM expenses), 0)::numeric,
        COALESCE((SELECT SUM(balance_amount) FROM orders WHERE is_deleted = false), 0)::numeric,
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false), 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM customers), 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount = 0), 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount > 0 AND amount_received > 0), 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND amount_received = 0), 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM orders WHERE is_deleted = false AND delivery_date < CURRENT_DATE AND balance_amount > 0), 0)::bigint,
        0::bigint;
END;
$$ LANGUAGE plpgsql;
