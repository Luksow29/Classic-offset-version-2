-- ==============================================
-- STEP 2: CREATE ORDER MESSAGES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message basics
  order_id BIGINT NOT NULL,
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
  reply_to_message_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Add foreign key constraints after confirming tables exist
-- ALTER TABLE order_messages ADD CONSTRAINT fk_order_messages_order_id FOREIGN KEY (order_id) REFERENCES orders(id);
-- ALTER TABLE order_messages ADD CONSTRAINT fk_order_messages_reply_to FOREIGN KEY (reply_to_message_id) REFERENCES order_messages(id);

SELECT 'Step 2: Order messages table created successfully!' as status;
