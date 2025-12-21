-- Migration: Setup push_subscriptions table with proper structure
-- This will create the table if it doesn't exist, or add missing columns if it does

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT DEFAULT 'customer',
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  browser_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add user_type if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN user_type TEXT DEFAULT 'customer';
  END IF;
  
  -- Add p256dh_key if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'p256dh_key'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN p256dh_key TEXT;
  END IF;
  
  -- Add auth_key if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'auth_key'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN auth_key TEXT;
  END IF;
  
  -- Add browser_info if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'browser_info'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN browser_info JSONB;
  END IF;
  
  -- Add is_active if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add last_used if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'last_used'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN last_used TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add expires_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE push_subscriptions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can create their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

-- RLS Policy: Users can view their own subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own subscriptions
CREATE POLICY "Users can create their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own subscriptions
CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_type ON push_subscriptions(user_type);

-- Create function to automatically update last_used timestamp
CREATE OR REPLACE FUNCTION update_push_subscription_last_used()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be called when a notification is sent
  -- For now, it's just a placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push notification subscriptions for users across multiple devices';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'The push service endpoint URL (unique per device/browser)';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'The public key for encryption (base64 encoded)';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'The authentication secret for encryption (base64 encoded)';
COMMENT ON COLUMN push_subscriptions.browser_info IS 'JSONB object containing browser/device information (userAgent, platform, language)';
COMMENT ON COLUMN push_subscriptions.user_type IS 'Type of user (customer, admin, staff, etc.)';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN push_subscriptions.last_used IS 'Last time a notification was sent to this subscription';
COMMENT ON COLUMN push_subscriptions.expires_at IS 'When the subscription expires (optional)';

