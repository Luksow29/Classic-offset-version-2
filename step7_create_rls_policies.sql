-- ==============================================
-- STEP 7: CREATE RLS POLICIES 
-- ==============================================

-- RLS Policies for notifications table (based on existing table structure)
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (
  auth.uid() = user_id OR auth.role() = 'service_role'
);

CREATE POLICY "System can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Users can update own notification read status" 
ON notifications FOR UPDATE 
USING (
  auth.uid() = user_id OR auth.role() = 'service_role'
);

-- RLS Policies for order_messages table
CREATE POLICY "Users can view messages for accessible orders" 
ON order_messages FOR SELECT 
USING (
  -- For now, allow authenticated users to view messages
  -- Later can be refined based on order ownership
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can insert messages" 
ON order_messages FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own messages" 
ON order_messages FOR UPDATE 
USING (sender_id = auth.uid() OR auth.role() = 'service_role');

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

SELECT 'Step 7: RLS policies created successfully!' as status;
