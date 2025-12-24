-- Add System Alerts Triggers
-- 1. Ensure admin_notifications table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  link_to TEXT,
  related_id TEXT,
  triggered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS (if not enabled)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy (Simplified for admin access - refining previous broad policy)
-- Note: Ideally this should check for admin role, keeping consistent with previous file for now
CREATE POLICY "Allow authenticated read admin_notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (true);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'admin_notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
  END IF;
END $$;

-- 2. Low Stock Trigger
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  threshold INTEGER := 10; -- Default threshold
  curr_qty INTEGER;
  prev_qty INTEGER;
BEGIN
  -- Calculate quantities
  curr_qty := (NEW.quantity_in - COALESCE(NEW.quantity_used, 0));
  prev_qty := (OLD.quantity_in - COALESCE(OLD.quantity_used, 0));

  -- Check if we just crossed the threshold downwards
  IF (prev_qty > threshold) AND (curr_qty <= threshold) THEN
    INSERT INTO public.admin_notifications (type, title, message, link_to, related_id, triggered_by)
    VALUES (
      'low_stock',
      'Low Stock Alert: ' || NEW.item_name,
      'Stock level for ' || NEW.item_name || ' has dropped to ' || curr_qty || ' (Threshold: ' || threshold || ')',
      '/stock',
      NEW.id::text,
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_low_stock ON public.stock;
CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE ON public.stock
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();

-- 3. High Value Order Trigger
CREATE OR REPLACE FUNCTION check_high_value_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_amount > 10000 THEN
    INSERT INTO public.admin_notifications (type, title, message, link_to, related_id, triggered_by)
    VALUES (
      'high_value_order',
      'High Value Order: #' || NEW.id,
      'A new high value order of ₹' || NEW.total_amount || ' has been placed.',
      '/orders?highlight=' || NEW.id,
      NEW.id::text,
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_high_value_order ON public.orders;
CREATE TRIGGER trigger_check_high_value_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION check_high_value_order();
