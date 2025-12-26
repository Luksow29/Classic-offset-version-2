-- Enable Realtime for order_requests table
begin;
  -- Add table to publication if not already present
  do $$
  begin
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'order_requests'
    ) then
      alter publication supabase_realtime add table public.order_requests;
    end if;
  end $$;
  
  -- Ensure Replica Identity is Full for proper updates
  alter table public.order_requests replica identity full;
commit;
