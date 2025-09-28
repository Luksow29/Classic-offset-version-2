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

    // --- SUBSCRIBE ---
    if (path.endsWith('/subscribe')) {
      const { subscription, userId } = body;
      if (!subscription || !userId || !subscription.endpoint) {
        throw new Error('Subscription, userId, and endpoint are required');
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
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
        if (!userId && !endpoint) {
            throw new Error('userId or endpoint is required');
        }
        let query = supabase.from('push_subscriptions').delete();
        if (endpoint) {
            query = query.eq('endpoint', endpoint);
        } else {
            query = query.eq('user_id', userId);
        }
        const { error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: 'Subscription removed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }


    // --- SEND NOTIFICATION ---
    if (path.endsWith('/send-notification')) {
      const { userId, title, body: notificationBody, data } = body;
      if (!userId) throw new Error('userId is required');

      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('subscription_details, endpoint')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      if (!subscriptions || subscriptions.length === 0) {
        return new Response(JSON.stringify({ error: 'No active subscriptions found for user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const notificationPayload = JSON.stringify({
        title: title || 'New Notification',
        body: notificationBody || 'You have a new update.',
        data: data || { url: '/' },
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription_details, notificationPayload);
        } catch (err) {
          if (err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Notifications sent' }), {
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
