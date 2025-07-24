-- Migration to add customer_id to the all_order_summary view.

-- 1. Drop the existing view
DROP VIEW IF EXISTS public.all_order_summary;

-- 2. Create the new view with customer_id included
CREATE OR REPLACE VIEW public.all_order_summary AS
SELECT
    o.id AS order_id,
    o.customer_id, -- ✅ customer_id சேர்க்கப்பட்டது
    c.name AS customer_name,
    c.phone AS customer_phone,
    o.total_amount,
    o.date AS order_date,
    COALESCE(p.paid_amount, 0) AS amount_paid,
    (o.total_amount - COALESCE(p.paid_amount, 0)) AS balance_due,
    osl.status,
    o.order_type, -- order_type சேர்க்கப்பட்டது
    o.delivery_date -- delivery_date சேர்க்கப்பட்டது
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
