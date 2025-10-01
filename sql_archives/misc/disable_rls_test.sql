-- DISABLE RLS TEMPORARILY FOR TESTING
-- This will allow unrestricted access to test basic functionality
-- WARNING: Only use this for testing, not production!

-- Disable RLS on chat tables
alter table public.order_chat_threads disable row level security;
alter table public.order_chat_messages disable row level security;

-- Test basic operations without RLS
select 'RLS Status for Threads:' as label, 
       case when relrowsecurity then 'ENABLED' else 'DISABLED' end as status
from pg_class 
where relname = 'order_chat_threads';

select 'RLS Status for Messages:' as label, 
       case when relrowsecurity then 'ENABLED' else 'DISABLED' end as status
from pg_class 
where relname = 'order_chat_messages';

-- Test table access
select 'Thread Count:' as label, count(*)::text as value from public.order_chat_threads;
select 'Message Count:' as label, count(*)::text as value from public.order_chat_messages;

-- First check if there are any existing orders to use
select 'Available Orders:' as label, count(*)::text as value from public.orders limit 5;

-- Get a sample order ID if available
select 'Sample Order ID:' as label, coalesce(id::text, 'NONE') as value 
from public.orders 
order by id 
limit 1;

-- Test insert with existing order ID or skip if no orders exist
do $$
declare 
    sample_order_id integer;
    test_customer_id uuid := '550e8400-e29b-41d4-a716-446655440000';
begin
    -- Get first available order ID
    select id into sample_order_id from public.orders limit 1;
    
    if sample_order_id is not null then
        -- Test insert with valid order ID
        begin
            insert into public.order_chat_threads (order_id, customer_id, subject, priority, status)
            values (sample_order_id, test_customer_id, 'RLS disabled test', 'normal', 'active');
            
            raise notice 'SUCCESS: Insert test passed with order_id %', sample_order_id;
            
            -- Clean up the test record
            delete from public.order_chat_threads 
            where order_id = sample_order_id 
            and customer_id = test_customer_id 
            and subject = 'RLS disabled test';
            
        exception when others then
            raise notice 'INSERT ERROR: %', SQLERRM;
        end;
    else
        raise notice 'SKIPPED: No orders available for foreign key test';
    end if;
end $$;

-- To re-enable RLS later, run:
-- alter table public.order_chat_threads enable row level security;
-- alter table public.order_chat_messages enable row level security;
