# 📋 Customer Portal Payment System - Database Schema

**Purpose:** Database setup scripts for customer portal payment system  
**Date:** 25 September 2025  
**Project:** Classic Offset - Customer Portal Payment Integration  

---

## 🗃️ Table Creation Scripts

### **Script 1: Payment Transactions Table**
```sql
-- Main table for storing customer payment transactions
-- Execute in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customer_payment_transactions (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  
  -- Razorpay specific fields
  razorpay_order_id TEXT UNIQUE NOT NULL, -- rzp_order_xxxxx
  razorpay_payment_id TEXT UNIQUE, -- rzp_pay_xxxxx (populated after payment)
  razorpay_signature TEXT, -- For webhook verification
  
  -- Payment details
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  status TEXT CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'cancelled')) DEFAULT 'created',
  
  -- Gateway response and error handling
  gateway_response JSONB DEFAULT '{}',
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Webhook processing tracking
  webhook_processed BOOLEAN DEFAULT false,
  webhook_processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Add comments for documentation
COMMENT ON TABLE customer_payment_transactions IS 'Stores all customer-initiated payment transactions through the portal';
COMMENT ON COLUMN customer_payment_transactions.razorpay_order_id IS 'Razorpay order ID (rzp_order_xxxxx)';
COMMENT ON COLUMN customer_payment_transactions.razorpay_payment_id IS 'Razorpay payment ID (rzp_pay_xxxxx) - populated after successful payment';
COMMENT ON COLUMN customer_payment_transactions.gateway_response IS 'Complete response from Razorpay API';
COMMENT ON COLUMN customer_payment_transactions.webhook_processed IS 'Flag to track if webhook has been processed';
```

### **Script 2: Payment Methods Table (Optional)**
```sql
-- Table for storing customer payment preferences
-- Execute in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customer_payment_methods (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  
  -- Payment method details
  method_type TEXT CHECK (method_type IN ('card', 'upi', 'netbanking', 'wallet', 'emi')) NOT NULL,
  method_details JSONB DEFAULT '{}', -- Store encrypted card details, UPI ID, etc.
  provider TEXT, -- razorpay, payu, phonepe, etc.
  
  -- Status flags
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  display_name TEXT, -- User-friendly name like "My HDFC Card"
  notes TEXT,
  
  -- Ensure only one default method per customer per type
  UNIQUE(customer_id, method_type, is_default) WHERE is_default = true
);

-- Add comments
COMMENT ON TABLE customer_payment_methods IS 'Stores customer preferred payment methods and settings';
COMMENT ON COLUMN customer_payment_methods.method_details IS 'Encrypted payment method details (PCI compliant)';
COMMENT ON COLUMN customer_payment_methods.is_default IS 'Whether this is the default method for this type';
```

---

## 📊 Indexes for Performance

```sql
-- Performance indexes for customer_payment_transactions
CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_customer_id 
ON customer_payment_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_order_id 
ON customer_payment_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_razorpay_order_id 
ON customer_payment_transactions(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_status 
ON customer_payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_created_at 
ON customer_payment_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_webhook_processed 
ON customer_payment_transactions(webhook_processed, created_at) 
WHERE webhook_processed = false;

-- Performance indexes for customer_payment_methods
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer_id 
ON customer_payment_methods(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_active 
ON customer_payment_methods(customer_id, is_active, method_type) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_default 
ON customer_payment_methods(customer_id, is_default) 
WHERE is_default = true;
```

---

## 🔧 Helper Functions

### **Function 1: Update Order Payment Amounts**
```sql
-- Function to update order amounts after successful payment
CREATE OR REPLACE FUNCTION update_order_payment_amounts(
  order_id BIGINT,
  payment_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_received NUMERIC;
  current_total NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Get current order amounts
  SELECT 
    COALESCE(amount_received, 0),
    COALESCE(total_amount, 0)
  INTO current_received, current_total
  FROM orders 
  WHERE id = order_id;
  
  -- Check if order exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order with ID % not found', order_id;
  END IF;
  
  -- Validate payment amount
  IF payment_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than 0';
  END IF;
  
  -- Calculate new amounts
  new_balance := current_total - (current_received + payment_amount);
  
  -- Ensure balance doesn't go negative
  IF new_balance < 0 THEN
    new_balance := 0;
  END IF;
  
  -- Update order amounts
  UPDATE orders 
  SET 
    amount_received = current_received + payment_amount,
    balance_amount = new_balance,
    updated_at = NOW()
  WHERE id = order_id;
  
  -- Log the update
  INSERT INTO payment_audit_log (
    order_id,
    payment_amount,
    previous_amount_received,
    new_amount_received,
    previous_balance,
    new_balance,
    updated_at
  ) VALUES (
    order_id,
    payment_amount,
    current_received,
    current_received + payment_amount,
    current_total - current_received,
    new_balance,
    NOW()
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION update_order_payment_amounts IS 'Updates order payment amounts after successful customer payment';
```

