-- =============================================================
-- RBAC v1 follow-up: Fix stack depth errors
-- =============================================================
-- Problem:
-- - RLS policies call `public.has_staff_role()` / `public.is_staff()`
-- - These helpers call `public.staff_role()`, which queries `public.users`
-- - `public.users` RLS also calls the helpers, causing infinite recursion:
--   "stack depth limit exceeded" + PostgREST 500s / statement timeouts
--
-- Fix:
-- - Make role helper functions SECURITY DEFINER so they can read the
--   current user's role without being subject to `public.users` RLS.
-- =============================================================

create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select public.staff_role() in ('owner', 'manager', 'office', 'designer', 'production', 'purchase', 'staff', 'admin');
$$;

create or replace function public.has_staff_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from unnest(roles) r
    where lower(r) = public.staff_role()
  );
$$;

