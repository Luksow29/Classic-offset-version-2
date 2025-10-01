-- Step-by-Step Notification System Setup
-- Execute each section separately in Supabase SQL Editor
-- Date: 26 September 2025

-- ==============================================
-- STEP 1: CREATE NOTIFICATIONS TABLE
-- ==============================================

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
  order_id BIGINT,
  
  -- Priority and status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  
  -- Additional data
  data JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery tracking
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'],
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraint after confirming orders table exists
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_order_id FOREIGN KEY (order_id) REFERENCES orders(id);

SELECT 'Step 1: Notifications table created successfully!' as status;
