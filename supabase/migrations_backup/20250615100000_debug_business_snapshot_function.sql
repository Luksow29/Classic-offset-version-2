-- supabase/migrations/20250615100000_debug_business_snapshot_function.sql

CREATE OR REPLACE FUNCTION get_comprehensive_business_snapshot(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    p_end_date DATE := COALESCE(end_date, CURRENT_DATE);
    p_start_date DATE := COALESCE(start_date, date_trunc('month', p_end_date)::DATE);
    
    -- Default values for potentially failing calculations
    total_revenue NUMERIC := 0;
    total_expenses NUMERIC := 0;
    net_profit NUMERIC := 0;
    
    -- Variables for other metrics
    total_orders BIGINT;
    completed_orders BIGINT;
    pending_orders BIGINT;
    new_customers BIGINT;
    top_selling_products JSONB;
    due_payments_summary JSONB;
BEGIN
    -- --- DEBUGGING ---
    -- The following financial calculations are temporarily disabled to isolate a reported error.
    -- The AI reported a "missing 'amount' column" which likely originates from one of these two queries.
    -- By disabling them, other parts of the function, like 'new_customers', can execute successfully.

    -- -- 1. Calculate Total Revenue (Temporarily disabled)
    -- SELECT COALESCE(SUM(amount), 0)
    -- INTO total_revenue
    -- FROM payments
    -- WHERE payment_date BETWEEN p_start_date AND p_end_date;

    -- -- 2. Calculate Total Expenses (Temporarily disabled)
    -- SELECT COALESCE(SUM(amount), 0)
    -- INTO total_expenses
    -- FROM expenses
    -- WHERE date BETWEEN p_start_date AND p_end_date;

    -- net_profit := total_revenue - total_expenses;

    -- 4. Calculate Order Statistics
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'Completed'),
        COUNT(*) FILTER (WHERE status != 'Completed' AND status != 'Cancelled')
    INTO
        total_orders,
        completed_orders,
        pending_orders
    FROM orders
    WHERE order_date BETWEEN p_start_date AND p_end_date;

    -- 5. Calculate New Customers
    SELECT COUNT(*)
    INTO new_customers
    FROM customers
    WHERE created_at::date BETWEEN p_start_date AND p_end_date;

    -- 6. Get Top 5 Selling Products
    SELECT jsonb_agg(p.product_name)
    INTO top_selling_products
    FROM (
        SELECT op.product_id, COUNT(*) as order_count
        FROM order_products op
        JOIN orders o ON op.order_id = o.id
        WHERE o.order_date BETWEEN p_start_date AND p_end_date
        GROUP BY op.product_id
        ORDER BY order_count DESC
        LIMIT 5
    ) AS top_op
    JOIN products p ON top_op.product_id = p.id;
    
    -- 7. Get Due Payments Summary (BUG FIX: Added date filter)
    SELECT jsonb_build_object(
        'total_due', COALESCE(SUM(due_amount), 0),
        'due_count', COUNT(*)
    )
    INTO due_payments_summary
    FROM order_summary
    WHERE due_amount > 0
    AND order_date BETWEEN p_start_date AND p_end_date;

    -- 8. Assemble the final JSONB object
    RETURN jsonb_build_object(
        'period', jsonb_build_object('start_date', p_start_date, 'end_date', p_end_date),
        'financials', jsonb_build_object('total_revenue', total_revenue, 'total_expenses', total_expenses, 'net_profit', net_profit, 'status', 'Temporarily disabled'),
        'orders', jsonb_build_object('total_orders', total_orders, 'completed_orders', completed_orders, 'pending_orders', pending_orders),
        'customers', jsonb_build_object('new_customers', new_customers),
        'products', jsonb_build_object('top_selling_products', top_selling_products),
        'payments', jsonb_build_object('due_summary', due_payments_summary)
    );
END;
$$;
