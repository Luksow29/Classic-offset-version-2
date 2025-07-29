-- Enable Realtime for key tables
-- Run these commands in your Supabase SQL editor

-- Enable realtime for order status logs
ALTER PUBLICATION supabase_realtime ADD TABLE order_status_log;

-- Enable realtime for payments
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for whatsapp_log
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_log;

-- Enable realtime for expenses (for dashboard metrics)
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- RLS Policies for Realtime Access
-- Make sure users can read realtime updates based on their permissions

-- Example: Allow authenticated users to read order status updates
CREATE POLICY "Users can read order status updates" ON order_status_log
FOR SELECT USING (auth.role() = 'authenticated');

-- Example: Allow authenticated users to read payment updates
CREATE POLICY "Users can read payment updates" ON payments
FOR SELECT USING (auth.role() = 'authenticated');

-- Example: Allow authenticated users to read WhatsApp logs
CREATE POLICY "Users can read whatsapp logs" ON whatsapp_log
FOR SELECT USING (auth.role() = 'authenticated');
