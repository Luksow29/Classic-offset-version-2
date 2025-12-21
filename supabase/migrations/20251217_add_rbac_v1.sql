-- =============================================================
-- RBAC v1 (Staff roles + Customer portal RLS)
-- =============================================================
-- Goals:
-- - Normalize `public.users.role` to canonical lowercase values
-- - Provide reusable SQL helpers for role checks
-- - Enforce RLS for key tables used by the staff app + customer portal
--
-- Canonical staff roles:
--   owner, manager, office, designer, production, purchase
-- =============================================================

-- =====================================================
-- 1) Role helper functions
-- =====================================================

create or replace function public.staff_role()
returns text
language sql
stable
as $$
  select lower(
    coalesce(
      (select u.role from public.users u where u.id::text = auth.uid()::text),
      ''
    )
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.staff_role() in ('owner', 'manager', 'office', 'designer', 'production', 'purchase', 'staff', 'admin');
$$;

create or replace function public.has_staff_role(roles text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from unnest(roles) r
    where lower(r) = public.staff_role()
  );
$$;

-- =====================================================
-- 2) Normalize role values in public.users
-- =====================================================

do $$
begin
  if to_regclass('public.users') is null then
    raise notice 'Skipping role normalization: public.users not found';
    return;
  end if;

  update public.users
  set role = case lower(trim(role))
    when 'owner' then 'owner'
    when 'manager' then 'manager'
    when 'office' then 'office'
    when 'designer' then 'designer'
    when 'production' then 'production'
    when 'purchase' then 'purchase'
    when 'staff' then 'office'
    when 'admin' then 'manager'
    else lower(trim(role))
  end
  where role is not null;
end $$;

-- =====================================================
-- 3) public.users (staff profiles)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.users') is null then
    raise notice 'Skipping users RLS: public.users not found';
    return;
  end if;

  alter table public.users enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'users'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
  end loop;

  -- Staff can read their own profile
  create policy "users_select_self"
    on public.users for select
    to authenticated
    using (id::text = auth.uid()::text);

  -- Owner can manage all profiles
  create policy "users_all_owner"
    on public.users for all
    to authenticated
    using (public.has_staff_role(array['owner']))
    with check (public.has_staff_role(array['owner']));

end $$;

-- =====================================================
-- 3b) user_status (staff account status)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.user_status') is null then
    raise notice 'Skipping user_status RLS: public.user_status not found';
    return;
  end if;

  alter table public.user_status enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'user_status'
  loop
    execute format('drop policy if exists %I on public.user_status', pol.policyname);
  end loop;

  -- Users can read their own status row
  create policy "user_status_select_self"
    on public.user_status for select
    to authenticated
    using (user_id::text = auth.uid()::text);

  -- Owner can manage all statuses
  create policy "user_status_all_owner"
    on public.user_status for all
    to authenticated
    using (public.has_staff_role(array['owner']))
    with check (public.has_staff_role(array['owner']));

end $$;

-- =====================================================
-- 4) customers (customer portal profiles + staff access)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.customers') is null then
    raise notice 'Skipping customers RLS: public.customers not found';
    return;
  end if;

  alter table public.customers enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'customers'
  loop
    execute format('drop policy if exists %I on public.customers', pol.policyname);
  end loop;

  -- Customers can read/update their own profile
  create policy "customers_select_own"
    on public.customers for select
    to authenticated
    using (user_id::text = auth.uid()::text);

  create policy "customers_insert_own"
    on public.customers for insert
    to authenticated
    with check (user_id::text = auth.uid()::text);

  create policy "customers_update_own"
    on public.customers for update
    to authenticated
    using (user_id::text = auth.uid()::text)
    with check (user_id::text = auth.uid()::text);

  -- Staff can read all customers; office/manager/owner can create/update
  create policy "customers_select_staff"
    on public.customers for select
    to authenticated
    using (public.is_staff());

  create policy "customers_insert_staff"
    on public.customers for insert
    to authenticated
    with check (public.has_staff_role(array['owner', 'manager', 'office']));

  create policy "customers_update_staff"
    on public.customers for update
    to authenticated
    using (public.has_staff_role(array['owner', 'manager', 'office']))
    with check (public.has_staff_role(array['owner', 'manager', 'office']));

  create policy "customers_delete_owner_manager"
    on public.customers for delete
    to authenticated
    using (public.has_staff_role(array['owner', 'manager']));

