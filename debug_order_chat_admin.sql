-- DEBUG ORDER CHAT ADMIN - Check what data exists
-- Run this to see if the admin app should be finding data

-- 1. Check if there are any order chat threads
SELECT 'ORDER CHAT THREADS:' as info;
SELECT 
    id,
    order_id,
    customer_id,
    subject,
    status,
    priority,
    created_at,
    last_message_at
FROM order_chat_threads 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any order chat messages
SELECT 'ORDER CHAT MESSAGES:' as info;
SELECT 
    id,
    thread_id,
    sender_id,
    sender_type,
    message_type,
    LEFT(content, 100) as content_preview,
    created_at
FROM order_chat_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check the relationship between threads and customers
SELECT 'THREAD-CUSTOMER RELATIONSHIP:' as info;
SELECT 
    t.id as thread_id,
    t.customer_id as auth_user_id,
    c.id as customer_table_id,
    c.name as customer_name,
    c.user_id as customer_user_id_ref
FROM order_chat_threads t
LEFT JOIN customers c ON c.user_id = t.customer_id
LIMIT 5;

-- 4. Check the relationship between threads and orders
SELECT 'THREAD-ORDER RELATIONSHIP:' as info;
SELECT 
    t.id as thread_id,
    t.order_id,
    o.id as order_table_id,
    o.order_type,
    o.total_amount,
    o.customer_name as order_customer_name
FROM order_chat_threads t
LEFT JOIN orders o ON o.id = t.order_id
LIMIT 5;

-- 5. Check auth users that have created threads
SELECT 'AUTH USERS WITH THREADS:' as info;
SELECT 
    au.id as auth_user_id,
    au.email,
    count(t.id) as thread_count
FROM auth.users au
LEFT JOIN order_chat_threads t ON t.customer_id = au.id
WHERE t.id IS NOT NULL
GROUP BY au.id, au.email;

-- 6. RLS Status check
SELECT 'RLS STATUS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('order_chat_threads', 'order_chat_messages')
AND schemaname = 'public';

-- 7. Count summary
SELECT 'SUMMARY:' as info;
SELECT 
    'Threads: ' || count(*) as threads_count
FROM order_chat_threads
UNION ALL
SELECT 
    'Messages: ' || count(*) as messages_count
FROM order_chat_messages
UNION ALL
SELECT 
    'Active Threads: ' || count(*) as active_threads_count
FROM order_chat_threads 
WHERE status = 'active';
