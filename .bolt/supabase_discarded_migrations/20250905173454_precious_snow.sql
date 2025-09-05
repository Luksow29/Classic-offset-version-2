/*
  # Fix Missing Database Functions
  
  This migration creates the missing database functions that are called by the frontend
  but don't exist in the current schema.
  
  1. Dashboard Functions
    - get_dashboard_metrics()
    - get_financial_summary()
  
  2. Search Functions
    - global_search()
  
  3. Utility Functions
    - Various helper functions referenced in frontend
*/

-- Create get_dashboard_metrics function
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_paid NUMERIC,
  total_expenses NUMERIC,
  balance_due NUMERIC,
  total_orders_count BIGINT,
  total_customers_count BIGINT,
  orders_fully_paid_count BIGINT,
  orders_partial_count BIGINT,
  orders_due_count BIGINT,
  orders_overdue_count BIGINT,
  stock_alerts_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(p.amount_paid), 0) as total_paid,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = p_user_id OR p_user_id IS NULL), 0) as total_expenses,
    COALESCE(SUM(o.total_amount - COALESCE(p.amount_paid, 0)), 0) as balance_due,
    COUNT(DISTINCT o.id) as total_orders_count,
    COUNT(DISTINCT c.id) as total_customers_count,
    COUNT(DISTINCT o.id) FILTER (WHERE COALESCE(p.amount_paid, 0) >= o.total_amount) as orders_fully_paid_count,
    COUNT(DISTINCT o.id) FILTER (WHERE COALESCE(p.amount_paid, 0) > 0 AND COALESCE(p.amount_paid, 0) < o.total_amount) as orders_partial_count,
    COUNT(DISTINCT o.id) FILTER (WHERE COALESCE(p.amount_paid, 0) = 0) as orders_due_count,
    COUNT(DISTINCT o.id) FILTER (WHERE o.delivery_date < CURRENT_DATE AND COALESCE(p.amount_paid, 0) < o.total_amount) as orders_overdue_count,
    COALESCE((SELECT COUNT(*) FROM material_stock_alerts WHERE is_resolved = false), 0) as stock_alerts_count
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  LEFT JOIN (
    SELECT order_id, SUM(amount_paid) as amount_paid
    FROM payments
    GROUP BY order_id
  ) p ON o.id = p.order_id
  WHERE (p_user_id IS NULL OR o.user_id = p_user_id)
    AND (o.is_deleted IS NULL OR o.is_deleted = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_financial_summary function
CREATE OR REPLACE FUNCTION get_financial_summary(p_user_id UUID, p_month TEXT)
RETURNS TABLE (
  orders INTEGER,
  revenue NUMERIC,
  received NUMERIC,
  expenses NUMERIC,
  balance_due NUMERIC
) AS $$
DECLARE
  start_date DATE;
  end_date DATE;
BEGIN
  -- Parse month parameter (YYYY-MM format)
  start_date := (p_month || '-01')::DATE;
  end_date := (start_date + INTERVAL '1 month - 1 day')::DATE;
  
  RETURN QUERY
  SELECT 
    COUNT(o.id)::INTEGER as orders,
    COALESCE(SUM(o.total_amount), 0) as revenue,
    COALESCE(SUM(p.amount_paid), 0) as received,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = p_user_id AND date BETWEEN start_date AND end_date), 0) as expenses,
    COALESCE(SUM(o.total_amount - COALESCE(p.amount_paid, 0)), 0) as balance_due
  FROM orders o
  LEFT JOIN (
    SELECT order_id, SUM(amount_paid) as amount_paid
    FROM payments
    GROUP BY order_id
  ) p ON o.id = p.order_id
  WHERE o.date BETWEEN start_date AND end_date
    AND (o.user_id = p_user_id OR p_user_id IS NULL)
    AND (o.is_deleted IS NULL OR o.is_deleted = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create global_search function
CREATE OR REPLACE FUNCTION global_search(search_term TEXT)
RETURNS TABLE (
  type TEXT,
  id TEXT,
  title TEXT,
  description TEXT,
  link TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Search customers
  SELECT 
    'customer'::TEXT as type,
    c.id::TEXT as id,
    c.name as title,
    COALESCE(c.phone || ' • ' || c.email, c.phone, c.email, 'No contact info') as description,
    '/customers'::TEXT as link
  FROM customers c
  WHERE c.name ILIKE '%' || search_term || '%'
     OR c.phone ILIKE '%' || search_term || '%'
     OR c.email ILIKE '%' || search_term || '%'
  LIMIT 5
  
  UNION ALL
  
  -- Search orders
  SELECT 
    'order'::TEXT as type,
    o.id::TEXT as id,
    'Order #' || o.id || ' - ' || o.customer_name as title,
    o.order_type || ' • ₹' || o.total_amount::TEXT as description,
    '/orders?highlight=' || o.id as link
  FROM orders o
  WHERE o.id::TEXT ILIKE '%' || search_term || '%'
     OR o.customer_name ILIKE '%' || search_term || '%'
     OR o.order_type ILIKE '%' || search_term || '%'
     AND (o.is_deleted IS NULL OR o.is_deleted = false)
  LIMIT 5
  
  UNION ALL
  
  -- Search products
  SELECT 
    'product'::TEXT as type,
    p.id::TEXT as id,
    p.name as title,
    p.category || ' • ₹' || p.unit_price::TEXT as description,
    '/products'::TEXT as link
  FROM products p
  WHERE p.name ILIKE '%' || search_term || '%'
     OR p.category ILIKE '%' || search_term || '%'
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper functions for recent data
CREATE OR REPLACE FUNCTION get_recent_pending_orders()
RETURNS TABLE (
  order_id BIGINT,
  id BIGINT,
  customer_name TEXT,
  date DATE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.id,
    o.customer_name,
    o.date,
    COALESCE(
      (SELECT osl.status 
       FROM order_status_log osl 
       WHERE osl.order_id = o.id 
       ORDER BY osl.updated_at DESC 
       LIMIT 1), 
      'Pending'
    ) as status
  FROM orders o
  WHERE (o.is_deleted IS NULL OR o.is_deleted = false)
    AND COALESCE(
      (SELECT osl.status 
       FROM order_status_log osl 
       WHERE osl.order_id = o.id 
       ORDER BY osl.updated_at DESC 
       LIMIT 1), 
      'Pending'
    ) != 'Delivered'
  ORDER BY o.date DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for daily order counts
CREATE OR REPLACE FUNCTION get_daily_order_counts(days_to_check INTEGER DEFAULT 7)
RETURNS TABLE (
  day TEXT,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_series.day, 'Mon DD') as day,
    COALESCE(COUNT(o.id), 0) as order_count
  FROM (
    SELECT generate_series(
      CURRENT_DATE - (days_to_check - 1),
      CURRENT_DATE,
      '1 day'::interval
    )::DATE as day
  ) date_series
  LEFT JOIN orders o ON o.date = date_series.day
    AND (o.is_deleted IS NULL OR o.is_deleted = false)
  GROUP BY date_series.day
  ORDER BY date_series.day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION global_search(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_pending_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_order_counts(INTEGER) TO authenticated;