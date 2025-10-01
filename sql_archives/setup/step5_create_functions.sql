-- ==============================================
-- STEP 5: CREATE HELPER FUNCTIONS
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
      recipient_id = user_uuid 
      AND recipient_type = user_type_param 
      AND read = false
      AND (expires_at IS NULL OR expires_at > NOW())
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
    id = ANY(notification_ids)
    AND recipient_id = user_uuid
    AND read = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  notification_type TEXT,
  title_text TEXT,
  message_text TEXT,
  recipient_type_param TEXT,
  recipient_id_param UUID DEFAULT NULL,
  sender_id_param UUID DEFAULT NULL,
  order_id_param BIGINT DEFAULT NULL,
  priority_param TEXT DEFAULT 'medium',
  data_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    type,
    title,
    message,
    recipient_type,
    recipient_id,
    sender_id,
    order_id,
    priority,
    data
  ) VALUES (
    notification_type,
    title_text,
    message_text,
    recipient_type_param,
    recipient_id_param,
    sender_id_param,
    order_id_param,
    priority_param,
    data_param
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
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
    COUNT(CASE WHEN read_by_recipient = false AND sender_id != user_uuid THEN 1 END)::INTEGER as unread_messages,
    MAX(created_at) as last_message_at,
    (
      SELECT sender_type 
      FROM order_messages om2 
      WHERE om2.order_id = order_id_param 
        AND om2.deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 1
    ) as last_message_from
  FROM order_messages
  WHERE 
    order_id = order_id_param 
    AND deleted_at IS NULL;
END;
$$;

SELECT 'Step 5: Helper functions created successfully!' as status;
