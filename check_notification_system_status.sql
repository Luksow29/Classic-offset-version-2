-- ==============================================
-- NOTIFICATION SYSTEM STATUS CHECK
-- ==============================================

-- Check which notification-related tables exist
SELECT 
    'Table Existence Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'notifications',
        'order_messages', 
        'push_subscriptions',
        'notification_preferences'
    )
ORDER BY table_name;

-- Check notifications table structure
SELECT 
    'Notifications Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if RLS is enabled on notifications table
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'notifications',
        'order_messages', 
        'push_subscriptions',
        'notification_preferences'
    );

-- Check existing indexes on notifications table
SELECT 
    'Notifications Indexes' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename = 'notifications';

-- Check RLS policies on notifications table
SELECT 
    'RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'notifications';

SELECT '=== NOTIFICATION SYSTEM STATUS CHECK COMPLETE ===' as final_status;
