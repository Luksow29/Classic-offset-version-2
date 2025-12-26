import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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

  try {
    let vapidPublicKey: string | undefined;
    let vapidPrivateKey: string | undefined;

    // 1. Configure VAPID (LAZY LOAD)
    try {
      const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:test@example.com';
      vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY');
      vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

      if (!vapidPublicKey || !vapidPrivateKey) {
          console.error("Missing VAPID Keys: Public or Private key is undefined");
          return new Response(JSON.stringify({ 
              error: 'Server Configuration Error: Missing VAPID Public/Private Keys. Please check Supabase Secrets.',
              details: { hasPublic: !!vapidPublicKey, hasPrivate: !!vapidPrivateKey }
          }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
          });
      }

      webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
    } catch (configError) {
        console.error("VAPID Configuration Failed:", configError);
        return new Response(JSON.stringify({ error: `Invalid VAPID Configuration: ${configError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const body = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({ error: 'Missing Supabase Configuration (URL or Anon Key)' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
    }

    const authHeader = req.headers.get('Authorization') || '';

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );

    const requiresAuth =
      path.endsWith('/subscribe') || 
      path.endsWith('/unsubscribe') || 
      path.endsWith('/send-notification') || 
      path.endsWith('/notify-admins');

    let authUserId: string | null = null;
    let isInternalTrigger = false;

    // WEBHOOK AUTH BYPASS
    const webhookSecret = req.headers.get('x-webhook-secret');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (webhookSecret && (webhookSecret === serviceRoleKey || webhookSecret === 'internal-trigger-secret-2025')) {
       isInternalTrigger = true;
       console.log("Internal Webhook Triggered (Auth Bypassed)");
    }

    if (requiresAuth && !isInternalTrigger) {
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
      const errors = [];
      
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription_details, notificationPayload);
          sentCount++;
        } catch (err: any) {
          console.error("Error sending to subscription:", err);
          errors.push({ endpoint: sub.endpoint, error: err.message, statusCode: err.statusCode });
          
          if (err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Notifications processed', sentCount, errors }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- NOTIFY ADMINS (BROADCAST) ---
    if (path.endsWith('/notify-admins')) {
      const { title, body: notificationBody, data } = body;
      
      if (!authUserId && !isInternalTrigger) throw new Error('Invalid or expired session');

      // Use Service Role to find admins
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // 1. Find Admin User IDs
      // Fetch all users with a role (Staff) and filter in memory to handle case-sensitivity
      const { data: staffUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .not('role', 'is', null);

      if (adminError) {
          console.error("Error fetching admins:", adminError);
          // Fallback: Try 'profiles' table just in case 'users' is wrong (common Supabase pattern)
          // But UserContext confirmed 'users'.
          throw adminError;
      }
      
      const targetRoles = ['owner', 'admin', 'manager', 'office', 'production', 'designer'];
      
      const admins = staffUsers?.filter(u => {
          const r = u.role?.toLowerCase().trim();
          return r && targetRoles.includes(r);
      }) || [];

      if (adminError) throw adminError;
      
      if (!admins || admins.length === 0) {
        return new Response(JSON.stringify({ success: false, message: 'No admins found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const adminIds = admins.map(a => a.id);

      // 2. Fetch Subscriptions for these Admins
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription_details, endpoint')
        .in('user_id', adminIds)
        .eq('is_active', true);

      if (subError) throw subError;

      if (!subscriptions || subscriptions.length === 0) {
         return new Response(JSON.stringify({ success: false, message: 'No admin subscriptions active' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // 3. Broadcast
      const notificationPayload = JSON.stringify({
        title: title || 'Admin Alert',
        body: notificationBody || 'New update requiring attention.',
        data: data || { url: '/admin' },
      });

      let sentCount = 0;
      const sendPromises = subscriptions.map(async (sub) => {
         try {
          await webpush.sendNotification(sub.subscription_details, notificationPayload);
          sentCount++;
        } catch (err) {
          console.error("Error sending to admin:", err);
          if (err.statusCode === 410) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      });

      await Promise.all(sendPromises);

      return new Response(JSON.stringify({ success: true, message: 'Admin notifications sent', sentCount, totalAdmins: adminIds.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- HEALTH CHECK ---
    // Respond to the root path for health checks
    return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        vapidConfigured: !!(vapidPublicKey && vapidPrivateKey)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Global Error Handler:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Explicitly 500 for unhandled errors
    });
  }
});
