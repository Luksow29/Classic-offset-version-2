-- Test the get_dashboard_metrics function
SELECT * FROM public.get_dashboard_metrics();

-- Also check what data exists in payments table
SELECT COUNT(*) as payment_count, SUM(amount_paid) as total_payments FROM public.payments;

-- Check orders data
SELECT COUNT(*) as order_count, SUM(total_amount) as total_order_amount, SUM(balance_amount) as total_balance FROM public.orders WHERE is_deleted = false;
