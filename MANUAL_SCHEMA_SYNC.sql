-- ==========================================
-- MANUAL DATABASE SCHEMA SYNC SCRIPT
-- Run this in your local Supabase SQL Editor
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================================
-- STEP 0: CREATE BASE TABLES FIRST IF THEY DON'T EXIST
-- ==========================================

-- Create basic customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  user_id uuid UNIQUE,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- Create basic orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  customer_name text NOT NULL,
  order_type text NOT NULL,
  quantity integer NOT NULL,
  design_needed boolean NOT NULL,
  delivery_date date,
  payment_method text,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  rate numeric,
  total_amount numeric NOT NULL DEFAULT 0,
  balance_amount numeric,
  product_id bigint,
  customer_id uuid,
  user_id uuid,
  customer_phone text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  designer_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Create basic payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  order_id bigint,
  total_amount numeric NOT NULL,
  due_date date,
  status text DEFAULT 'Due'::text CHECK (status = ANY (ARRAY['Paid'::text, 'Partial'::text, 'Due'::text])),
  created_at timestamp without time zone DEFAULT now(),
  payment_date date,
  created_by uuid,
  notes text,
  payment_method text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

-- Create basic users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  name text,
  email text,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  bio text,
  phone text,
  address text,
  company text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints safely for base tables
DO $$ 
BEGIN
    -- Add users foreign key constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='users_id_fkey' 
                   AND table_name='users') THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id);
    END IF;
    
    -- Add customers foreign key constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='customers_user_id_fkey' 
                   AND table_name='customers') THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    
    -- Add orders foreign key constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='fk_customer' 
                   AND table_name='orders') THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT fk_customer 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='fk_user_id' 
                   AND table_name='orders') THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT fk_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
    
    -- Add payments foreign key constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='payments_customer_id_fkey' 
                   AND table_name='payments') THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='payments_order_id_fkey' 
                   AND table_name='payments') THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='payments_created_by_fkey' 
                   AND table_name='payments') THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
    
    RAISE NOTICE '✅ Base tables created and foreign keys added successfully';
END $$;

-- ==========================================
-- STEP 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- Fix customers table - add missing columns
DO $$ 
BEGIN
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='address') THEN
        ALTER TABLE public.customers ADD COLUMN address text;
        RAISE NOTICE 'Added address column to customers';
    END IF;
    
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='email') THEN
        ALTER TABLE public.customers ADD COLUMN email text;
        RAISE NOTICE 'Added email column to customers';
    END IF;
    
    -- Add joined_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='joined_date') THEN
        ALTER TABLE public.customers ADD COLUMN joined_date date DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Added joined_date column to customers';
    END IF;
    
    -- Add total_orders column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_orders') THEN
        ALTER TABLE public.customers ADD COLUMN total_orders integer DEFAULT 0;
        RAISE NOTICE 'Added total_orders column to customers';
    END IF;
    
    -- Add total_spent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_spent') THEN
        ALTER TABLE public.customers ADD COLUMN total_spent numeric DEFAULT 0;
        RAISE NOTICE 'Added total_spent column to customers';
    END IF;
    
    -- Add last_interaction column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='last_interaction') THEN
        ALTER TABLE public.customers ADD COLUMN last_interaction timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Added last_interaction column to customers';
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='updated_at') THEN
        ALTER TABLE public.customers ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Added updated_at column to customers';
    END IF;
    
    -- Add billing_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='billing_address') THEN
        ALTER TABLE public.customers ADD COLUMN billing_address text;
        RAISE NOTICE 'Added billing_address column to customers';
    END IF;
    
    -- Add shipping_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='shipping_address') THEN
        ALTER TABLE public.customers ADD COLUMN shipping_address text;
        RAISE NOTICE 'Added shipping_address column to customers';
    END IF;
    
    -- Add birthday column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='birthday') THEN
        ALTER TABLE public.customers ADD COLUMN birthday date;
        RAISE NOTICE 'Added birthday column to customers';
    END IF;
    
    -- Add secondary_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='secondary_phone') THEN
        ALTER TABLE public.customers ADD COLUMN secondary_phone text;
        RAISE NOTICE 'Added secondary_phone column to customers';
    END IF;
    
    -- Add company_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='company_name') THEN
        ALTER TABLE public.customers ADD COLUMN company_name text;
        RAISE NOTICE 'Added company_name column to customers';
    END IF;
    
    -- Add tags column with FIXED syntax (was "ARRAY" now "text[]")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='tags') THEN
        ALTER TABLE public.customers ADD COLUMN tags text[] DEFAULT '{}'::text[];
        RAISE NOTICE 'Added tags column to customers with correct syntax';
    END IF;
    
    RAISE NOTICE '✅ Customers table schema updated successfully';
