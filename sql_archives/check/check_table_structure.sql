-- CHECK ACTUAL TABLE STRUCTURE AND DATA TYPES
-- Run this to understand the column types and relationships

-- Check order_chat_threads structure
select 'THREADS TABLE STRUCTURE:' as info, '' as detail
union all
select column_name as info, 
       data_type || 
       case when character_maximum_length is not null 
            then '(' || character_maximum_length || ')' 
            else '' end ||
       case when is_nullable = 'NO' then ' NOT NULL' else ' NULL' end as detail
from information_schema.columns 
where table_name = 'order_chat_threads' and table_schema = 'public';

-- Check order_chat_messages structure  
select 'MESSAGES TABLE STRUCTURE:' as info, '' as detail
union all
select column_name as info,
       data_type || 
       case when character_maximum_length is not null 
            then '(' || character_maximum_length || ')' 
            else '' end ||
       case when is_nullable = 'NO' then ' NOT NULL' else ' NULL' end as detail
from information_schema.columns
where table_name = 'order_chat_messages' and table_schema = 'public';

-- Check foreign key constraints
select 'FOREIGN KEY CONSTRAINTS:' as info, '' as detail
union all
select 
    tc.constraint_name as info,
    tc.table_name || '.' || kcu.column_name || ' -> ' || 
    ccu.table_name || '.' || ccu.column_name as detail
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
    and tc.table_name in ('order_chat_threads', 'order_chat_messages');

-- Check if auth.users table exists
select 'AUTH USERS TABLE:' as info,
       case when exists(select 1 from information_schema.tables 
                       where table_schema = 'auth' and table_name = 'users')
            then 'EXISTS' 
            else 'MISSING' end as detail;

-- Sample data from threads (if any)
select 'SAMPLE THREAD DATA:' as info, '' as detail
union all
select 'ID Type:' as info, pg_typeof(id)::text as detail
from order_chat_threads limit 1;

-- Sample data from messages (if any)  
select 'SAMPLE MESSAGE DATA:' as info, '' as detail
union all
select 'Thread ID Type:' as info, pg_typeof(thread_id)::text as detail
from order_chat_messages limit 1;
