-- Enable the pg_net extension for HTTP requests
create extension if not exists "pg_net";

-- Function to call the Edge Function
create or replace function public.handle_new_admin_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  project_url text := 'https://ytnsjmbhgwcuwmnflncl.supabase.co';
  edge_function_url text := project_url || '/functions/v1/push-notifications/notify-admins';
  request_id int;
begin
  -- Perform async HTTP POST using pg_net
  -- We rely on the Edge Function's "x-webhook-secret" check to bypass User Auth
  
  select net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'internal-trigger-secret-2025'
    ),
    body := jsonb_build_object(
      'title', new.title,
      'body', new.message,
      'data', jsonb_build_object(
          'url', new.link_to,
          'notification_id', new.id,
          'type', new.type
      )
    )
  ) into request_id;

  return new;
end;
$$;

-- Create the Trigger
drop trigger if exists trigger_notify_admin_push on public.admin_notifications;

create trigger trigger_notify_admin_push
  after insert on public.admin_notifications
  for each row
  execute function public.handle_new_admin_notification();