end $$;

-- =====================================================
-- 5) orders (staff access + customers see their own)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.orders') is null then
    raise notice 'Skipping orders RLS: public.orders not found';
    return;
  end if;

  alter table public.orders enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;

  -- Staff can read all orders
  create policy "orders_select_staff"
    on public.orders for select
    to authenticated
    using (public.is_staff());

  -- Customers can read their own orders (orders.customer_id -> customers.id -> customers.user_id)
  create policy "orders_select_customer_own"
    on public.orders for select
    to authenticated
    using (
      exists (
        select 1
        from public.customers c
        where c.id = orders.customer_id
          and c.user_id::text = auth.uid()::text
      )
    );

  -- Create orders: office/manager/owner
  create policy "orders_insert_office_manager_owner"
    on public.orders for insert
    to authenticated
    with check (
      public.has_staff_role(array['owner', 'manager', 'office'])
      and (user_id is null or user_id::text = auth.uid()::text)
    );

  -- Update orders: all staff except purchase
  create policy "orders_update_operational_staff"
    on public.orders for update
    to authenticated
    using (public.has_staff_role(array['owner', 'manager', 'office', 'designer', 'production']))
    with check (public.has_staff_role(array['owner', 'manager', 'office', 'designer', 'production']));

  -- Delete orders: owner/manager
  create policy "orders_delete_owner_manager"
    on public.orders for delete
    to authenticated
    using (public.has_staff_role(array['owner', 'manager']));

end $$;

-- =====================================================
-- 6) order_status_log (staff write + customers read their own)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.order_status_log') is null then
    raise notice 'Skipping order_status_log RLS: public.order_status_log not found';
    return;
  end if;

  alter table public.order_status_log enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'order_status_log'
  loop
    execute format('drop policy if exists %I on public.order_status_log', pol.policyname);
  end loop;

  create policy "order_status_log_select_staff"
    on public.order_status_log for select
    to authenticated
    using (public.is_staff());

  create policy "order_status_log_select_customer_own"
    on public.order_status_log for select
    to authenticated
    using (
      exists (
        select 1
        from public.orders o
        join public.customers c on c.id = o.customer_id
        where o.id = order_status_log.order_id
          and c.user_id::text = auth.uid()::text
      )
    );

  create policy "order_status_log_insert_operational_staff"
    on public.order_status_log for insert
    to authenticated
    with check (
      public.has_staff_role(array['owner', 'manager', 'office', 'designer', 'production'])
      and order_id is not null
    );

  create policy "order_status_log_update_staff"
    on public.order_status_log for update
    to authenticated
    using (public.is_staff())
    with check (public.is_staff());

end $$;

-- =====================================================
-- 7) payments (staff write + customers read their own)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.payments') is null then
    raise notice 'Skipping payments RLS: public.payments not found';
    return;
  end if;

  alter table public.payments enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'payments'
  loop
    execute format('drop policy if exists %I on public.payments', pol.policyname);
  end loop;

  create policy "payments_select_staff"
    on public.payments for select
    to authenticated
    using (public.is_staff());

  create policy "payments_select_customer_own"
    on public.payments for select
    to authenticated
    using (
      exists (
        select 1
        from public.customers c
        where c.id = payments.customer_id
          and c.user_id::text = auth.uid()::text
      )
    );

  create policy "payments_insert_office_manager_owner"
    on public.payments for insert
    to authenticated
    with check (public.has_staff_role(array['owner', 'manager', 'office']));

  create policy "payments_update_office_manager_owner"
    on public.payments for update
    to authenticated
    using (public.has_staff_role(array['owner', 'manager', 'office']))
    with check (public.has_staff_role(array['owner', 'manager', 'office']));

  create policy "payments_delete_owner_manager"
    on public.payments for delete
    to authenticated
    using (public.has_staff_role(array['owner', 'manager']));

end $$;

