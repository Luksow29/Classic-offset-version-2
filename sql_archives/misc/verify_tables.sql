-- ==============================================
-- VERIFICATION: CHECK TABLE STRUCTURE
-- ==============================================

-- Check which tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'order_messages', 'push_subscriptions', 'notification_preferences')
ORDER BY table_name;

-- Check columns in notifications table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE 'Notifications table exists - checking columns...';
        RAISE NOTICE 'Use separate query to see column details';
    ELSE
        RAISE NOTICE 'Notifications table does not exist';
    END IF;
END
$$;

-- List all columns in notifications table (separate query)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if orders table exists (for foreign key references)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
        THEN 'Orders table exists - foreign keys can be added'
        ELSE 'Orders table does not exist - foreign keys will be skipped'
    END as orders_table_status;

-- Check current user and role
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

SELECT 'Verification completed!' as status;
