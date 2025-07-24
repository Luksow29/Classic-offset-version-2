-- SQL for required tables and columns for Classic Offset V1

-- 1. user_settings table
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  system_settings jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. backup_logs table
create table if not exists public.backup_logs (
  id serial primary key,
  user_id uuid not null,
  backup_type text not null, -- 'manual' or 'restore'
  backup_size integer,
  status text,
  created_at timestamptz default now()
);

-- 3. customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  -- add other fields as needed
  created_at timestamptz default now()
);

-- 4. orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- add other fields as needed
  created_at timestamptz default now()
);

-- 5. payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  -- add other fields as needed
  created_at timestamptz default now()
);

-- 6. materials table
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  -- add other fields as needed
  created_at timestamptz default now()
);

-- 7. expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  -- add other fields as needed
  created_at timestamptz default now()
);