-- =====================================================
-- 8) order_requests (customers create + accept/reject quotes; staff manage)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.order_requests') is null then
    raise notice 'Skipping order_requests RLS: public.order_requests not found';
    return;
  end if;

  alter table public.order_requests enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'order_requests'
  loop
    execute format('drop policy if exists %I on public.order_requests', pol.policyname);
  end loop;

  -- Customers can see their own requests
  create policy "order_requests_select_own"
    on public.order_requests for select
    to authenticated
    using (user_id::text = auth.uid()::text);

  -- Customers can create requests for their own customer profile
  create policy "order_requests_insert_own"
    on public.order_requests for insert
    to authenticated
    with check (
      user_id::text = auth.uid()::text
      and exists (
        select 1
        from public.customers c
        where c.id = order_requests.customer_id
          and c.user_id::text = auth.uid()::text
      )
    );

  -- Customer quote response: only when currently quoted
  create policy "order_requests_update_customer_quote_response"
    on public.order_requests for update
    to authenticated
    using (
      user_id::text = auth.uid()::text
      and pricing_status = 'quoted'
    )
    with check (
      user_id::text = auth.uid()::text
      and pricing_status in ('accepted', 'rejected')
      and quote_response_at is not null
    );

  -- Staff can manage requests
  create policy "order_requests_select_staff"
    on public.order_requests for select
    to authenticated
    using (public.is_staff());

  create policy "order_requests_update_staff"
    on public.order_requests for update
    to authenticated
    using (public.has_staff_role(array['owner', 'manager', 'office']))
    with check (public.has_staff_role(array['owner', 'manager', 'office']));

  create policy "order_requests_delete_owner_manager"
    on public.order_requests for delete
    to authenticated
    using (public.has_staff_role(array['owner', 'manager']));

end $$;

-- =====================================================
-- 9) notifications (customer portal notifications)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.notifications') is null then
    raise notice 'Skipping notifications RLS: public.notifications not found';
    return;
  end if;

  alter table public.notifications enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'notifications'
  loop
    execute format('drop policy if exists %I on public.notifications', pol.policyname);
  end loop;

  create policy "notifications_select_own"
    on public.notifications for select
    to authenticated
    using (user_id::text = auth.uid()::text);

  create policy "notifications_insert_staff_or_self"
    on public.notifications for insert
    to authenticated
    with check (
      user_id::text = auth.uid()::text
      or public.has_staff_role(array['owner', 'manager', 'office'])
    );

  create policy "notifications_update_own"
    on public.notifications for update
    to authenticated
    using (user_id::text = auth.uid()::text)
    with check (user_id::text = auth.uid()::text);

  create policy "notifications_delete_own"
    on public.notifications for delete
    to authenticated
    using (user_id::text = auth.uid()::text);

  create policy "notifications_select_staff"
    on public.notifications for select
    to authenticated
    using (public.is_staff());

end $$;

-- Prevent authenticated users from calling the SECURITY DEFINER notification sender directly.
do $$
begin
  if to_regprocedure('public.send_customer_notification(uuid,text,text,text,text,jsonb)') is null then
    return;
  end if;
  revoke execute on function public.send_customer_notification(uuid, text, text, text, text, jsonb) from authenticated;
  grant execute on function public.send_customer_notification(uuid, text, text, text, text, jsonb) to service_role;
end $$;