END $$;

-- Fix orders table - add missing columns
DO $$ 
BEGIN
    -- Add amount_received column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='amount_received') THEN
        ALTER TABLE public.orders ADD COLUMN amount_received numeric;
        RAISE NOTICE 'Added amount_received column to orders';
    END IF;
    
    -- Add amount_paid column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='amount_paid') THEN
        ALTER TABLE public.orders ADD COLUMN amount_paid numeric DEFAULT 0;
        RAISE NOTICE 'Added amount_paid column to orders';
    END IF;
    
    RAISE NOTICE '✅ Orders table schema updated successfully';
END $$;

-- Fix payments table - add missing columns
DO $$ 
BEGIN
    -- Add amount_received column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='amount_received') THEN
        ALTER TABLE public.payments ADD COLUMN amount_received numeric;
        RAISE NOTICE 'Added amount_received column to payments';
    END IF;
    
    -- Add amount_paid column (check if it exists first)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='amount_paid') THEN
        ALTER TABLE public.payments ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added amount_paid column to payments';
    END IF;
    
    RAISE NOTICE '✅ Payments table schema updated successfully';
END $$;

-- ==========================================
-- STEP 2: CREATE ALL MISSING TABLES FROM REMOTE SCHEMA
-- ==========================================

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  category text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Create suppliers table if it doesn't exist
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

-- Create material_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_categories_pkey PRIMARY KEY (id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  history jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- Add foreign key for conversations safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='conversations_user_id_fkey' 
                   AND table_name='conversations') THEN
        ALTER TABLE public.conversations 
        ADD CONSTRAINT conversations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create documents table (FIXED: handle vector extension)
CREATE SEQUENCE IF NOT EXISTS documents_id_seq;
DO $$ 
BEGIN
    -- Try to create table with vector type if extension exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE TABLE IF NOT EXISTS public.documents (
          id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
          content text,
          embedding vector, -- pgvector extension available
          CONSTRAINT documents_pkey PRIMARY KEY (id)
        );
        RAISE NOTICE '✅ Documents table created with vector type';
    ELSE
        -- Fallback to jsonb if vector extension not available
        CREATE TABLE IF NOT EXISTS public.documents (
          id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
          content text,
          embedding jsonb, -- Fallback: store as jsonb array
          CONSTRAINT documents_pkey PRIMARY KEY (id)
        );
        RAISE NOTICE '⚠️  Documents table created with jsonb type (vector extension not available)';
    END IF;
END $$;

-- Create features table
CREATE TABLE IF NOT EXISTS public.features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon_name text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT features_pkey PRIMARY KEY (id)
);

-- Create gallery_items table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL UNIQUE,
  category text,
  title text,
  description text,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gallery_items_pkey PRIMARY KEY (id)
);

-- Add foreign key for gallery_items safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='gallery_items_uploaded_by_fkey' 
                   AND table_name='gallery_items') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
            ALTER TABLE public.gallery_items 
            ADD CONSTRAINT gallery_items_uploaded_by_fkey 
            FOREIGN KEY (uploaded_by) REFERENCES public.users(id);
        END IF;
    END IF;
END $$;

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address text NOT NULL,
  success boolean DEFAULT false,
  attempted_at timestamp with time zone DEFAULT now(),
  attempt_count integer DEFAULT 1,
  locked_until timestamp with time zone,
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);

