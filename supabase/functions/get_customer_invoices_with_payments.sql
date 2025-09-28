CREATE OR REPLACE FUNCTION get_customer_invoices_with_payments(p_customer_id UUID)
RETURNS TABLE(
    order_id INT,
    order_date TEXT,
    customer_name TEXT,
    total_amount NUMERIC,
    balance_due NUMERIC,
    status TEXT,
    payments JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS order_id,
        o.date::TEXT AS order_date,
        o.customer_name,
        o.total_amount,
        o.balance_amount AS balance_due,
        CASE
            WHEN o.balance_amount <= 0 THEN 'Paid'
            WHEN o.balance_amount > 0 AND o.amount_received > 0 THEN 'Partial'
            ELSE 'Due'
        END AS status,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'amount_paid', p.amount_paid,
                    'payment_date', p.payment_date::TEXT,
                    'payment_method', p.payment_method,
                    'notes', p.notes
                )
            )
            FROM payments p
            WHERE p.order_id = o.id
        ) AS payments
    FROM
        orders o
    WHERE
        o.customer_id = p_customer_id
    ORDER BY
        o.date DESC;
END;
$$ LANGUAGE plpgsql;
