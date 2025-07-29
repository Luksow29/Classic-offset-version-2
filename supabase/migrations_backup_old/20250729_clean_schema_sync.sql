-- Clean Migration: Sync with Remote Database Schema
-- This creates tables matching the remote database structure with fixed syntax

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create core tables in dependency order

-- 1. Independent tables first
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  email text,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  bio text,
  phone text,
  address text,
  company text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE public.suppliers (
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

CREATE TABLE public.products (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  category text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- 2. Tables with foreign keys to base tables
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  joined_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_interaction timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  billing_address text,
  shipping_address text,
  birthday date,
  secondary_phone text,
  company_name text,
  tags text[] DEFAULT '{}'::text[], -- FIXED: Correct array syntax
  user_id uuid UNIQUE,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

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
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_app_user_id_fkey FOREIGN KEY (app_user_id) REFERENCES public.users(id)
);

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
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT materials_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id),
  CONSTRAINT materials_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);

-- 3. Create sequences for legacy tables
CREATE SEQUENCE IF NOT EXISTS stock_id_seq;
CREATE SEQUENCE IF NOT EXISTS stock_usage_log_id_seq;

-- 4. Tables dependent on customers/employees
CREATE TABLE public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  customer_name text NOT NULL,
  order_type text NOT NULL,
  quantity integer NOT NULL,
  design_needed boolean NOT NULL,
  delivery_date date,
  amount_received numeric,
  amount_paid numeric DEFAULT 0, -- ADDED: Missing column
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
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT fk_designer_id FOREIGN KEY (designer_id) REFERENCES public.employees(id),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  order_id bigint,
  total_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_received numeric, -- ADDED: Missing column
  due_date date,
  status text DEFAULT 'Due'::text CHECK (status = ANY (ARRAY['Paid'::text, 'Partial'::text, 'Due'::text])),
  created_at timestamp without time zone DEFAULT now(),
  payment_date date,
  created_by uuid,
  notes text,
  payment_method text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- 5. Stock table with FIXED balance column
CREATE TABLE public.stock (
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

-- 6. Supporting tables
CREATE TABLE public.expenses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  expense_type text NOT NULL,
  paid_to text NOT NULL,
  amount numeric NOT NULL,
  payment_method text,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.staff_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  role text,
  time_in time without time zone,
  time_out time without time zone,
  work_done text,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  employee_id uuid,
  CONSTRAINT staff_logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

CREATE TABLE public.whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_interaction timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

CREATE TABLE public.whatsapp_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id)
);

CREATE TABLE public.whatsapp_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id uuid,
  customer_name text,
  phone text NOT NULL,
  message text NOT NULL,
  template_name text,
  sent_by uuid,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_log_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_log_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT whatsapp_log_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id)
);

-- 7. Create trigger to automatically calculate balance for stock table
CREATE OR REPLACE FUNCTION update_stock_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance := NEW.quantity_in - NEW.quantity_used;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_balance
    BEFORE INSERT OR UPDATE ON public.stock
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_balance();

-- 8. Activity logs table
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
