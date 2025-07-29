CREATE OR REPLACE VIEW public.order_payments_view AS
SELECT
    o.id AS order_id,
    o.customer_name,
    o.customer_phone,
    o.total_amount AS order_total_amount,
    o.amount_received AS order_amount_paid,
    o.balance_amount AS order_balance_due,
    CASE
        WHEN o.balance_amount <= 0 THEN 'Paid'::text
        WHEN o.amount_received > 0 THEN 'Partial'::text
        ELSE 'Due'::text
    END AS order_status,
    p.id AS payment_id,
    p.customer_id,
    p.amount_paid AS payment_amount,
    p.due_date AS payment_due_date,
    p.status AS payment_status,
    p.payment_method,
    p.notes AS payment_notes,
    p.created_at AS payment_created_at,
    p.updated_at AS payment_updated_at,
    o.created_at,
    o.delivery_date as due_date
FROM
    orders o
LEFT JOIN
    payments p ON o.id = p.order_id;
