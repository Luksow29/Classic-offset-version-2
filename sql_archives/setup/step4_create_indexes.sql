-- ==============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- First, check if notifications table exists and has the expected structure
DO $$
BEGIN
    -- Only create indexes if the table exists and has the required columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        
        -- Notifications table indexes (based on existing table structure)
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
        ON notifications(user_id, is_read);

        CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
        ON notifications(created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_notifications_type 
        ON notifications(type, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_notifications_unread 
        ON notifications(user_id, is_read) 
        WHERE is_read = false;

        CREATE INDEX IF NOT EXISTS idx_notifications_title 
        ON notifications(title);
        
        RAISE NOTICE 'Notifications table indexes created successfully (existing table structure)';
    ELSE
        RAISE NOTICE 'Notifications table does not exist - skipping indexes';
    END IF;
END
$$;

-- Check if order_messages table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_messages') THEN
        
        -- Order messages table indexes (based on existing table structure)
        CREATE INDEX IF NOT EXISTS idx_order_messages_order_id 
        ON order_messages(order_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_order_messages_unread 
        ON order_messages(order_id, read_by_recipient) 
        WHERE read_by_recipient = false;

        CREATE INDEX IF NOT EXISTS idx_order_messages_sender 
        ON order_messages(sender_id, sender_type);

        CREATE INDEX IF NOT EXISTS idx_order_messages_active 
        ON order_messages(order_id, created_at DESC) 
        WHERE deleted_at IS NULL;
        
        RAISE NOTICE 'Order messages table indexes created successfully';
    ELSE
        RAISE NOTICE 'Order messages table does not exist - skipping indexes';
    END IF;
END
$$;

-- Check if push_subscriptions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        
        -- Push subscriptions table indexes (based on existing table structure)
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
        ON push_subscriptions(user_id, user_type, is_active);

        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
        ON push_subscriptions(is_active, last_used);

        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
        ON push_subscriptions(endpoint);
        
        RAISE NOTICE 'Push subscriptions table indexes created successfully';
    ELSE
        RAISE NOTICE 'Push subscriptions table does not exist - skipping indexes';
    END IF;
END
$$;

-- Check if notification_preferences table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        
        -- Notification preferences table indexes (based on existing table structure)
        CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
        ON notification_preferences(user_id, user_type);

        CREATE INDEX IF NOT EXISTS idx_notification_preferences_type 
        ON notification_preferences(notification_type, enabled);
        
        RAISE NOTICE 'Notification preferences table indexes created successfully';
    ELSE
        RAISE NOTICE 'Notification preferences table does not exist - skipping indexes';
    END IF;
END
$$;

SELECT 'Step 4: Index creation process completed!' as status;