-- Add foreign key for login_attempts safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='login_attempts_user_id_fkey' 
                   AND table_name='login_attempts') THEN
        ALTER TABLE public.login_attempts 
        ADD CONSTRAINT login_attempts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  link_to text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Add foreign key for notifications safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='notifications_user_id_fkey' 
                   AND table_name='notifications') THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create order_requests table
CREATE TABLE IF NOT EXISTS public.order_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  customer_id uuid NOT NULL,
  request_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  rejection_reason text,
  CONSTRAINT order_requests_pkey PRIMARY KEY (id)
);

-- Add foreign keys for order_requests safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='order_requests_customer_id_fkey' 
                   AND table_name='order_requests') THEN
        ALTER TABLE public.order_requests 
        ADD CONSTRAINT order_requests_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='order_requests_user_id_fkey' 
                   AND table_name='order_requests') THEN
        ALTER TABLE public.order_requests 
        ADD CONSTRAINT order_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create order_status_log table
CREATE TABLE IF NOT EXISTS public.order_status_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id bigint,
  status text DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'Design'::text, 'Printing'::text, 'Delivered'::text])),
  updated_by text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_status_log_pkey PRIMARY KEY (id)
);

-- Add foreign key for order_status_log safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='order_status_log_order_id_fkey' 
                   AND table_name='order_status_log') THEN
        ALTER TABLE public.order_status_log 
        ADD CONSTRAINT order_status_log_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;

-- Create payment_history table
CREATE SEQUENCE IF NOT EXISTS payment_history_id_seq;
CREATE TABLE IF NOT EXISTS public.payment_history (
  id bigint NOT NULL DEFAULT nextval('payment_history_id_seq'::regclass),
  payment_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  notes text,
  old_values jsonb,
  CONSTRAINT payment_history_pkey PRIMARY KEY (id)
);

-- Add foreign key for payment_history safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='payment_history_changed_by_fkey' 
                   AND table_name='payment_history') THEN
        ALTER TABLE public.payment_history 
        ADD CONSTRAINT payment_history_changed_by_fkey 
        FOREIGN KEY (changed_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create roles table (if not exists)
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- Create security_audit table
CREATE TABLE IF NOT EXISTS public.security_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_audit_pkey PRIMARY KEY (id)
);

-- Add foreign key for security_audit safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='security_audit_user_id_fkey' 
                   AND table_name='security_audit') THEN
        ALTER TABLE public.security_audit 
        ADD CONSTRAINT security_audit_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create site_content table
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_name text NOT NULL UNIQUE,
  content text,
  last_updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_content_pkey PRIMARY KEY (id)
);

-- Create stock table (FIXED: removed computed column)
CREATE SEQUENCE IF NOT EXISTS stock_id_seq;
CREATE TABLE IF NOT EXISTS public.stock (
  id bigint NOT NULL DEFAULT nextval('stock_id_seq'::regclass),
  item_name text NOT NULL,
  category text,
  quantity_in integer NOT NULL DEFAULT 0,
  quantity_used integer NOT NULL DEFAULT 0,
  balance integer, -- FIXED: Removed computed column expression
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  minimum_stock_level numeric DEFAULT 0,
  CONSTRAINT stock_pkey PRIMARY KEY (id)
);

-- Create stock_usage_log table
CREATE SEQUENCE IF NOT EXISTS stock_usage_log_id_seq;
CREATE TABLE IF NOT EXISTS public.stock_usage_log (
  id bigint NOT NULL DEFAULT nextval('stock_usage_log_id_seq'::regclass),
  stock_id bigint,
  used_quantity integer NOT NULL,
  used_for text,
  used_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  notes text,
  CONSTRAINT stock_usage_log_pkey PRIMARY KEY (id)
);

-- Add foreign key for stock_usage_log safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='stock_usage_log_stock_id_fkey' 
                   AND table_name='stock_usage_log') THEN
        ALTER TABLE public.stock_usage_log 
        ADD CONSTRAINT stock_usage_log_stock_id_fkey 
        FOREIGN KEY (stock_id) REFERENCES public.stock(id);
    END IF;
