CREATE OR REPLACE FUNCTION get_sales_analysis_report(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    top_products jsonb;
    top_customers jsonb;
BEGIN
    -- Aggregate top selling products/services by revenue
    SELECT COALESCE(jsonb_agg(t ORDER BY total_revenue DESC), '[]'::jsonb)
    INTO top_products
    FROM (
        SELECT
            order_type,
            SUM(quantity) as total_quantity,
            SUM(total_amount) as total_revenue
        FROM
            orders
        WHERE
            (p_start_date IS NULL OR order_date >= p_start_date) AND
            (p_end_date IS NULL OR order_date <= p_end_date)
        GROUP BY
            order_type
        ORDER BY
            total_revenue DESC
        LIMIT 10
    ) t;

    -- Aggregate top customers by revenue
    SELECT COALESCE(jsonb_agg(c ORDER BY total_spent DESC), '[]'::jsonb)
    INTO top_customers
    FROM (
        SELECT
            o.customer_id,
            c.name as customer_name,
            COUNT(o.id) as total_orders,
            SUM(o.total_amount) as total_spent
        FROM
            orders o
        JOIN
            customers c ON o.customer_id = c.id
        WHERE
            (p_start_date IS NULL OR o.order_date >= p_start_date) AND
            (p_end_date IS NULL OR o.order_date <= p_end_date)
        GROUP BY
            o.customer_id, c.name
        ORDER BY
            total_spent DESC
        LIMIT 10
    ) c;

    -- Return results as a single JSON object
    RETURN jsonb_build_object(
        'top_products', top_products,
        'top_customers', top_customers
    );
END;
$$;
