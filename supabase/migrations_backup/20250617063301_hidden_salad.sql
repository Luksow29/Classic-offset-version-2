/*
  # Fix order_summary_with_dues view

  1. New Tables
    - Updates the existing `order_summary_with_dues` view to include missing columns

  2. Changes
    - Add `customer_name` by joining with customers table
    - Add `delivery_date` from orders table
    - Rename `paid_amount` to `amount_paid` for frontend consistency
    - Rename `due_amount` to `balance_due` for frontend consistency
    - Add `due_status` field based on balance and delivery date
    - Filter out deleted orders
    - Fix payments join condition

  3. Security
    - Maintains existing RLS policies through underlying tables
*/

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.order_summary_with_dues;

-- Create the updated view with all required columns
CREATE OR REPLACE VIEW public.order_summary_with_dues AS
SELECT
    o.id AS order_id,
    o.customer_id,
    c.name AS customer_name,
    o.total_amount,
    o.date AS date,
    o.delivery_date,
    COALESCE(p.amount_paid, 0) AS amount_paid,
    (o.total_amount - COALESCE(p.amount_paid, 0)) AS balance_due,
    osl.status,
    CASE 
        WHEN (o.total_amount - COALESCE(p.amount_paid, 0)) <= 0 THEN 'paid'
        WHEN o.delivery_date < CURRENT_DATE AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0 THEN 'overdue'
        WHEN o.delivery_date = CURRENT_DATE AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0 THEN 'due_today'
        ELSE 'pending'
    END AS due_status
FROM
    orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN (
    SELECT
        order_id,
        SUM(amount_paid) AS amount_paid
    FROM
        payments
    WHERE deleted_at IS NULL
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
    o.deleted_at IS NULL
    AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0;