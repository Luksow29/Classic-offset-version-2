-- Create a function to handle order request status changes
create or replace function public.handle_order_request_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  notification_title text;
  notification_message text;
  notification_link text := '/admin/requests'; -- Link to order requests page
  notification_type text;
  customer_name text := 'Customer';
begin
  -- Check for Quote Accepted
  if (old.pricing_status is distinct from 'accepted') and (new.pricing_status = 'accepted') then
    notification_type := 'quote_accepted';
    notification_title := 'Quote Accepted';
    
    -- Try to fetch customer name
    begin
        select name into customer_name from public.customers where user_id = new.customer_id;
    exception when others then
        customer_name := 'Customer';
    end;
    
    notification_message := coalesce(customer_name, 'Customer') || ' accepted the quote for Order Request #' || new.id;

    -- Insert into admin_notifications
    insert into public.admin_notifications (
      type,
      title,
      message,
      link_to,
      created_at,
      is_read,
      related_id
    ) values (
      notification_type,
      notification_title,
      notification_message,
      notification_link,
      now(),
      false,
      new.id::text -- Store request ID
    );
  end if;

  return new;
end;
$$;

-- Create Trigger for Order Requests
drop trigger if exists trigger_notify_admin_on_order_request_update on public.order_requests;
create trigger trigger_notify_admin_on_order_request_update
  after update on public.order_requests
  for each row
  execute function public.handle_order_request_status_change();
