-- Debug: Check what data exists in your tables

-- Check payments table
SELECT 'PAYMENTS' as table_name, COUNT(*) as count, SUM(amount_paid) as total_amount FROM public.payments
UNION ALL
-- Check orders table  
SELECT 'ORDERS' as table_name, COUNT(*) as count, SUM(total_amount) as total_amount FROM public.orders WHERE is_deleted = false OR is_deleted IS NULL
UNION ALL
-- Check customers table
SELECT 'CUSTOMERS' as table_name, COUNT(*) as count, 0 as total_amount FROM public.customers
UNION ALL
-- Check expenses table
SELECT 'EXPENSES' as table_name, COUNT(*) as count, SUM(amount) as total_amount FROM public.expenses;

-- Check specific payments for orders 1 and 2
SELECT order_id, amount_paid, payment_date FROM public.payments WHERE order_id IN (1, 2);

-- Check orders 1 and 2
SELECT id, total_amount, balance_amount, amount_received, is_deleted FROM public.orders WHERE id IN (1, 2);