### **Function 2: Get Customer Payment Summary**
```sql
-- Function to get payment summary for a customer
CREATE OR REPLACE FUNCTION get_customer_payment_summary(
  customer_uuid UUID
)
RETURNS TABLE (
  total_transactions BIGINT,
  total_amount_paid NUMERIC,
  successful_payments BIGINT,
  failed_payments BIGINT,
  pending_payments BIGINT,
  last_payment_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_transactions,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_amount_paid,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    COUNT(CASE WHEN status IN ('created', 'attempted') THEN 1 END) as pending_payments,
    MAX(CASE WHEN status = 'paid' THEN paid_at END) as last_payment_date
  FROM customer_payment_transactions
  WHERE customer_id = customer_uuid;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_customer_payment_summary IS 'Returns payment summary statistics for a customer';
```

### **Function 3: Clean Up Expired Transactions**
```sql
-- Function to clean up old failed/expired transactions
CREATE OR REPLACE FUNCTION cleanup_expired_payment_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete transactions older than 30 days that are not paid
  DELETE FROM customer_payment_transactions
  WHERE 
    status IN ('created', 'failed', 'cancelled')
    AND created_at < NOW() - INTERVAL '30 days';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO system_audit_log (
    action,
    details,
    executed_at
  ) VALUES (
    'cleanup_expired_transactions',
    jsonb_build_object('deleted_count', deleted_count),
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION cleanup_expired_payment_transactions IS 'Cleans up old failed/expired payment transactions';
```

---

## 🔐 Row Level Security (RLS) Policies

```sql
-- Enable RLS on tables
ALTER TABLE customer_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_payment_transactions
-- Policy: Users can view their own payment transactions
CREATE POLICY "Users can view own payment transactions" 
ON customer_payment_transactions
FOR SELECT 
USING (auth.uid()::text = customer_id::text);

-- Policy: Users can insert their own payment transactions
CREATE POLICY "Users can insert own payment transactions" 
ON customer_payment_transactions
FOR INSERT 
WITH CHECK (auth.uid()::text = customer_id::text);

-- Policy: Only service role can update payment transactions (for webhooks)
CREATE POLICY "Service role can update payment transactions" 
ON customer_payment_transactions
FOR UPDATE 
USING (auth.role() = 'service_role');

-- RLS Policies for customer_payment_methods
-- Policy: Users can manage their own payment methods
CREATE POLICY "Users can manage own payment methods" 
ON customer_payment_methods
FOR ALL 
USING (auth.uid()::text = customer_id::text);

-- Policy: Service role has full access (for admin operations)
CREATE POLICY "Service role full access to payment methods" 
ON customer_payment_methods
FOR ALL 
USING (auth.role() = 'service_role');
```

---

## 📊 Audit and Logging Tables

### **Payment Audit Log Table**
```sql
-- Table for tracking payment-related changes
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT REFERENCES orders(id),
  payment_amount NUMERIC,
  previous_amount_received NUMERIC,
  new_amount_received NUMERIC,
  previous_balance NUMERIC,
  new_balance NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for audit log
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_order_id 
ON payment_audit_log(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_audit_log_updated_at 
ON payment_audit_log(updated_at DESC);
```

### **System Audit Log Table**
```sql
-- Table for system-level audit logging
CREATE TABLE IF NOT EXISTS system_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_by UUID REFERENCES auth.users(id)
);

-- Index for system audit log
CREATE INDEX IF NOT EXISTS idx_system_audit_log_action 
ON system_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_system_audit_log_executed_at 
ON system_audit_log(executed_at DESC);
```

---

## 🔄 Triggers for Automation

### **Trigger 1: Update Payment Method Last Used**
```sql
-- Trigger to update last_used_at when payment method is used
CREATE OR REPLACE FUNCTION update_payment_method_last_used()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update last_used_at for the payment method if specified
  IF NEW.gateway_response ? 'method' THEN
    UPDATE customer_payment_methods
    SET 
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE 
      customer_id = NEW.customer_id 
      AND method_type = (NEW.gateway_response->>'method');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_update_payment_method_last_used
  AFTER UPDATE ON customer_payment_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
  EXECUTE FUNCTION update_payment_method_last_used();
```

