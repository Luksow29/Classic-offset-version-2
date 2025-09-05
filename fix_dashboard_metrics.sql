-- Fix dashboard metrics to show revenue as received payments

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

-- Recreate the function with the corrected logic
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
            -- Total Revenue: Sum of all received payments (matches Amount Received)
            (SELECT COALESCE(SUM(amount_paid), 0) FROM public.payments) AS total_revenue,

            -- Total Amount Paid: Same as total_revenue now
            (SELECT COALESCE(SUM(amount_paid), 0) FROM public.payments) AS total_paid,

            -- Total Expenses
            (SELECT COALESCE(SUM(amount), 0) FROM public.expenses) AS total_expenses,
            
            -- Outstanding Balance: Update this to be calculated from payments
            (SELECT COALESCE(SUM(o.total_amount - COALESCE(p.amount_paid, 0)), 0) 
             FROM public.orders o 
             LEFT JOIN (
                 SELECT order_id, SUM(amount_paid) as amount_paid 
                 FROM public.payments 
                 GROUP BY order_id
             ) p ON o.id = p.order_id 
             WHERE o.is_deleted = false) AS balance_due,

            -- Total Orders Count
            (SELECT COUNT(*) FROM public.orders WHERE is_deleted = false) AS total_orders_count,
            
            -- Total Customers Count
            (SELECT COUNT(*) FROM public.customers) AS total_customers_count,

            -- Order Status Breakdown (Updated to use calculated balance)
            (SELECT COUNT(*) 
             FROM public.orders o 
             LEFT JOIN (
                 SELECT order_id, SUM(amount_paid) as amount_paid 
                 FROM public.payments 
                 GROUP BY order_id
             ) p ON o.id = p.order_id 
             WHERE (o.total_amount - COALESCE(p.amount_paid, 0)) <= 0 AND o.is_deleted = false) AS orders_fully_paid_count,
            
            (SELECT COUNT(*) 
             FROM public.orders o 
             LEFT JOIN (
                 SELECT order_id, SUM(amount_paid) as amount_paid 
                 FROM public.payments 
                 GROUP BY order_id
             ) p ON o.id = p.order_id 
             WHERE (o.total_amount - COALESCE(p.amount_paid, 0)) > 0 AND COALESCE(p.amount_paid, 0) > 0 AND o.is_deleted = false) AS orders_partial_count,
            
            (SELECT COUNT(*) 
             FROM public.orders o 
             LEFT JOIN (
                 SELECT order_id, SUM(amount_paid) as amount_paid 
                 FROM public.payments 
                 GROUP BY order_id
             ) p ON o.id = p.order_id 
             WHERE COALESCE(p.amount_paid, 0) = 0 AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0 AND o.is_deleted = false) AS orders_due_count,
            
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
