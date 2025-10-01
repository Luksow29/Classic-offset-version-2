-- Check the detailed payments table structure and data
-- This should show the individual payment entries you mentioned

SELECT 
    p.*,
    o.customer_name,
    o.total_amount as order_total
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.order_id IN (1, 2)
ORDER BY p.order_id, p.payment_date;
