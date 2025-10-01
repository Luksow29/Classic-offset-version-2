-- Notification System Database Setup
-- Execute this in Supabase SQL Editor
-- Date: 26 September 2025

-- ==============================================
-- PART 1: CREATE TABLES
-- ==============================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic notification info
  type TEXT NOT NULL CHECK (type IN ('order_update', 'payment_received', 'quote_ready', 'delivery_update', 'message', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Recipients and sender
  recipient_type TEXT CHECK (recipient_type IN ('customer', 'admin', 'both')) NOT NULL,
  recipient_id UUID, -- NULL for all admins
  sender_id UUID,
  sender_type TEXT CHECK (sender_type IN ('customer', 'admin', 'system')),
  
  -- Related entities
  order_id BIGINT REFERENCES orders(id),
  
  -- Priority and status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  
  -- Additional data
  data JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]', -- Action buttons: [{action: 'view_order', label: 'View Order', url: '/orders/123'}]
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery tracking
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'push', 'sms']
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Add table comment
COMMENT ON TABLE notifications IS 'Stores all system notifications for customers and admins';

-- 2. Order Messages Table (In-app chat)
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message basics
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('customer', 'admin')) NOT NULL,
  
  -- Message content
  message_type TEXT CHECK (message_type IN ('text', 'file', 'voice', 'system')) DEFAULT 'text',
  content TEXT,
  
  -- File attachments
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- Message status
  read_by_recipient BOOLEAN DEFAULT false,
  reply_to_message_id UUID REFERENCES order_messages(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' -- {edited: true, forwarded: true, etc.}
);

-- Add table comment
COMMENT ON TABLE order_messages IS 'In-app messaging between customers and admin for specific orders';

-- 3. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User info
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'admin')) NOT NULL,
  
  -- Push subscription details
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Browser and device info
  browser_info JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add table comment
COMMENT ON TABLE push_subscriptions IS 'Browser push notification subscriptions for users';

-- 4. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User info
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'admin')) NOT NULL,
  
  -- Preference settings
  notification_type TEXT NOT NULL,
  channels TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'push', 'sms']
  enabled BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, user_type, notification_type)
);

-- Add table comment
COMMENT ON TABLE notification_preferences IS 'User preferences for different types of notifications';

-- ==============================================
-- PART 2: CREATE INDEXES
-- ==============================================

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
ON notifications(recipient_type, recipient_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_order_id 
ON notifications(order_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(recipient_id, read) 
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type_priority 
ON notifications(type, priority, created_at DESC);

-- Order messages table indexes
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

-- Push subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
ON push_subscriptions(user_id, user_type, is_active);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
ON push_subscriptions(is_active, last_used);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

-- Notification preferences table indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
ON notification_preferences(user_id, user_type);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_type 
ON notification_preferences(notification_type, enabled);

-- ==============================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (
  (notifications.recipient_type = 'customer' AND auth.uid()::text = notifications.recipient_id::text) OR
  (notifications.recipient_type = 'admin' AND auth.role() = 'authenticated') OR
  (notifications.recipient_type = 'both' AND auth.role() = 'authenticated')
);

CREATE POLICY "System can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Users can update own notification read status" 
ON notifications FOR UPDATE 
USING (
  (notifications.recipient_type = 'customer' AND auth.uid()::text = notifications.recipient_id::text) OR
  (notifications.recipient_type = 'admin' AND auth.role() = 'authenticated')
);

-- RLS Policies for order_messages table
CREATE POLICY "Users can view messages for their orders" 
ON order_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_messages.order_id 
    AND (
      orders.customer_id::text = auth.uid()::text OR 
      auth.role() = 'authenticated'
    )
  )
);

CREATE POLICY "Users can insert messages for their orders" 
ON order_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_messages.order_id 
    AND (
      orders.customer_id::text = auth.uid()::text OR 
      auth.role() = 'authenticated'
    )
  )
);

CREATE POLICY "Users can update own messages" 
ON order_messages FOR UPDATE 
USING (sender_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- RLS Policies for push_subscriptions table
CREATE POLICY "Users can manage own push subscriptions" 
ON push_subscriptions FOR ALL 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage all push subscriptions" 
ON push_subscriptions FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for notification_preferences table
CREATE POLICY "Users can manage own notification preferences" 
ON notification_preferences FOR ALL 
USING (auth.uid()::text = user_id::text);

-- ==============================================
-- PART 4: HELPER FUNCTIONS
-- ==============================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  user_uuid UUID,
  user_type_param TEXT DEFAULT 'customer'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications 
    WHERE 
      notifications.recipient_id = user_uuid 
      AND notifications.recipient_type = user_type_param 
      AND notifications.read = false
      AND (notifications.expires_at IS NULL OR notifications.expires_at > NOW())
  );
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  notification_ids UUID[],
  user_uuid UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET 
    read = true,
    read_at = NOW()
  WHERE 
    notifications.id = ANY(notification_ids)
    AND notifications.recipient_id = user_uuid
    AND notifications.read = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE 
    notifications.read = true 
    AND notifications.read_at < NOW() - INTERVAL '30 days';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired notifications
  DELETE FROM notifications
  WHERE 
    notifications.expires_at IS NOT NULL 
    AND notifications.expires_at < NOW();
    
  RETURN deleted_count;
END;
$$;

-- Function to get order message summary
CREATE OR REPLACE FUNCTION get_order_message_summary(
  order_id_param BIGINT,
  user_uuid UUID
)
RETURNS TABLE (
  total_messages INTEGER,
  unread_messages INTEGER,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_from TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_messages,
    COUNT(CASE WHEN read_by_recipient = false AND sender_id::text != user_uuid::text THEN 1 END)::INTEGER as unread_messages,
    MAX(created_at) as last_message_at,
    (SELECT sender_type FROM order_messages om2 WHERE om2.order_id = order_id_param ORDER BY created_at DESC LIMIT 1) as last_message_from
  FROM order_messages
  WHERE 
    order_id = order_id_param 
    AND deleted_at IS NULL;
END;
$$;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check if tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'order_messages', 'push_subscriptions', 'notification_preferences');

-- Check if indexes were created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('notifications', 'order_messages', 'push_subscriptions', 'notification_preferences')
ORDER BY tablename, indexname;

-- Check if functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_unread_notification_count',
  'mark_notifications_as_read', 
  'cleanup_old_notifications',
  'get_order_message_summary'
);

-- Success message
SELECT 'Notification system database setup completed successfully!' as status;
