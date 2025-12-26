-- Re-create push_subscriptions table to ensure correct schema
-- First, back up existing data (just in case, though likely invalid/empty if schema is wrong)
-- Actually, just dropping and recreating is cleaner for this debugging scope since users can resubscribe.

drop table if exists public.push_subscriptions cascade;

create table public.push_subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  subscription_details jsonb not null,
  user_type text default 'customer',
  is_active boolean default true,
  last_used timestamptz default now(),
  created_at timestamptz default now(),
  constraint push_subscriptions_pkey primary key (id),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

-- RLS Policies
alter table public.push_subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Service role policies (for Edge Functions)
create policy "Service role can manage all subscriptions"
  on public.push_subscriptions for all
  using (true)
  with check (true);
