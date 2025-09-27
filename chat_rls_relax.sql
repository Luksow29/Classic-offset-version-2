-- TEMPORARY RELAXED RLS FOR DEVELOPMENT
-- Purpose: Allow all authenticated users to operate on chat tables to unblock debugging.
-- IMPORTANT: Do NOT use in production. Revert after verifying functionality.

-- 1. Enable RLS (should already be on) just to be explicit
alter table public.order_chat_threads enable row level security;
alter table public.order_chat_messages enable row level security;

-- 2. Drop existing restrictive policies (safe even if they don't exist)
drop policy if exists "Customers select their threads" on public.order_chat_threads;
drop policy if exists "Customers insert threads" on public.order_chat_threads;
drop policy if exists "Customers select their messages" on public.order_chat_messages;
drop policy if exists "Customers insert messages" on public.order_chat_messages;

-- 3. Create permissive catch‑all policies for authenticated users
create policy "Dev all access select threads" on public.order_chat_threads
for select using ( auth.role() = 'authenticated' );

create policy "Dev all access insert threads" on public.order_chat_threads
for insert with check ( auth.role() = 'authenticated' );

create policy "Dev all access update threads" on public.order_chat_threads
for update using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );

create policy "Dev all access select messages" on public.order_chat_messages
for select using ( auth.role() = 'authenticated' );

create policy "Dev all access insert messages" on public.order_chat_messages
for insert with check ( auth.role() = 'authenticated' );

create policy "Dev all access update messages" on public.order_chat_messages
for update using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );

-- (Optional) allow deletes during dev
create policy "Dev all access delete threads" on public.order_chat_threads
for delete using ( auth.role() = 'authenticated' );
create policy "Dev all access delete messages" on public.order_chat_messages
for delete using ( auth.role() = 'authenticated' );

-- 4. Verification queries
select 'threads policies' as section, policyname from pg_policies where tablename='order_chat_threads';
select 'messages policies' as section, policyname from pg_policies where tablename='order_chat_messages';

-- 5. After running this, use the app Debug DB button again. If it passes, your issue was RLS scope.
-- 6. Then revert to principle-of-least-privilege policies (see secure template in diagnostics file).
