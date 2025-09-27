-- DIAGNOSTIC SCRIPT TO UNDERSTAND AUTHENTICATION SETUP
-- Run this to understand how authentication is configured

-- Check authentication configuration
select 'Auth Schema Exists:' as label, 
       case when exists(select 1 from information_schema.schemata where schema_name = 'auth') 
            then 'YES' else 'NO' end as value
union all
select 'Users Table Exists:' as label,
       case when exists(select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users')
            then 'YES' else 'NO' end as value
union all  
select 'Current Role:' as label, current_user as value
union all
select 'Session User:' as label, session_user as value
union all
select 'Auth Role Function:' as label, coalesce(auth.role()::text, 'NULL') as value
union all
select 'Auth UID Function:' as label, coalesce(auth.uid()::text, 'NULL') as value;

-- Check if there are any users in the auth.users table
select 'Total Users:' as label, count(*)::text as value from auth.users;

-- Check the first user (if any)
select 'First User ID:' as label, coalesce(id::text, 'NONE') as value 
from auth.users 
order by created_at 
limit 1;

-- Check current database and connection info
select 'Database:' as label, current_database() as value
union all
select 'Version:' as label, version() as value;

-- Check if JWT is being processed
select 'JWT Claims:' as label, 
       case when auth.jwt() is not null then 'HAS_JWT' else 'NO_JWT' end as value;

-- Test table permissions without policies
select 'Can Select Threads:' as label,
       case when exists(select 1 from information_schema.table_privileges 
                       where grantee = current_user 
                       and table_name = 'order_chat_threads' 
                       and privilege_type = 'SELECT')
            then 'YES' else 'NO' end as value;
