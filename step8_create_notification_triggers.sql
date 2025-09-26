-- ==============================================
-- STEP 8: CREATE AUTO-NOTIFICATION TRIGGERS
-- ==============================================

-- Trigger 1: Order Status Change Notifications
-- ==============================================

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_message TEXT;
  admin_message TEXT;
  customer_user_id UUID;
  order_info RECORD;
BEGIN
  -- Get order information
  SELECT * INTO order_info FROM orders WHERE id = NEW.order_id;
  
  -- Skip if no order found
  IF order_info IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get customer user_id if exists
  SELECT user_id INTO customer_user_id 
  FROM customers 
  WHERE id = order_info.customer_id;

  -- Define messages based on status
  CASE NEW.status
    WHEN 'Design' THEN
      customer_message := 'Great news! Your order is now in the design phase. Our creative team is working on your project.';
      admin_message := 'Order #' || NEW.order_id || ' moved to Design phase for ' || order_info.customer_name;
    WHEN 'Printing' THEN
      customer_message := 'Excellent! Your order is now being printed. We''ll notify you once it''s ready.';
      admin_message := 'Order #' || NEW.order_id || ' is now in Printing phase for ' || order_info.customer_name;
    WHEN 'Delivered' THEN
      customer_message := 'Your order has been delivered successfully! Thank you for choosing Classic Offset!';
      admin_message := 'Order #' || NEW.order_id || ' has been delivered to ' || order_info.customer_name;
    ELSE
      customer_message := 'Your order status has been updated to: ' || NEW.status;
      admin_message := 'Order #' || NEW.order_id || ' status updated to ' || NEW.status || ' for ' || order_info.customer_name;
  END CASE;

  -- Send notification to customer (only if customer has user_id)
  IF customer_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id, type, title, message, link_to
    ) VALUES (
      customer_user_id,
      'order_update',
      'Order Status Updated',
      customer_message,
      '/orders/' || NEW.order_id
    );
  END IF;

  -- Send notification to all admin users
  INSERT INTO notifications (
    user_id, type, title, message, link_to
  )
  SELECT 
    u.id,
    'order_update',
    'Order Status Updated',
    admin_message,
    '/admin/orders/' || NEW.order_id
  FROM users u
  WHERE u.role IN ('admin', 'staff')
    AND u.id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Orders table doesn't have a status column - status tracking is done via order_status_log table
-- We'll create a trigger on order_status_log instead for status changes
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON order_status_log;
CREATE TRIGGER trigger_notify_order_status_change
  AFTER INSERT ON order_status_log
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- ==============================================
-- Trigger 2: Payment Received Notifications
-- ==============================================

CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  order_info RECORD;
  customer_user_id UUID;
  payment_method_display TEXT;
  remaining_balance NUMERIC;
BEGIN
  -- Get order information
  SELECT * INTO order_info FROM orders WHERE id = NEW.order_id;
  
  -- Get customer user_id if exists
  SELECT user_id INTO customer_user_id 
  FROM customers 
  WHERE id = NEW.customer_id;
  
  -- Format payment method for display
  payment_method_display := CASE 
    WHEN NEW.payment_method = 'Razorpay' THEN 'Online Payment'
    WHEN NEW.payment_method IS NULL THEN 'Cash'
    ELSE NEW.payment_method
  END;

  -- Calculate remaining balance
  remaining_balance := COALESCE(order_info.total_amount, 0) - COALESCE(NEW.amount_paid, 0);

  -- Notify customer about payment confirmation (only if customer has user_id)
  IF customer_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id, type, title, message, link_to
    ) VALUES (
      customer_user_id,
      'payment_received',
      'Payment Confirmed ✅',
      'Your payment of ₹' || COALESCE(NEW.amount_paid, 0)::text || ' has been received and confirmed. Thank you!' ||
      CASE 
        WHEN remaining_balance > 0 THEN ' Remaining balance: ₹' || remaining_balance::text
        ELSE ''
      END,
      '/orders/' || NEW.order_id
    );
  END IF;

  -- Notify admin about new payment
  INSERT INTO notifications (
    user_id, type, title, message, link_to
  )
  SELECT 
    u.id,
    'payment_received',
    '💰 Payment Received',
    'Payment of ₹' || COALESCE(NEW.amount_paid, 0)::text || ' received for Order #' || NEW.order_id::text || 
    ' from ' || COALESCE(order_info.customer_name, 'Unknown Customer') ||
    ' via ' || payment_method_display ||
    CASE 
      WHEN remaining_balance > 0 THEN '. Remaining: ₹' || remaining_balance::text
      ELSE '. Fully paid!'
    END,
    '/admin/payments/' || NEW.id
  FROM users u
  WHERE u.role IN ('admin', 'staff')
    AND u.id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS trigger_notify_payment_received ON payments;