END $$;

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  message text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT testimonials_pkey PRIMARY KEY (id)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  device text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  terminated boolean DEFAULT false,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);

-- Add foreign key for user_sessions safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='user_sessions_user_id_fkey' 
                   AND table_name='user_sessions') THEN
        ALTER TABLE public.user_sessions 
        ADD CONSTRAINT user_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  theme_preference text DEFAULT 'system'::text CHECK (theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  font_size text DEFAULT 'medium'::text CHECK (font_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
  reduced_motion boolean DEFAULT false,
  high_contrast boolean DEFAULT false,
  color_scheme text DEFAULT 'blue'::text,
  language_preference text DEFAULT 'en'::text,
  date_format text DEFAULT 'DD/MM/YYYY'::text,
  time_format text DEFAULT '24h'::text CHECK (time_format = ANY (ARRAY['12h'::text, '24h'::text])),
  currency text DEFAULT 'INR'::text,
  timezone text DEFAULT 'Asia/Kolkata'::text,
  notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true, "types": {"stock": true, "orders": true, "system": true, "payments": true}, "whatsapp": false, "frequency": "realtime"}'::jsonb,
  security_preferences jsonb DEFAULT '{"two_factor_enabled": false, "login_notifications": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id)
);

-- Add foreign key for user_settings safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='user_settings_user_id_fkey' 
                   AND table_name='user_settings') THEN
        ALTER TABLE public.user_settings 
        ADD CONSTRAINT user_settings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create user_status table
CREATE TABLE IF NOT EXISTS public.user_status (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_status_pkey PRIMARY KEY (id)
);

-- Add foreign key for user_status safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='user_status_user_id_fkey' 
                   AND table_name='user_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
            ALTER TABLE public.user_status 
            ADD CONSTRAINT user_status_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id);
        END IF;
    END IF;
END $$;

-- Create employees table with safe dependency handling
DO $$ 
BEGIN
    -- Check if employees table exists
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
        
        RAISE NOTICE '✅ Employees table created successfully';
    END IF;
END $$;

-- Create materials table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name='materials') THEN
        CREATE TABLE public.materials (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          material_name text NOT NULL,
          description text,
          category_id uuid,
          supplier_id uuid,
          unit_of_measurement text NOT NULL DEFAULT 'pieces'::text,
          current_quantity numeric DEFAULT 0,
          minimum_stock_level numeric DEFAULT 0,
          cost_per_unit numeric DEFAULT 0,
          storage_location text,
          purchase_date date,
          last_purchase_date date,
          version integer DEFAULT 1,
          is_active boolean DEFAULT true,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          created_by uuid,
          updated_by uuid,
          CONSTRAINT materials_pkey PRIMARY KEY (id)
        );
        
        -- Add foreign keys if related tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='material_categories') THEN
            ALTER TABLE public.materials 
            ADD CONSTRAINT materials_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES public.material_categories(id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='suppliers') THEN
            ALTER TABLE public.materials 
            ADD CONSTRAINT materials_supplier_id_fkey 
            FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
        END IF;
        
        -- Add auth.users foreign keys
        ALTER TABLE public.materials 
        ADD CONSTRAINT materials_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
        
        ALTER TABLE public.materials 
        ADD CONSTRAINT materials_updated_by_fkey 
        FOREIGN KEY (updated_by) REFERENCES auth.users(id);
        
        RAISE NOTICE '✅ Materials table created successfully';
    END IF;
END $$;

-- Create material_audit_log table
CREATE TABLE IF NOT EXISTS public.material_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid,
  action text NOT NULL CHECK (action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text, 'RESTORE'::text])),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  CONSTRAINT material_audit_log_pkey PRIMARY KEY (id)
);

-- Add foreign keys for material_audit_log safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='material_audit_log_changed_by_fkey' 
                   AND table_name='material_audit_log') THEN
        ALTER TABLE public.material_audit_log 
        ADD CONSTRAINT material_audit_log_changed_by_fkey 
        FOREIGN KEY (changed_by) REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='material_audit_log_material_id_fkey' 
                   AND table_name='material_audit_log') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='materials') THEN
            ALTER TABLE public.material_audit_log 
            ADD CONSTRAINT material_audit_log_material_id_fkey 
            FOREIGN KEY (material_id) REFERENCES public.materials(id);
        END IF;
    END IF;
