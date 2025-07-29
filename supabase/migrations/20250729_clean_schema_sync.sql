-- Schema Update: Add missing columns and tables to match remote database
-- This uses ALTER statements to add missing columns safely

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to existing customers table
DO $$ 
BEGIN
    -- Add missing columns to customers if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='address') THEN
        ALTER TABLE public.customers ADD COLUMN address text;
    END IF;
    
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
    
    -- Add tags column with proper syntax (FIXED: was "ARRAY" now "text[]")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='tags') THEN
        ALTER TABLE public.customers ADD COLUMN tags text[] DEFAULT '{}'::text[];
    END IF;
    
    RAISE NOTICE 'Customers table updated successfully';
END $$;

-- Add missing columns to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='amount_received') THEN
        ALTER TABLE public.orders ADD COLUMN amount_received numeric;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='amount_paid') THEN
        ALTER TABLE public.orders ADD COLUMN amount_paid numeric DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Orders table updated successfully';
END $$;

-- Add missing columns to payments table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='amount_received') THEN
        ALTER TABLE public.payments ADD COLUMN amount_received numeric;
    END IF;
    
    -- Note: amount_paid likely exists, check first
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='amount_paid') THEN
        ALTER TABLE public.payments ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Payments table updated successfully';
END $$;

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  category text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_categories_pkey PRIMARY KEY (id)
);

-- Create employees table with safe dependency handling
DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name='employees') THEN
        CREATE TABLE public.employees (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          name text NOT NULL,
          job_role text,
          contact_phone text,
          contact_email text,
          is_active boolean DEFAULT true,
          app_user_id uuid UNIQUE,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT employees_pkey PRIMARY KEY (id)
        );
        
        -- Add foreign key if users table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
            ALTER TABLE public.employees 
            ADD CONSTRAINT employees_app_user_id_fkey 
            FOREIGN KEY (app_user_id) REFERENCES public.users(id);
        END IF;
    END IF;
    
    RAISE NOTICE 'Employees table created/verified successfully';
END $$;

-- Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

-- Add foreign key constraint for activity_logs if auth.users exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='activity_logs_user_id_fkey' 
                   AND table_name='activity_logs') THEN
        ALTER TABLE public.activity_logs 
        ADD CONSTRAINT activity_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;