CREATE TRIGGER trigger_notify_payment_received
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- ==============================================
-- Trigger 3: New Order Request Notifications  
-- ==============================================

CREATE OR REPLACE FUNCTION notify_new_order_request()
RETURNS TRIGGER AS $$
DECLARE
  customer_info RECORD;
  customer_user_id UUID;
  request_summary TEXT;
BEGIN
  -- Get customer information
  SELECT * INTO customer_info FROM customers WHERE id = NEW.customer_id;
  
  -- Get customer user_id if exists
  SELECT user_id INTO customer_user_id 
  FROM customers 
  WHERE id = NEW.customer_id;

  -- Create request summary from JSON data
  request_summary := 'Order Type: ' || COALESCE((NEW.request_data->>'orderType')::text, 'Not specified');
  IF NEW.request_data->>'quantity' IS NOT NULL THEN
    request_summary := request_summary || ', Qty: ' || (NEW.request_data->>'quantity')::text;
  END IF;
  IF NEW.request_data->>'deliveryDate' IS NOT NULL THEN
    request_summary := request_summary || ', Delivery: ' || (NEW.request_data->>'deliveryDate')::text;
  END IF;

  -- Notify customer about request submission (only if customer has user_id)
  IF customer_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id, type, title, message, link_to
    ) VALUES (
      customer_user_id,
      'order_update',
      'Order Request Submitted ✅',
      'Your order request has been submitted successfully. Our team will review and respond within 24 hours. ' || 
      request_summary,
      '/requests/' || NEW.id
    );
  END IF;

  -- Notify all admin users about new request (high priority)
  INSERT INTO notifications (
    user_id, type, title, message, link_to
  )
  SELECT 
    u.id,
    'order_update',
    '🆕 New Order Request',
    'New order request from ' || COALESCE(customer_info.name, 'Unknown Customer') || 
    CASE WHEN customer_info.phone IS NOT NULL THEN ' (' || customer_info.phone || ')' ELSE '' END ||
    '. ' || request_summary,
    '/admin/requests/' || NEW.id
  FROM users u
  WHERE u.role IN ('admin', 'staff')
    AND u.id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new order requests
DROP TRIGGER IF EXISTS trigger_notify_new_order_request ON order_requests;
CREATE TRIGGER trigger_notify_new_order_request
  AFTER INSERT ON order_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order_request();

-- ==============================================
-- Trigger 4: New Order Creation Notifications
-- ==============================================

CREATE OR REPLACE FUNCTION notify_new_order_created()
RETURNS TRIGGER AS $$
DECLARE
  customer_user_id UUID;
BEGIN  
  -- Get customer user_id if exists
  SELECT user_id INTO customer_user_id 
  FROM customers 
  WHERE id = NEW.customer_id;

  -- Notify customer about new order creation (only if customer has user_id)
  IF customer_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id, type, title, message, link_to
    ) VALUES (
      customer_user_id,
      'order_update',
      'New Order Created 🎉',
      'Your order #' || NEW.id || ' has been created successfully! ' ||
      'Order Type: ' || NEW.order_type || ', Quantity: ' || NEW.quantity ||
      CASE WHEN NEW.delivery_date IS NOT NULL THEN ', Expected Delivery: ' || NEW.delivery_date::text ELSE '' END ||
      '. Total Amount: ₹' || COALESCE(NEW.total_amount, 0)::text,
      '/orders/' || NEW.id
    );
  END IF;

  -- Notify admin about new order
  INSERT INTO notifications (
    user_id, type, title, message, link_to
  )
  SELECT 
    u.id,
    'order_update',
    '📝 New Order Created',
    'New order #' || NEW.id || ' created for ' || NEW.customer_name ||
    '. Type: ' || NEW.order_type || ', Qty: ' || NEW.quantity ||
    ', Amount: ₹' || COALESCE(NEW.total_amount, 0)::text,
    '/admin/orders/' || NEW.id
  FROM users u
  WHERE u.role IN ('admin', 'staff')
    AND u.id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new order creation
