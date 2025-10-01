-- DEVELOPMENT RLS POLICIES - MORE PERMISSIVE FOR TESTING
-- Run this in Supabase SQL editor for development environment

-- First, ensure RLS is enabled on both tables
alter table public.order_chat_threads enable row level security;
alter table public.order_chat_messages enable row level security;

-- Drop ALL existing policies to start fresh
drop policy if exists "Customers select their threads" on public.order_chat_threads;
drop policy if exists "Customers insert threads" on public.order_chat_threads;
drop policy if exists "Customers update threads" on public.order_chat_threads;
drop policy if exists "Customers delete threads" on public.order_chat_threads;
drop policy if exists "Customers select their messages" on public.order_chat_messages;
drop policy if exists "Customers insert messages" on public.order_chat_messages;
drop policy if exists "Customers update messages" on public.order_chat_messages;
drop policy if exists "Customers delete messages" on public.order_chat_messages;

-- Drop any existing policies
drop policy if exists "chat_threads_select" on public.order_chat_threads;
drop policy if exists "chat_threads_insert" on public.order_chat_threads;
drop policy if exists "chat_threads_update" on public.order_chat_threads;
drop policy if exists "chat_messages_select" on public.order_chat_messages;
drop policy if exists "chat_messages_insert" on public.order_chat_messages;
drop policy if exists "chat_messages_update" on public.order_chat_messages;

-- Create VERY PERMISSIVE policies for development
-- These will allow access even when auth.uid() is null or problematic

-- THREADS: Allow all authenticated users to select threads
create policy "dev_threads_select" on public.order_chat_threads
for select using ( true );

-- THREADS: Allow all authenticated users to insert threads
create policy "dev_threads_insert" on public.order_chat_threads
for insert with check ( true );

-- THREADS: Allow all authenticated users to update threads
create policy "dev_threads_update" on public.order_chat_threads
for update using ( true ) with check ( true );

-- MESSAGES: Allow all authenticated users to select messages
create policy "dev_messages_select" on public.order_chat_messages
for select using ( true );

-- MESSAGES: Allow all authenticated users to insert messages
create policy "dev_messages_insert" on public.order_chat_messages
for insert with check ( true );

-- MESSAGES: Allow all authenticated users to update messages
create policy "dev_messages_update" on public.order_chat_messages
for update using ( true ) with check ( true );

-- Test the setup
select 'THREADS POLICIES' as type, policyname, cmd from pg_policies where tablename = 'order_chat_threads'
union all
select 'MESSAGES POLICIES' as type, policyname, cmd from pg_policies where tablename = 'order_chat_messages'
order by type, policyname;

-- Test basic operations (should work with permissive policies)
-- Uncomment to test:
-- begin;
-- insert into public.order_chat_threads (order_id, customer_id, subject, priority, status)
-- values (999999, '550e8400-e29b-41d4-a716-446655440000', 'Dev test thread', 'normal', 'active')
-- returning id, customer_id, subject;
-- rollback;

-- Test message insert
-- begin;
-- insert into public.order_chat_messages (thread_id, sender_id, content, message_type)
-- values (1, '550e8400-e29b-41d4-a716-446655440000', 'Test message content', 'text')
-- returning id, content;
-- rollback;
