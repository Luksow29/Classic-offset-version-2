-- COMPLETE CHAT SYSTEM SETUP
-- Run this first to create tables, then run chat_rls_policies_fix.sql for policies

-- 1. Create the chat threads table
create table if not exists public.order_chat_threads (
    id uuid default gen_random_uuid() primary key,
    order_id integer not null,
    customer_id uuid references auth.users(id) on delete cascade not null,
    subject text not null,
    status text not null default 'active' check (status in ('active', 'resolved', 'closed')),
    priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    last_message_at timestamptz default now() not null
);

-- 2. Create the chat messages table
create table if not exists public.order_chat_messages (
    id uuid default gen_random_uuid() primary key,
    thread_id uuid references public.order_chat_threads(id) on delete cascade not null,
    sender_id uuid references auth.users(id) on delete cascade not null,
    sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
    message_type text not null default 'text' check (message_type in ('text', 'file', 'image')),
    content text not null,
    file_url text,
    file_name text,
    file_size bigint,
    file_type text,
    is_read boolean default false not null,
    read_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 3. Create indexes for better performance
create index if not exists idx_order_chat_threads_order_id on public.order_chat_threads(order_id);
create index if not exists idx_order_chat_threads_customer_id on public.order_chat_threads(customer_id);
create index if not exists idx_order_chat_threads_status on public.order_chat_threads(status);
create index if not exists idx_order_chat_messages_thread_id on public.order_chat_messages(thread_id);
create index if not exists idx_order_chat_messages_sender_id on public.order_chat_messages(sender_id);
create index if not exists idx_order_chat_messages_created_at on public.order_chat_messages(created_at);

-- 4. Enable RLS (Row Level Security)
alter table public.order_chat_threads enable row level security;
alter table public.order_chat_messages enable row level security;

-- 5. Create updated_at trigger function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 6. Create triggers for updated_at
drop trigger if exists handle_updated_at on public.order_chat_threads;
create trigger handle_updated_at
    before update on public.order_chat_threads
    for each row
    execute function public.handle_updated_at();

drop trigger if exists handle_updated_at on public.order_chat_messages;
create trigger handle_updated_at
    before update on public.order_chat_messages
    for each row
    execute function public.handle_updated_at();

-- 7. Create trigger to update last_message_at when new message is added
create or replace function public.update_thread_last_message()
returns trigger as $$
begin
    update public.order_chat_threads
    set last_message_at = now(), updated_at = now()
    where id = new.thread_id;
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_thread_last_message on public.order_chat_messages;
create trigger update_thread_last_message
    after insert on public.order_chat_messages
    for each row
    execute function public.update_thread_last_message();

-- 8. Verification queries
select 'Tables created:' as status;
select table_name from information_schema.tables 
where table_name in ('order_chat_threads','order_chat_messages') 
and table_schema = 'public';

select 'Columns in order_chat_threads:' as info;
select column_name, data_type from information_schema.columns 
where table_name = 'order_chat_threads' and table_schema = 'public'
order by ordinal_position;

select 'Columns in order_chat_messages:' as info;
select column_name, data_type from information_schema.columns 
where table_name = 'order_chat_messages' and table_schema = 'public'
order by ordinal_position;

-- Next step: Run chat_rls_policies_fix.sql to set up RLS policies
