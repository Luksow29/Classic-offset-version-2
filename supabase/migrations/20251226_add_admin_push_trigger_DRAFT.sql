-- Enable the pg_net extension if not already enabled
create extension if not exists "pg_net";

-- Create a function to call the Edge Function
create or replace function public.handle_new_admin_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  project_url text := 'https://ytnsjmbhgwcuwmnflncl.supabase.co'; -- Production URL
  edge_function_url text := project_url || '/functions/v1/push-notifications/notify-admins';
  service_role_key text := current_setting('app.settings.service_role_key', true); -- Ideally fetched securely, but for triggers we often need Env Var
  -- Since we can't easily access Env Vars in PL/PGSQL without vault, we'll use a hardcoded lookup or assume net.http_post fits.
  -- BETTER APPROACH: specific pg_net call.
  
  -- NOTES: 
  -- 1. Using pg_net is async (good).
  -- 2. We need the Service Role Key for the Authorization header.
  --    In a real prod environment, we should use `vault` or `pg_net` with secret.
  --    For this quick fix/recovery, we will construct the payload and let the Edge Function handle auth validation if possible, 
  --    OR we rely on the fact that this is an internal trigger.
  
  -- WAIT: The Edge Function `notify-admins` checks `requiresAuth`.
  -- It expects a Bearer token.
  -- Sending a request from Database is tricky without the token.
  -- ALTERNATIVE: Use the new `supabase_functions` schema if available, or just `net.http_post`.
begin
  -- Payload: the new notification row
  perform net.http_post(
    edge_function_url,
    jsonb_build_object(
      'notification', row_to_json(new)
    ),
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from public.secrets where name = 'SUPABASE_SERVICE_ROLE_KEY') -- Example logic, might fail if secret logic missing.
      -- If we cannot get the key easily, we might need to rely on a different mechanism.
    )
  );
  return new;
end;
$$;

-- Actually, managing secrets in SQL is hard.
-- A SAFER and EASIER way:
-- Let the Edge Function be "public" but protected by a shared secret header, OR use the `supabase_functions` helper if it exists.
-- But standard `pg_net` requires manually headers.

-- LET'S TRY A SIMPLER APPROACH used in many Supabase projects:
-- Define the Trigger to call the function.
-- Hardcode the Authorization header in the migration? NO, that's bad practice (exposed in git).

-- NEW STRATEGY:
-- We'll assume the user has `vault` installed or we can just send it without auth if we whitelist the Database IP? No.
-- We will use `net.http_post` and assume the edge function checks for a specific "Internal-Secret" or we just skip this "Database Trigger" approach and use a "Realtime Listener" in a Node.js worker? No, we are serverless.

-- BEST SERVERLESS APPROACH:
-- The Admin App is ALREADY listening to Realtime changes.
-- Why not let the Admin App trigger the push?
-- src/hooks/useAdminInAppNotifications.ts detects the INSERT.
-- It works!
-- It detects the INSERT, displays a Toast.
-- WHY NOT have IT call `notify-admins`?
-- Because if no Admin is online, no Push is sent.
-- Push Notifications are useful EXACTLY when no admin is online.
-- So it MUST be a Database Trigger.

-- HOW TO AUTHENTICATE DB -> EDGE FUNCTION?
-- We can set a "Database Webhook" in the Supabase Dashboard UI easily.
-- Can I create a "Database Webhook" via SQL?
-- Yes, `supabase_functions.http_request` usually handles the signed JWT.
-- If `supabase_functions` extension exists.

-- Let's check extensions.
