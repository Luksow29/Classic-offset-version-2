-- SIMPLE TABLE STRUCTURE CHECK
-- Quick check of column types and foreign keys

-- Threads table columns
select 'THREADS COLUMNS:' as info;
select column_name, data_type, is_nullable
from information_schema.columns 
where table_name = 'order_chat_threads' and table_schema = 'public';

-- Messages table columns  
select 'MESSAGES COLUMNS:' as info;
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'order_chat_messages' and table_schema = 'public';

-- Check what type the ID columns actually are
select 'THREAD ID TYPE:' as info;
select pg_typeof(id) as thread_id_type from order_chat_threads limit 1;

select 'MESSAGE THREAD_ID TYPE:' as info;  
select pg_typeof(thread_id) as message_thread_id_type from order_chat_messages limit 1;

-- Check if auth.users exists
select 'AUTH USERS EXISTS:' as info,
       case when exists(select 1 from information_schema.tables 
                       where table_schema = 'auth' and table_name = 'users')
            then 'YES' else 'NO' end as result;
