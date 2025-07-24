-- Migration to create a new view for all order summaries, regardless of due status.

-- 1. Create the new view `all_order_summary`
CREATE OR REPLACE VIEW public.all_order_summary AS
SELECT
    o.id AS order_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    o.total_amount,
    o.date AS order_date,
    COALESCE(p.paid_amount, 0) AS amount_paid,
    (o.total_amount - COALESCE(p.paid_amount, 0)) AS balance_due,
    osl.status
FROM
    orders o
JOIN
    customers c ON o.customer_id = c.id
LEFT JOIN (
    SELECT
        order_id,
        SUM(amount_paid) AS paid_amount
    FROM
        payments
    GROUP BY
        order_id
) p ON o.id = p.order_id
LEFT JOIN LATERAL (
    SELECT status
    FROM order_status_log
    WHERE order_id = o.id
    ORDER BY updated_at DESC
    LIMIT 1
) osl ON true;
