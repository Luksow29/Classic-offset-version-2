-- Test Order Chat Admin View
-- Run this to create sample data to test the admin interface

-- Check if there are any threads already
select 'Existing Threads:' as info, count(*)::text as count from order_chat_threads;

-- Check if there are any messages already
select 'Existing Messages:' as info, count(*)::text as count from order_chat_messages;

-- If you want to create test data, uncomment the sections below:

-- Test: Insert a sample thread (only if none exist)
/*
INSERT INTO order_chat_threads (order_id, customer_id, subject, priority, status)
SELECT 
    (SELECT id FROM orders LIMIT 1), -- Use first available order
    (SELECT id FROM auth.users LIMIT 1), -- Use first available user
    'Test Order Discussion',
    'normal',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM order_chat_threads LIMIT 1);
*/

-- Test: Insert sample messages (only if thread exists)
/*
INSERT INTO order_chat_messages (thread_id, sender_id, sender_type, message_type, content)
SELECT 
    t.id,
    t.customer_id,
    'customer',
    'text',
    'Hello, I have a question about my order #' || t.order_id
FROM order_chat_threads t
WHERE NOT EXISTS (SELECT 1 FROM order_chat_messages WHERE thread_id = t.id)
LIMIT 1;

INSERT INTO order_chat_messages (thread_id, sender_id, sender_type, message_type, content)
SELECT 
    t.id,
    'admin-user-id',
    'admin',
    'text',
    'Hi! Thanks for reaching out. How can I help you with your order?'
FROM order_chat_threads t
WHERE EXISTS (SELECT 1 FROM order_chat_messages WHERE thread_id = t.id AND sender_type = 'customer')
AND NOT EXISTS (SELECT 1 FROM order_chat_messages WHERE thread_id = t.id AND sender_type = 'admin')
LIMIT 1;
*/

-- Query to see sample data for testing admin interface
SELECT 
    'Sample Thread Data:' as info,
    t.id,
    t.order_id,
    t.subject,
    t.status,
    t.created_at
FROM order_chat_threads t
LIMIT 3;

SELECT 
    'Sample Message Data:' as info,
    m.id,
    m.thread_id,
    m.sender_type,
    LEFT(m.content, 50) as content_preview,
    m.created_at
FROM order_chat_messages m
ORDER BY m.created_at DESC
LIMIT 5;
