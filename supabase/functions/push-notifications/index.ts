import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

// Configure web-push with environment variables
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:test@example.com',
  Deno.env.get('VITE_VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const body = await req.json().catch(() => ({}));

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const requiresAuth =
      path.endsWith('/subscribe') || path.endsWith('/unsubscribe') || path.endsWith('/send-notification');

    let authUserId: string | null = null;
    if (requiresAuth) {
      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      authUserId = authUser.id;
    }

    // --- SUBSCRIBE ---
    if (path.endsWith('/subscribe')) {
      const { subscription, userId } = body;
      if (!authUserId) throw new Error('Invalid or expired session');
      if (userId && userId !== authUserId) {
        return new Response(JSON.stringify({ error: 'userId must match the authenticated user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
      if (!subscription || !subscription.endpoint) {
        throw new Error('Subscription and endpoint are required');
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: authUserId,
        endpoint: subscription.endpoint,
        subscription_details: subscription,
        user_type: 'customer',
        is_active: true,
        last_used: new Date().toISOString()
      }, { onConflict: 'endpoint' });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: 'Subscription stored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // --- UNSUBSCRIBE ---
    if (path.endsWith('/unsubscribe')) {
        const { userId, endpoint } = body;
        if (!authUserId) throw new Error('Invalid or expired session');
        if (userId && userId !== authUserId) {
          return new Response(JSON.stringify({ error: 'userId must match the authenticated user' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
        if (!endpoint) {
          // Allow deleting all subscriptions for the current user
          const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', authUserId);
          if (error) throw error;
          return new Response(JSON.stringify({ success: true, message: 'Subscriptions removed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', authUserId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: 'Subscription removed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }


    // --- SEND NOTIFICATION ---
    if (path.endsWith('/send-notification')) {
      const { userId, title, body: notificationBody, data, category = 'system' } = body;
      
      if (!userId) throw new Error('userId is required');
      if (!authUserId) throw new Error('Invalid or expired session');

      // 1. Check User Settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('notification_preferences')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching settings:', settingsError);
        // Continue but log error, maybe default to sending? 
        // For now, let's be safe and assume if we can't check settings, we proceed with caution or default values.
        // But better to fail safe if critical. 
        // Let's assume default is ON if no settings found (which matches app default).
      }

      const prefs = settings?.notification_preferences || { 
        push: true, 
        types: { orders: true, payments: true, stock: true, system: true } 
      };

      // 2. Filter based on preferences
      if (!prefs.push) {
        return new Response(JSON.stringify({ success: false, message: 'User has disabled push notifications', skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Check specific category if provided
      if (category && prefs.types && prefs.types[category] === false) {
         return new Response(JSON.stringify({ success: false, message: `User has disabled ${category} notifications`, skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // 3. Fetch Subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('subscription_details, endpoint')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      
      if (!subscriptions || subscriptions.length === 0) {
        // Not an error, just no subscriptions
        return new Response(JSON.stringify({ success: false, message: 'No active subscriptions found for user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const notificationPayload = JSON.stringify({
        title: title || 'New Notification',
        body: notificationBody || 'You have a new update.',
        data: data || { url: '/' },
      });

      let sentCount = 0;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription_details, notificationPayload);
          sentCount++;
        } catch (err) {
          if (err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Notifications sent', sentCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // --- HEALTH CHECK ---
    // Respond to the root path for health checks
    return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        vapidConfigured: !!(Deno.env.get('VITE_VAPID_PUBLIC_KEY') && Deno.env.get('VAPID_PRIVATE_KEY'))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