### **Trigger 2: Auto-sync with Admin Payments**
```sql
-- Trigger to automatically sync successful payments to admin table
CREATE OR REPLACE FUNCTION sync_payment_to_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only sync when payment status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- Insert into admin payments table
    INSERT INTO payments (
      customer_id,
      order_id,
      total_amount,
      amount_paid,
      payment_date,
      status,
      payment_method,
      notes,
      created_by,
      created_at
    ) VALUES (
      NEW.customer_id,
      NEW.order_id,
      NEW.amount,
      NEW.amount,
      COALESCE(NEW.paid_at::date, CURRENT_DATE),
      'Paid',
      'Razorpay',
      CONCAT('Customer portal payment - Razorpay Payment ID: ', NEW.razorpay_payment_id),
      NEW.customer_id,
      NEW.paid_at
    )
    ON CONFLICT (customer_id, order_id, amount_paid, payment_date) 
    DO NOTHING; -- Avoid duplicates
    
    -- Update order amounts
    PERFORM update_order_payment_amounts(NEW.order_id, NEW.amount);
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_sync_payment_to_admin
  AFTER UPDATE ON customer_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_payment_to_admin();
```

---

## 📈 Views for Reporting

### **View 1: Customer Payment Summary**
```sql
-- View for customer payment summary
CREATE OR REPLACE VIEW customer_payment_summary AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(cpt.id) as total_transactions,
  COUNT(CASE WHEN cpt.status = 'paid' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN cpt.status = 'failed' THEN 1 END) as failed_payments,
  COUNT(CASE WHEN cpt.status IN ('created', 'attempted') THEN 1 END) as pending_payments,
  COALESCE(SUM(CASE WHEN cpt.status = 'paid' THEN cpt.amount ELSE 0 END), 0) as total_paid,
  MAX(cpt.paid_at) as last_payment_date,
  MIN(cpt.created_at) as first_transaction_date
FROM customers c
LEFT JOIN customer_payment_transactions cpt ON c.id = cpt.customer_id
GROUP BY c.id, c.name, c.email;

-- Add comment
COMMENT ON VIEW customer_payment_summary IS 'Summary of payment statistics for each customer';
```

### **View 2: Daily Payment Statistics**
```sql
-- View for daily payment statistics
CREATE OR REPLACE VIEW daily_payment_stats AS
SELECT 
  DATE(created_at) as payment_date,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_transactions,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
  COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
  ROUND(
    COUNT(CASE WHEN status = 'paid' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate_percentage
FROM customer_payment_transactions
GROUP BY DATE(created_at)
ORDER BY payment_date DESC;

-- Add comment
COMMENT ON VIEW daily_payment_stats IS 'Daily statistics for customer payments';
```

---

## 🧪 Test Data Scripts

### **Script: Insert Test Data**
```sql
-- Insert test data for development/testing
-- Only run in development environment

-- Test customer (ensure this customer exists)
INSERT INTO customers (id, name, email, phone) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Test Customer',
  'test@customer.com',
  '+919876543210'
) ON CONFLICT (id) DO NOTHING;

-- Test order (ensure this order exists)
INSERT INTO orders (id, customer_id, customer_name, total_amount, balance_amount, created_at)
VALUES (
  1001,
  '550e8400-e29b-41d4-a716-446655440001',
  'Test Customer',
  5000.00,
  5000.00,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test payment transaction
INSERT INTO customer_payment_transactions (
  customer_id,
  order_id,
  razorpay_order_id,
  amount,
  status,
  gateway_response
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  1001,
  'order_test_' || extract(epoch from now())::text,
  1000.00,
  'created',
  '{"test": true}'::jsonb
);

-- Test payment method
INSERT INTO customer_payment_methods (
  customer_id,
  method_type,
  method_details,
  is_default,
  display_name
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'upi',
  '{"upi_id": "test@paytm"}'::jsonb,
  true,
  'My UPI'
);
```

---

## 🔍 Verification Queries

### **Check Table Creation**
```sql
-- Verify tables were created successfully
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN (
  'customer_payment_transactions',
  'customer_payment_methods',
  'payment_audit_log',
  'system_audit_log'
);
```

### **Check Indexes**
```sql
-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN (
  'customer_payment_transactions',
  'customer_payment_methods'
)
ORDER BY tablename, indexname;
```

### **Check Functions**
```sql
-- Verify functions were created
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname IN (
  'update_order_payment_amounts',
  'get_customer_payment_summary',
  'cleanup_expired_payment_transactions'
);
```

---

## 📝 Maintenance Scripts

### **Script: Database Cleanup**
```sql
-- Clean up old payment transactions (run monthly)
SELECT cleanup_expired_payment_transactions();

-- Vacuum and analyze tables for performance
VACUUM ANALYZE customer_payment_transactions;
VACUUM ANALYZE customer_payment_methods;
VACUUM ANALYZE payment_audit_log;
```

### **Script: Performance Monitoring**
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE tablename LIKE '%payment%'
ORDER BY size_bytes DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename LIKE '%payment%'
ORDER BY idx_scan DESC;
```

---

**📄 Database Schema Status:** Ready for Execution  
**🎯 Next Step:** Execute scripts in Supabase SQL Editor  
**⚠️ Important:** Run scripts in the order provided for proper dependencies  

---

*Execute these scripts in your Supabase SQL Editor to set up the complete database schema for the customer portal payment system.*
