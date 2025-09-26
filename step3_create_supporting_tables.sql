-- ==============================================
-- STEP 3: CREATE SUPPORTING TABLES
-- ==============================================

-- Push Subscriptions Table
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

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User info
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'admin')) NOT NULL,
  
  -- Preference settings
  notification_type TEXT NOT NULL,
  channels TEXT[] DEFAULT ARRAY['in_app'],
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

SELECT 'Step 3: Supporting tables created successfully!' as status;
