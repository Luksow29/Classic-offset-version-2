-- Add customer_code column to customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_code') THEN
        ALTER TABLE customers ADD COLUMN customer_code TEXT;
        ALTER TABLE customers ADD CONSTRAINT customers_customer_code_unique UNIQUE (customer_code);
    END IF;
END $$;

-- Create sequence for customer code if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1001;

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL THEN
        NEW.customer_code := 'CUST-' || nextval('customer_code_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set customer code on insert
DROP TRIGGER IF EXISTS set_customer_code ON customers;
CREATE TRIGGER set_customer_code
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION generate_customer_code();

-- Backfill existing customers who don't have a code
UPDATE customers
SET customer_code = 'CUST-' || nextval('customer_code_seq')
WHERE customer_code IS NULL;

-- Recreate the view to include customer_code
DROP VIEW IF EXISTS customer_summary;

CREATE VIEW customer_summary AS
 SELECT c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.joined_date,
    c.customer_code,
    ( SELECT count(*) AS count
           FROM orders
          WHERE (orders.customer_id = c.id)) AS total_orders,
    COALESCE(( SELECT sum(payments.amount_paid) AS sum
           FROM payments
          WHERE (payments.customer_id = c.id)), (0)::numeric) AS total_paid,
    (COALESCE(( SELECT sum(orders.total_amount) AS sum
           FROM orders
          WHERE (orders.customer_id = c.id)), (0)::numeric) - COALESCE(( SELECT sum(payments.amount_paid) AS sum
           FROM payments
          WHERE (payments.customer_id = c.id)), (0)::numeric)) AS balance_due,
    ( SELECT max(orders.date) AS max
           FROM orders
          WHERE (orders.customer_id = c.id)) AS last_order_date
   FROM customers c;
