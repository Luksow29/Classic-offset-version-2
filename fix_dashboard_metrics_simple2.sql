-- Alternative function creation without explicit schema

DROP FUNCTION IF EXISTS get_dashboard_metrics();

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
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
        -- Use simple queries that should definitely work
        (SELECT COALESCE(SUM(amount_received), 0) FROM orders WHERE is_deleted = false)::numeric,
        (SELECT COALESCE(SUM(amount_received), 0) FROM orders WHERE is_deleted = false)::numeric,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses)::numeric,
        (SELECT COALESCE(SUM(balance_amount), 0) FROM orders WHERE is_deleted = false AND balance_amount > 0)::numeric,
        (SELECT COUNT(*) FROM orders WHERE is_deleted = false)::bigint,
        (SELECT COUNT(*) FROM customers)::bigint,
        (SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount = 0)::bigint,
        (SELECT COUNT(*) FROM orders WHERE is_deleted = false AND balance_amount > 0 AND amount_received > 0)::bigint,
        (SELECT COUNT(*) FROM orders WHERE is_deleted = false AND amount_received = 0)::bigint,
        (SELECT COUNT(*) FROM orders WHERE is_deleted = false AND delivery_date < CURRENT_DATE AND balance_amount > 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM materials WHERE current_stock <= minimum_stock_level), 0)::bigint;
END;
$$;
