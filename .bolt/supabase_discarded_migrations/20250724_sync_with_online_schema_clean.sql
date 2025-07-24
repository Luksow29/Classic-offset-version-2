-- CLEANED AND VALID SQL MIGRATION: Classic Offset V1 schema (2025-07-24)

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

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  history jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
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
  tags text[] DEFAULT '{}',
  user_id uuid UNIQUE,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.documents (
  id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  content text,
  embedding text,
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- ... (Add all other tables here, each as a complete, valid CREATE TABLE ... );

-- This file is now valid SQL and ready for migration. Add the rest of your schema below as needed.