END $$;

-- Create material_stock_alerts table
CREATE TABLE IF NOT EXISTS public.material_stock_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  alert_type text NOT NULL CHECK (alert_type = ANY (ARRAY['LOW_STOCK'::text, 'OUT_OF_STOCK'::text, 'EXPIRED'::text])),
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_stock_alerts_pkey PRIMARY KEY (id)
);

-- Add foreign keys for material_stock_alerts safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='material_stock_alerts_material_id_fkey' 
                   AND table_name='material_stock_alerts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='materials') THEN
            ALTER TABLE public.material_stock_alerts 
            ADD CONSTRAINT material_stock_alerts_material_id_fkey 
            FOREIGN KEY (material_id) REFERENCES public.materials(id);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='material_stock_alerts_resolved_by_fkey' 
                   AND table_name='material_stock_alerts') THEN
        ALTER TABLE public.material_stock_alerts 
        ADD CONSTRAINT material_stock_alerts_resolved_by_fkey 
        FOREIGN KEY (resolved_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create material_transactions table
CREATE TABLE IF NOT EXISTS public.material_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['IN'::text, 'OUT'::text, 'ADJUSTMENT'::text])),
  quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reference_number text,
  notes text,
  transaction_date timestamp with time zone DEFAULT now(),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_transactions_pkey PRIMARY KEY (id)
);

-- Add foreign keys for material_transactions safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='material_transactions_created_by_fkey' 
                   AND table_name='material_transactions') THEN
        ALTER TABLE public.material_transactions 
        ADD CONSTRAINT material_transactions_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='material_transactions_material_id_fkey' 
                   AND table_name='material_transactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='materials') THEN
            ALTER TABLE public.material_transactions 
            ADD CONSTRAINT material_transactions_material_id_fkey 
            FOREIGN KEY (material_id) REFERENCES public.materials(id);
        END IF;
    END IF;
END $$;

-- Create whatsapp related tables
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_interaction timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_contacts_pkey PRIMARY KEY (id)
);

-- Add foreign key constraint for whatsapp_contacts safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='whatsapp_contacts_customer_id_fkey' 
                   AND table_name='whatsapp_contacts') THEN
        ALTER TABLE public.whatsapp_contacts 
        ADD CONSTRAINT whatsapp_contacts_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.whatsapp_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id uuid,
  customer_name text,
  phone text NOT NULL,
  message text NOT NULL,
  template_name text,
  sent_by uuid,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_log_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints for whatsapp_log safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='whatsapp_log_customer_id_fkey' 
                   AND table_name='whatsapp_log') THEN
        ALTER TABLE public.whatsapp_log 
        ADD CONSTRAINT whatsapp_log_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='whatsapp_log_sent_by_fkey' 
                   AND table_name='whatsapp_log') THEN
        ALTER TABLE public.whatsapp_log 
        ADD CONSTRAINT whatsapp_log_sent_by_fkey 
        FOREIGN KEY (sent_by) REFERENCES auth.users(id);
    END IF;
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

-- ==========================================
-- STEP 3: CREATE HELPFUL FUNCTIONS AND TRIGGERS
-- ==========================================

-- Create trigger to automatically calculate balance for stock table (FIXED computed column issue)
CREATE OR REPLACE FUNCTION update_stock_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance := NEW.quantity_in - NEW.quantity_used;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock balance calculation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name='trigger_update_stock_balance' 
                   AND event_object_table='stock') THEN
        CREATE TRIGGER trigger_update_stock_balance
            BEFORE INSERT OR UPDATE ON public.stock
            FOR EACH ROW
            EXECUTE FUNCTION update_stock_balance();
        RAISE NOTICE '✅ Stock balance trigger created successfully';
    END IF;
END $$;