DROP TRIGGER IF EXISTS trigger_notify_new_order_created ON orders;
CREATE TRIGGER trigger_notify_new_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order_created();

-- ==============================================
-- Trigger 5: Payment Status Update Notifications
-- ==============================================

CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_user_id UUID;
  order_info RECORD;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get customer user_id and order info
  SELECT user_id INTO customer_user_id 
  FROM customers 
  WHERE id = NEW.customer_id;
  
  SELECT * INTO order_info FROM orders WHERE id = NEW.order_id;

  -- Notify customer about payment status change (only if customer has user_id)
  IF customer_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id, type, title, message, link_to
    ) VALUES (
      customer_user_id,
      'payment_received',
      CASE 
        WHEN NEW.status = 'Paid' THEN 'Payment Complete ✅'
        WHEN NEW.status = 'Partial' THEN 'Partial Payment Received'
        WHEN NEW.status = 'Due' THEN 'Payment Due'
        ELSE 'Payment Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'Paid' THEN 'Great! Your payment for Order #' || NEW.order_id || ' is now complete. Thank you!'
        WHEN NEW.status = 'Partial' THEN 'We have received a partial payment for Order #' || NEW.order_id || '. Remaining balance: ₹' || COALESCE(NEW.total_amount - NEW.amount_paid, 0)::text
        WHEN NEW.status = 'Due' THEN 'Payment for Order #' || NEW.order_id || ' is now due. Amount: ₹' || COALESCE(NEW.total_amount, 0)::text
        ELSE 'Payment status for Order #' || NEW.order_id || ' has been updated to: ' || NEW.status
      END,
      '/orders/' || NEW.order_id
    );
  END IF;

  -- Notify admin about payment status change
  INSERT INTO notifications (
    user_id, type, title, message, link_to
  )
  SELECT 
    u.id,
    'payment_received',
    '💳 Payment Status Updated',
    'Payment status for Order #' || NEW.order_id || ' (' || COALESCE(order_info.customer_name, 'Unknown') || 
    ') changed from ' || OLD.status || ' to ' || NEW.status ||
    '. Amount: ₹' || COALESCE(NEW.amount_paid, 0)::text || ' / ₹' || COALESCE(NEW.total_amount, 0)::text,
    '/admin/payments/' || NEW.id
  FROM users u
  WHERE u.role IN ('admin', 'staff')
    AND u.id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS trigger_notify_payment_status_change ON payments;
CREATE TRIGGER trigger_notify_payment_status_change
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_payment_status_change();

-- ==============================================
-- Test Data Insert Function (Optional)
-- ==============================================

-- Function to test notifications manually
CREATE OR REPLACE FUNCTION test_notification_system(test_user_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  result_text TEXT := '';
BEGIN
  -- Use a default admin user if none provided
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM users WHERE role = 'admin' LIMIT 1;
  END IF;
  
  IF test_user_id IS NULL THEN
    RETURN 'No admin user found to test with. Please provide a test_user_id.';
  END IF;

  -- Insert a test notification
  INSERT INTO notifications (
    user_id, type, title, message, link_to
  ) VALUES (
    test_user_id,
    'system_alert',
    '🧪 Notification System Test',
    'This is a test notification to verify the notification system is working correctly. Generated at: ' || NOW()::text,
    '/dashboard'
  );

  result_text := 'Test notification created successfully for user: ' || test_user_id::text;
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- Trigger Status Summary
-- ==============================================

SELECT 'Step 8: Auto-notification triggers created successfully!' as status;

-- Show created triggers
SELECT 
  'Trigger Status' as info,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%notify%'
ORDER BY event_object_table, trigger_name;
