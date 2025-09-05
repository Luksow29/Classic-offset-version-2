-- Simple test to check if function is working and data exists

-- Test 1: Check if our function exists and can be called
SELECT 'Function Test' as test_name, * FROM public.get_dashboard_metrics();

-- Test 2: Direct data check (this should show your data)
SELECT 'Direct Orders Data' as test_name, 
       SUM(amount_received) as total_received,
       SUM(balance_amount) as total_balance,
       COUNT(*) as order_count
FROM orders 
WHERE is_deleted = false;

-- Test 3: Check all orders (to see if is_deleted filtering is the issue)
SELECT 'All Orders Data' as test_name, 
       SUM(amount_received) as total_received,
       SUM(balance_amount) as total_balance,
       COUNT(*) as order_count
FROM orders;

-- Test 4: Check individual orders
SELECT 'Individual Orders' as test_name, 
       id, total_amount, amount_received, balance_amount, is_deleted
FROM orders 
WHERE id IN (1, 2);
