-- COMPREHENSIVE RLS POLICY FIX FOR CHAT SYSTEM
-- Run this in Supabase SQL editor to establish working RLS policies

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

-- Drop any dev policies from previous attempts
drop policy if exists "Dev all access select threads" on public.order_chat_threads;
drop policy if exists "Dev all access insert threads" on public.order_chat_threads;
drop policy if exists "Dev all access update threads" on public.order_chat_threads;
drop policy if exists "Dev all access delete threads" on public.order_chat_threads;
drop policy if exists "Dev all access select messages" on public.order_chat_messages;
drop policy if exists "Dev all access insert messages" on public.order_chat_messages;
drop policy if exists "Dev all access update messages" on public.order_chat_messages;
drop policy if exists "Dev all access delete messages" on public.order_chat_messages;

-- Drop existing chat policies to recreate them
drop policy if exists "chat_threads_select" on public.order_chat_threads;
drop policy if exists "chat_threads_insert" on public.order_chat_threads;
drop policy if exists "chat_threads_update" on public.order_chat_threads;
drop policy if exists "chat_messages_select" on public.order_chat_messages;
drop policy if exists "chat_messages_insert" on public.order_chat_messages;
drop policy if exists "chat_messages_update" on public.order_chat_messages;

-- Now create working policies
-- THREADS: Customer can select their own threads
create policy "chat_threads_select" on public.order_chat_threads
for select using ( auth.uid() = customer_id );

-- THREADS: Customer can insert new threads for themselves
create policy "chat_threads_insert" on public.order_chat_threads
for insert with check ( auth.uid() = customer_id );

-- THREADS: Customer can update their own threads
create policy "chat_threads_update" on public.order_chat_threads
for update using ( auth.uid() = customer_id ) with check ( auth.uid() = customer_id );

-- MESSAGES: Customer can select messages from their threads
create policy "chat_messages_select" on public.order_chat_messages
for select using ( 
  auth.uid() = sender_id 
  or exists (
    select 1 from public.order_chat_threads t 
    where t.id = order_chat_messages.thread_id 
    and t.customer_id = auth.uid()
  )
);

-- MESSAGES: Customer can insert messages into their threads
create policy "chat_messages_insert" on public.order_chat_messages
for insert with check (
  auth.uid() = sender_id 
  and exists (
    select 1 from public.order_chat_threads t 
    where t.id = order_chat_messages.thread_id 
    and t.customer_id = auth.uid()
  )
);

-- MESSAGES: Customer can update messages they sent
create policy "chat_messages_update" on public.order_chat_messages
for update using ( auth.uid() = sender_id ) with check ( auth.uid() = sender_id );

-- Verification: List all policies
select 'THREADS' as table_name, policyname, cmd from pg_policies where tablename = 'order_chat_threads'
union all
select 'MESSAGES' as table_name, policyname, cmd from pg_policies where tablename = 'order_chat_messages'
order by table_name, policyname;

-- Test query (should return current user's auth uid)
select 'Current auth.uid():' as label, auth.uid() as value;

-- Test basic operations (these should work now)
-- Uncomment to test manually:
-- begin;
-- insert into public.order_chat_threads (order_id, customer_id, subject, priority, status)
-- values (999999, auth.uid(), 'Policy test', 'normal', 'active')
-- returning id, customer_id;
-- rollback;
