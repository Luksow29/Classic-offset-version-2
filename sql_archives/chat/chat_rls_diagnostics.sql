-- Chat RLS Diagnostics Helper
-- Run sections individually in Supabase SQL Editor.

-- 1. Confirm tables exist
select table_name from information_schema.tables 
where table_name in ('order_chat_threads','order_chat_messages');

-- 2. List policies for chat tables
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename in ('order_chat_threads','order_chat_messages')
order by tablename, policyname;

-- 3. Show table definitions (columns)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name='order_chat_threads'
order by ordinal_position;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name='order_chat_messages'
order by ordinal_position;

-- 4. Test as authenticated user (ensure you are logged in through the SQL editor or test via RPC)
-- Attempt a select limited by your auth uid
-- Replace YOUR_UUID if needed for direct testing (or rely on current_setting('request.jwt.claim.sub', true))

-- Current JWT subject (may be null if not using authenticated SQL runner):
select current_setting('request.jwt.claim.sub', true) as jwt_subject;

-- 5. Attempt controlled insert (ROLLBACK manually if doing within transaction)
-- Begin transaction so you can rollback:
begin;
-- NOTE: Cast JWT sub (text) to uuid to satisfy column type
insert into public.order_chat_threads (order_id, customer_id, subject, priority, status)
values (999999, current_setting('request.jwt.claim.sub', true)::uuid, 'RLS probe', 'normal', 'active')
returning id, customer_id;
-- If insert succeeds, delete it (or rollback at end)
rollback; -- or commit if you want to persist

-- 6. Common fix template (ONLY apply if policies are wrong)
-- Example permissive policies (adjust role names if you use a specific role):
-- drop policy if exists "Customers select their threads" on public.order_chat_threads;
-- create policy "Customers select their threads" on public.order_chat_threads
-- for select using ( auth.uid() = customer_id );
-- drop policy if exists "Customers insert threads" on public.order_chat_threads;
-- create policy "Customers insert threads" on public.order_chat_threads
-- for insert with check ( auth.uid() = customer_id );
-- drop policy if exists "Customers select their messages" on public.order_chat_messages;
-- create policy "Customers select their messages" on public.order_chat_messages
-- for select using ( auth.uid() = sender_id or auth.uid() in (
--   select customer_id from public.order_chat_threads t where t.id = order_chat_messages.thread_id
-- ) );
-- drop policy if exists "Customers insert messages" on public.order_chat_messages;
-- create policy "Customers insert messages" on public.order_chat_messages
-- for insert with check (
--   auth.uid() = sender_id and exists (
--     select 1 from public.order_chat_threads t 
--     where t.id = order_chat_messages.thread_id 
--       and t.customer_id = auth.uid()
--   )
-- );

-- 7. After changes re-run diagnostics via UI debug button.

-- Optional: quick visibility checks (should return rows only belonging to you)
select id, order_id, customer_id, subject from public.order_chat_threads
where customer_id = auth.uid() limit 5;

select id, thread_id, sender_id, message_type from public.order_chat_messages
where sender_id = auth.uid() limit 5;

-- 8. Reverting from relaxed dev policies (if you applied chat_rls_relax.sql)
-- Run BEFORE recreating secure policies:
-- drop policy if exists "Dev all access select threads" on public.order_chat_threads;
-- drop policy if exists "Dev all access insert threads" on public.order_chat_threads;
-- drop policy if exists "Dev all access update threads" on public.order_chat_threads;
-- drop policy if exists "Dev all access delete threads" on public.order_chat_threads;
-- drop policy if exists "Dev all access select messages" on public.order_chat_messages;
-- drop policy if exists "Dev all access insert messages" on public.order_chat_messages;
-- drop policy if exists "Dev all access update messages" on public.order_chat_messages;
-- drop policy if exists "Dev all access delete messages" on public.order_chat_messages;
-- Then re-apply the secure policies in section 6.