-- =====================================================
-- 10) order chat (order_chat_threads/messages)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.order_chat_threads') is null or to_regclass('public.order_chat_messages') is null then
    raise notice 'Skipping order chat RLS: tables not found';
    return;
  end if;

  alter table public.order_chat_threads enable row level security;
  alter table public.order_chat_messages enable row level security;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('order_chat_threads', 'order_chat_messages')
  loop
    if pol.policyname is not null then
      if exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'order_chat_threads' and p.policyname = pol.policyname) then
        execute format('drop policy if exists %I on public.order_chat_threads', pol.policyname);
      end if;
      if exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'order_chat_messages' and p.policyname = pol.policyname) then
        execute format('drop policy if exists %I on public.order_chat_messages', pol.policyname);
      end if;
    end if;
  end loop;

  -- THREADS
  create policy "order_chat_threads_select"
    on public.order_chat_threads for select
    to authenticated
    using (customer_id::text = auth.uid()::text or public.is_staff());

  create policy "order_chat_threads_insert"
    on public.order_chat_threads for insert
    to authenticated
    with check (customer_id::text = auth.uid()::text or public.is_staff());

  create policy "order_chat_threads_update"
    on public.order_chat_threads for update
    to authenticated
    using (customer_id::text = auth.uid()::text or public.is_staff())
    with check (customer_id::text = auth.uid()::text or public.is_staff());

  -- MESSAGES
  create policy "order_chat_messages_select"
    on public.order_chat_messages for select
    to authenticated
    using (
      exists (
        select 1
        from public.order_chat_threads t
        where t.id = order_chat_messages.thread_id
          and (t.customer_id::text = auth.uid()::text or public.is_staff())
      )
    );

  create policy "order_chat_messages_insert"
    on public.order_chat_messages for insert
    to authenticated
    with check (
      sender_id::text = auth.uid()::text
      and (
        (
          sender_type = 'customer'
          and exists (
            select 1
            from public.order_chat_threads t
            where t.id = order_chat_messages.thread_id
              and t.customer_id::text = auth.uid()::text
          )
        )
        or (
          sender_type in ('admin', 'system')
          and public.is_staff()
        )
      )
    );

  create policy "order_chat_messages_update"
    on public.order_chat_messages for update
    to authenticated
    using (
      exists (
        select 1
        from public.order_chat_threads t
        where t.id = order_chat_messages.thread_id
          and (t.customer_id::text = auth.uid()::text or public.is_staff())
      )
    )
    with check (
      exists (
        select 1
        from public.order_chat_threads t
        where t.id = order_chat_messages.thread_id
          and (t.customer_id::text = auth.uid()::text or public.is_staff())
      )
    );

end $$;

-- =====================================================
-- 11) support chat (support_tickets/messages)
-- =====================================================

do $$
declare
  pol record;
begin
  if to_regclass('public.support_tickets') is null or to_regclass('public.support_messages') is null then
    raise notice 'Skipping support chat RLS: tables not found';
    return;
  end if;

  alter table public.support_tickets enable row level security;
  alter table public.support_messages enable row level security;

  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('support_tickets', 'support_messages')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;

  -- SUPPORT_TICKETS
  create policy "support_tickets_select"
    on public.support_tickets for select
    to authenticated
    using (
      exists (
        select 1
        from public.customers c
        where c.id = support_tickets.customer_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    );

  create policy "support_tickets_insert"
    on public.support_tickets for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.customers c
        where c.id = support_tickets.customer_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    );

  create policy "support_tickets_update"
    on public.support_tickets for update
    to authenticated
    using (
      exists (
        select 1
        from public.customers c
        where c.id = support_tickets.customer_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    )
    with check (
      exists (
        select 1
        from public.customers c
        where c.id = support_tickets.customer_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    );

  -- SUPPORT_MESSAGES
  create policy "support_messages_select"
    on public.support_messages for select
    to authenticated
    using (
      exists (
        select 1
        from public.support_tickets t
        join public.customers c on c.id = t.customer_id
        where t.id = support_messages.ticket_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    );

  create policy "support_messages_insert"
    on public.support_messages for insert
    to authenticated
    with check (
      (
        sender_type = 'customer'
        and exists (
          select 1
          from public.support_tickets t
          join public.customers c on c.id = t.customer_id
          where t.id = support_messages.ticket_id
            and t.customer_id::text = support_messages.sender_id::text
            and c.user_id::text = auth.uid()::text
        )
      )
      or (
        sender_type in ('admin', 'system')
        and support_messages.sender_id::text = auth.uid()::text
        and public.is_staff()
      )
    );

  create policy "support_messages_update"
    on public.support_messages for update
    to authenticated
    using (
      exists (
        select 1
        from public.support_tickets t
        join public.customers c on c.id = t.customer_id
        where t.id = support_messages.ticket_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    )
    with check (
      exists (
        select 1
        from public.support_tickets t
        join public.customers c on c.id = t.customer_id
        where t.id = support_messages.ticket_id
          and c.user_id::text = auth.uid()::text
      )
      or public.is_staff()
    );

end $$;
