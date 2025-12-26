-- Create a function to handle new chat messages from customers
-- This function will be triggered by both order_chat_messages and support_messages
create or replace function public.handle_new_customer_chat_message()
returns trigger
language plpgsql
security definer
as $$
declare
  notification_title text;
  notification_message text;
  notification_link text;
  notification_type text;
  customer_name text := 'Customer';
begin
  -- Only proceed if the sender is a customer
  if new.sender_type != 'customer' then
    return new;
  end if;

  -- Determine context based on the table name or passed arguments (simplest is to check fields)
  -- But since this function is shared, we need to know which table triggered it, or strict logic.
  -- Alternatively, we can use TG_TABLE_NAME if we want a single function, or two separate functions.
  -- Let's use TG_TABLE_NAME for a unified dynamic approach, or just separate logic blocks.

  if TG_TABLE_NAME = 'order_chat_messages' then
      notification_type := 'order_chat_message';
      notification_link := '/admin/requests/chat'; -- General link, or could be specific if routing supports it
      
      -- Try to get customer name if possible, or just say "Customer"
      -- (Optional: Fetch customer name from customers table using new.sender_id if it's a UUID)
      
      notification_title := 'New Order Message';
      
      -- Handle message content (text vs file)
      if new.message_type = 'text' then
        notification_message := substring(new.content from 1 for 100); -- Truncate
      else
        notification_message := 'Sent a file: ' || coalesce(new.file_name, 'Attachment');
      end if;

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
        new.thread_id -- Store thread ID as related_id
      );

  elsif TG_TABLE_NAME = 'support_messages' then
      notification_type := 'support_message';
      notification_link := '/admin/support'; 
      notification_title := 'New Support Message';
      
      -- Support messages table usually has 'message' column, not 'content'
      -- Adjusting based on schema seen in CustomerSupportPage.tsx (it uses 'message')
      notification_message := substring(new.message from 1 for 100);

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
        new.ticket_id -- Store ticket ID as related_id
      );
  end if;

  return new;
end;
$$;

-- Trigger for Order Chat Messages
drop trigger if exists trigger_notify_admin_on_order_chat on public.order_chat_messages;
create trigger trigger_notify_admin_on_order_chat
  after insert on public.order_chat_messages
  for each row
  execute function public.handle_new_customer_chat_message();

-- Trigger for Support Chat Messages
drop trigger if exists trigger_notify_admin_on_support_chat on public.support_messages;
create trigger trigger_notify_admin_on_support_chat
  after insert on public.support_messages
  for each row
  execute function public.handle_new_customer_chat_message();
