
-- Fixed Remote Database Schema Migration
-- This migration creates tables matching the remote database structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean tables that might exist
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.features CASCADE;
DROP TABLE IF EXISTS public.gallery_items CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.material_categories CASCADE;
DROP TABLE IF EXISTS public.material_audit_log CASCADE;
DROP TABLE IF EXISTS public.material_stock_alerts CASCADE;
DROP TABLE IF EXISTS public.material_transactions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.order_requests CASCADE;
DROP TABLE IF EXISTS public.order_status_log CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.security_audit CASCADE;
DROP TABLE IF EXISTS public.site_content CASCADE;
DROP TABLE IF EXISTS public.staff_logs CASCADE;
DROP TABLE IF EXISTS public.stock CASCADE;
DROP TABLE IF EXISTS public.stock_usage_log CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.user_status CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS public.whatsapp_log CASCADE;
DROP TABLE IF EXISTS public.whatsapp_templates CASCADE;

-- Create base tables first (no foreign keys)
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

-- Create sequence for stock if needed
CREATE SEQUENCE IF NOT EXISTS stock_id_seq;
CREATE SEQUENCE IF NOT EXISTS stock_usage_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS payment_history_id_seq;

-- Create customers table with proper array syntax
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
  tags text[] DEFAULT '{}'::text[], -- Fixed syntax here
  user_id uuid UNIQUE,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create employees table
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

-- Create orders table
CREATE TABLE public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  customer_name text NOT NULL,
  order_type text NOT NULL,
  quantity integer NOT NULL,
  design_needed boolean NOT NULL,
  delivery_date date,
  amount_received numeric,
  amount_paid numeric DEFAULT 0,
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

-- Create payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  order_id bigint,
  total_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_received numeric,
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

-- Create materials table
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

-- Create remaining tables with minimal dependencies
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

CREATE TABLE public.stock (
  id bigint NOT NULL DEFAULT nextval('stock_id_seq'::regclass),
  item_name text NOT NULL,
  category text,
  quantity_in integer NOT NULL DEFAULT 0,
  quantity_used integer NOT NULL DEFAULT 0,
  balance integer DEFAULT (quantity_in - quantity_used),
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  minimum_stock_level numeric DEFAULT 0,
  CONSTRAINT stock_pkey PRIMARY KEY (id)
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

-- Add any remaining audit tables
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
CREATE TABLE public.features (
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
CREATE TABLE public.gallery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL UNIQUE,
  category text,
  title text,
  description text,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gallery_items_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_items_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address text NOT NULL,
  success boolean DEFAULT false,
  attempted_at timestamp with time zone DEFAULT now(),
  attempt_count integer DEFAULT 1,
  locked_until timestamp with time zone,
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT login_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.material_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid,
  action text NOT NULL CHECK (action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text, 'RESTORE'::text])),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  CONSTRAINT material_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT material_audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id),
  CONSTRAINT material_audit_log_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
);
CREATE TABLE public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.material_stock_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  alert_type text NOT NULL CHECK (alert_type = ANY (ARRAY['LOW_STOCK'::text, 'OUT_OF_STOCK'::text, 'EXPIRED'::text])),
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_stock_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT material_stock_alerts_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id),
  CONSTRAINT material_stock_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.material_transactions (
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
  CONSTRAINT material_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT material_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT material_transactions_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
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
  CONSTRAINT materials_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT materials_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id),
  CONSTRAINT materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  link_to text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  customer_id uuid NOT NULL,
  request_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  rejection_reason text,
  CONSTRAINT order_requests_pkey PRIMARY KEY (id),
  CONSTRAINT order_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT order_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.order_status_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id bigint,
  status text DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'Design'::text, 'Printing'::text, 'Delivered'::text])),
  updated_by text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_status_log_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
CREATE TABLE public.activity_logs (
);
CREATE TABLE public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  customer_name text NOT NULL,
  order_type text NOT NULL,
  quantity integer NOT NULL,
  design_needed boolean NOT NULL,
  delivery_date date,
  amount_received numeric,
  payment_method text,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  rate numeric,
  total_amount numeric NOT NULL DEFAULT 0,
  balance_amount numeric,
  product_id bigint,
  user_id uuid,
  customer_phone text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  designer_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_designer_id FOREIGN KEY (designer_id) REFERENCES public.employees(id)
);
CREATE TABLE public.payment_history (
  id bigint NOT NULL DEFAULT nextval('payment_history_id_seq'::regclass),
  payment_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  notes text,
  old_values jsonb,
  CONSTRAINT payment_history_pkey PRIMARY KEY (id),
  CONSTRAINT fk_payment_history_payment_id FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT payment_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  order_id bigint,
  total_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  due_date date,
  status text DEFAULT 'Due'::text CHECK (status = ANY (ARRAY['Paid'::text, 'Partial'::text, 'Due'::text])),
  created_at timestamp without time zone DEFAULT now(),
  payment_date date,
  created_by uuid,
  notes text,
  payment_method text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
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
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_audit_pkey PRIMARY KEY (id),
  CONSTRAINT security_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_name text NOT NULL UNIQUE,
  content text,
  last_updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_content_pkey PRIMARY KEY (id)
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
CREATE TABLE public.stock (
  id bigint NOT NULL DEFAULT nextval('stock_id_seq'::regclass),
  item_name text NOT NULL,
  category text,
  quantity_in integer NOT NULL DEFAULT 0,
  quantity_used integer NOT NULL DEFAULT 0,
  balance integer DEFAULT (quantity_in - quantity_used),
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  minimum_stock_level numeric DEFAULT 0,
  CONSTRAINT stock_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stock_usage_log (
  id bigint NOT NULL DEFAULT nextval('stock_usage_log_id_seq'::regclass),
  used_quantity integer NOT NULL,
  used_for text,
  used_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  notes text,
  CONSTRAINT stock_usage_log_pkey PRIMARY KEY (id),
  CONSTRAINT stock_usage_log_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.stock(id)
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
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  message text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT testimonials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_settings (
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
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_status (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_status_pkey PRIMARY KEY (id),
  CONSTRAINT user_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  email text,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  bio text,
  phone text,
  company text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_interaction timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
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
CREATE TABLE public.whatsapp_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id)
);
