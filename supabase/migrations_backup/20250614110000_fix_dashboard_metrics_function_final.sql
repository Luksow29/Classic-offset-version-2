-- Migration to finally fix the get_dashboard_metrics function

-- Drop the existing function if it exists, to be safe
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

-- Recreate the function with the corrected logic and column names
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
    WITH metrics AS (
        SELECT
                -- Total Revenue: Sum of all received payments
                (SELECT COALESCE(SUM(amount_paid), 0) FROM public.payments) AS total_revenue,

            -- Total Amount Paid: Correctly sum `amount_paid` from payments
            (SELECT COALESCE(SUM(amount_paid), 0) FROM public.payments) AS total_paid,

            -- Total Expenses
            (SELECT COALESCE(SUM(amount), 0) FROM public.expenses) AS total_expenses,
            
            -- Outstanding Balance (Total Due)
            (SELECT COALESCE(SUM(balance_amount), 0) FROM public.orders WHERE is_deleted = false) AS balance_due,

            -- Total Orders Count
            (SELECT COUNT(*) FROM public.orders WHERE is_deleted = false) AS total_orders_count,
            
            -- Total Customers Count
            (SELECT COUNT(*) FROM public.customers) AS total_customers_count,

            -- Order Status Breakdown (Corrected Logic)
            (SELECT COUNT(*) FROM public.orders WHERE balance_amount <= 0 AND is_deleted = false) AS orders_fully_paid_count,
            (SELECT COUNT(*) FROM public.orders WHERE balance_amount > 0 AND amount_received > 0 AND is_deleted = false) AS orders_partial_count,
            (SELECT COUNT(*) FROM public.orders WHERE amount_received = 0 AND balance_amount > 0 AND is_deleted = false) AS orders_due_count,
            
            -- Overdue Orders
            (SELECT COUNT(*) FROM public.orders WHERE delivery_date < CURRENT_DATE AND id NOT IN (SELECT order_id FROM public.order_status_log WHERE status = 'Delivered' OR status = 'Completed') AND is_deleted = false) AS orders_overdue_count,

            -- Low Stock Alerts
            (SELECT COUNT(*) FROM public.materials WHERE current_stock <= minimum_stock_level) AS stock_alerts_count
    )
    SELECT
        m.total_revenue,
        m.total_paid,
        m.total_expenses,
        m.balance_due,
        m.total_orders_count,
        m.total_customers_count,
        m.orders_fully_paid_count,
        m.orders_partial_count,
        m.orders_due_count,
        m.orders_overdue_count,
        m.stock_alerts_count
    FROM metrics m;
END;
$$;
