-- Enable the pg_net extension for HTTP requests if not already enabled
create extension if not exists "pg_net";

-- Function to call the Edge Function for Customer Push Notifications
create or replace function public.handle_new_customer_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  project_url text := 'https://ytnsjmbhgwcuwmnflncl.supabase.co';
  edge_function_url text := project_url || '/functions/v1/push-notifications/send-notification'; -- Note: Endpoint might need adjustment if generic
  request_id int;
  notification_category text := 'orders'; -- Default category
begin
  -- Determine category based on type (simple mapping)
  if new.type = 'payment_received' then
    notification_category := 'payments';
  elsif new.type = 'system_alert' then
    notification_category := 'system';
  end if;

  -- Perform async HTTP POST using pg_net
  -- We share the same x-webhook-secret logic or similar auth bypass for internal triggers
  
  select net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'internal-trigger-secret-2025' -- Ensure edge function accepts this
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'title', new.title,
      'body', new.message,
      'category', notification_category,
      'data', jsonb_build_object(
          'url', new.link_to,
          'notificationId', new.id
      )
    )
  ) into request_id;

  return new;
end;
$$;

-- Create the Trigger
drop trigger if exists trigger_notify_customer_push on public.notifications;

create trigger trigger_notify_customer_push
  after insert on public.notifications
  for each row
  execute function public.handle_new_customer_notification();