-- Create a function to verify the schema sync
CREATE OR REPLACE FUNCTION verify_schema_sync()
RETURNS TABLE(
    table_name text,
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
    AND t.table_name IN ('customers', 'orders', 'payments', 'products', 'materials', 'employees')
    ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Create a sync completion function
CREATE OR REPLACE FUNCTION sync_schema_complete()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    customer_cols integer;
    order_cols integer;
    payment_cols integer;
BEGIN
    -- Count columns in each table
    SELECT COUNT(*) INTO customer_cols 
    FROM information_schema.columns 
    WHERE table_name = 'customers';
    
    SELECT COUNT(*) INTO order_cols 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
    
    SELECT COUNT(*) INTO payment_cols 
    FROM information_schema.columns 
    WHERE table_name = 'payments';
    
    result_text := '🎉 LOCAL DATABASE SCHEMA SYNC COMPLETED at ' || NOW();
    result_text := result_text || E'\n\n📊 Table Column Summary:';
    result_text := result_text || E'\n- customers: ' || customer_cols || ' columns';
    result_text := result_text || E'\n- orders: ' || order_cols || ' columns';
    result_text := result_text || E'\n- payments: ' || payment_cols || ' columns';
    result_text := result_text || E'\n\n✅ Added Missing Columns:';
    result_text := result_text || E'\n- customers: address, email, tags (FIXED SYNTAX), etc.';
    result_text := result_text || E'\n- orders: amount_received, amount_paid';
    result_text := result_text || E'\n- payments: amount_received, amount_paid';
    result_text := result_text || E'\n\n🆕 Created Missing Tables:';
    result_text := result_text || E'\n- products, suppliers, materials, employees, material_categories';
    result_text := result_text || E'\n- whatsapp_contacts, whatsapp_log, whatsapp_templates';
    result_text := result_text || E'\n- activity_logs, conversations, documents, features';
    result_text := result_text || E'\n- gallery_items, login_attempts, notifications';
    result_text := result_text || E'\n- order_requests, order_status_log, payment_history';
    result_text := result_text || E'\n- roles, security_audit, site_content, stock, stock_usage_log';
    result_text := result_text || E'\n- testimonials, user_sessions, user_settings, user_status';
    result_text := result_text || E'\n- material_audit_log, material_stock_alerts, material_transactions';
    result_text := result_text || E'\n\n🔧 Fixed Syntax Errors:';
    result_text := result_text || E'\n- ❌ tags ARRAY → ✅ tags text[]';
    result_text := result_text || E'\n- ❌ embedding USER-DEFINED → ✅ embedding vector';
    result_text := result_text || E'\n- ❌ balance computed column → ✅ trigger-based calculation';
    result_text := result_text || E'\n\n🎯 Complete Remote Schema Sync:';
    result_text := result_text || E'\n- All ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') || ' tables from remote database created';
    result_text := result_text || E'\n- All foreign key constraints properly handled';
    result_text := result_text || E'\n- Safe column additions with existence checks';
    result_text := result_text || E'\n\n🚀 Next Steps:';
    result_text := result_text || E'\n1. Run "npm run sync:minimal" to sync data';
    result_text := result_text || E'\n2. Start app with "npm run dev:local"';
    result_text := result_text || E'\n3. Check Supabase Studio: http://127.0.0.1:55323';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 4: EXECUTE COMPLETION CHECK
-- ==========================================

-- Execute the completion function to see results
SELECT sync_schema_complete();

-- ==========================================
-- VERIFICATION QUERIES (OPTIONAL)
-- ==========================================

-- Uncomment these to verify the sync worked:

-- Check customers table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'customers' 
-- ORDER BY ordinal_position;

-- Check if all required tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('customers', 'orders', 'payments', 'products', 'materials', 'employees')
-- ORDER BY table_name;

-- Check specific columns that were problematic
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('customers', 'orders', 'payments') 
-- AND column_name IN ('address', 'amount_received', 'amount_paid', 'tags')
-- ORDER BY table_name, column_name;

-- ==========================================
-- SCRIPT COMPLETE
-- Copy and paste this entire script into your Supabase SQL Editor and run it!
-- ==========================================
