-- Migration to fix the order_summary_with_dues view by adding the status and correcting column names.

-- 1. Drop the existing view if it exists
DROP VIEW IF EXISTS public.order_summary_with_dues;

-- 2. Create the new view with the correct status lookup and column names.
CREATE OR REPLACE VIEW public.order_summary_with_dues AS
SELECT
    o.id AS order_id,
    o.customer_id,
    o.total_amount,
    o.date AS date, -- Corrected: The column name is now 'date' as expected by the frontend.
    COALESCE(p.paid_amount, 0) AS paid_amount,
    (o.total_amount - COALESCE(p.paid_amount, 0)) AS due_amount,
    osl.status
FROM
    orders o
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
    ORDER BY created_at DESC
    LIMIT 1
) osl ON true
WHERE
    (o.total_amount - COALESCE(p.paid_amount, 0)) > 0;
