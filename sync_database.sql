-- Automated Database Schema Sync Script
-- This will update local database schema to match remote database

-- WARNING: This will modify your local database structure!
-- Make sure to backup your local database before running this script

-- Step 1: Add missing columns to existing tables

-- Fix customers table - add missing columns
DO $$ 
BEGIN
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='address') THEN
        ALTER TABLE public.customers ADD COLUMN address text;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='email') THEN
        ALTER TABLE public.customers ADD COLUMN email text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='joined_date') THEN
        ALTER TABLE public.customers ADD COLUMN joined_date date DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_orders') THEN
        ALTER TABLE public.customers ADD COLUMN total_orders integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_spent') THEN
        ALTER TABLE public.customers ADD COLUMN total_spent numeric DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='last_interaction') THEN
        ALTER TABLE public.customers ADD COLUMN last_interaction timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='updated_at') THEN
        ALTER TABLE public.customers ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='billing_address') THEN
        ALTER TABLE public.customers ADD COLUMN billing_address text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='shipping_address') THEN
        ALTER TABLE public.customers ADD COLUMN shipping_address text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='birthday') THEN
        ALTER TABLE public.customers ADD COLUMN birthday date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='secondary_phone') THEN
        ALTER TABLE public.customers ADD COLUMN secondary_phone text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='company_name') THEN
        ALTER TABLE public.customers ADD COLUMN company_name text;
    END IF;
    
    -- Add tags column with proper syntax
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='tags') THEN
        ALTER TABLE public.customers ADD COLUMN tags text[] DEFAULT '{}'::text[];
    END IF;
    
    RAISE NOTICE 'Customers table schema updated successfully';
END $$;

-- Fix orders table - add missing columns
DO $$ 
BEGIN
    -- Add amount_received column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='amount_received') THEN
        ALTER TABLE public.orders ADD COLUMN amount_received numeric;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='amount_paid') THEN
        ALTER TABLE public.orders ADD COLUMN amount_paid numeric DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Orders table schema updated successfully';
END $$;

-- Fix payments table - add missing columns
DO $$ 
BEGIN
    -- Add amount_received column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='amount_received') THEN
        ALTER TABLE public.payments ADD COLUMN amount_received numeric;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='amount_paid') THEN
        ALTER TABLE public.payments ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Payments table schema updated successfully';
END $$;

-- Step 2: Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  category text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Step 3: Create a sync completion function
CREATE OR REPLACE FUNCTION sync_schema_complete()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
BEGIN
    result_text := 'Local database schema successfully updated to match remote database at ' || NOW();
    result_text := result_text || E'\n\nUpdated Tables:';
    result_text := result_text || E'\n- customers: Added missing columns (address, email, tags, etc.)';
    result_text := result_text || E'\n- orders: Added amount_received, amount_paid columns';
    result_text := result_text || E'\n- payments: Added amount_received, amount_paid columns';
    result_text := result_text || E'\n- products: Created table if missing';
    result_text := result_text || E'\n\nNext: Run automated data sync to copy data from remote to local';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Execute completion function
SELECT sync_schema_complete();
