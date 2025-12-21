import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { supabase } from '@/services/supabase/client';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  loading: boolean;
  subscription: PushSubscription | null;
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (userId?: string) => {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    loading: false,
    subscription: null
  });
  
  const { toast } = useToast();

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
    }));

    return isSupported;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      toast({
        title: "Service Worker Error",
        description: "Failed to register service worker for notifications.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!state.isSupported || !userId) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription
      }));

      console.log('Current push subscription:', subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  }, [state.isSupported, userId]);

  // Request notification permission and subscribe
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID public key not found');
      toast({
        title: "Configuration Error",
        description: "Push notifications are not properly configured.",
        variant: "destructive",
      });
      return false;
    }

    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enable notifications.",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings to receive updates.",
          variant: "destructive",
        });
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Failed to register service worker');
      }

      // Subscribe to push notifications  
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
      });

      console.log('Push subscription created:', subscription);

      // Create subscription data object for storage
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
          auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
        }
      };

      // Save subscription to database (using existing schema)
      try {
        const { error: dbError } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            user_type: 'customer', // or detect based on user role
            endpoint: subscription.endpoint,
            p256dh_key: subscriptionData.keys.p256dh,
            auth_key: subscriptionData.keys.auth,
            browser_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
            },
            is_active: true,
          }, {
            onConflict: 'endpoint',
            ignoreDuplicates: false
          });

        if (dbError) {
          console.error('Failed to save subscription to database:', dbError);
          throw dbError;
        }

        console.log('Subscription saved to database successfully');

        // Also keep in localStorage as backup for offline support
        localStorage.setItem('pushSubscription', JSON.stringify({
          ...subscriptionData,
          userId: userId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error saving subscription to database:', error);
        throw error;
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        loading: false
      }));

      toast({
        title: "Notifications Enabled! 🎉",
        description: "You'll now receive push notifications for order updates and messages.",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      
      setState(prev => ({ ...prev, loading: false }));

      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [state.isSupported, userId, registerServiceWorker, toast]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !userId) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const currentEndpoint = state.subscription?.endpoint;
      
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('Push subscription cancelled');
        }
      }

      // Remove from database
      if (currentEndpoint) {
        try {
          const { error: dbError } = await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('endpoint', currentEndpoint)
            .eq('user_id', userId);

          if (dbError) {
            console.error('Failed to deactivate subscription in database:', dbError);
          } else {
            console.log('Subscription deactivated in database successfully');
          }
        } catch (error) {
          console.error('Error updating subscription in database:', error);
        }
      }

      // Remove from localStorage
      localStorage.removeItem('pushSubscription');

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        loading: false
      }));

      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore.",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      
      setState(prev => ({ ...prev, loading: false }));

      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable push notifications. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [state.isSupported, state.subscription?.endpoint, userId, toast]);

  // Send a test notification
    const sendTestNotification = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notifications/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          userId: userId,
          title: 'Test Notification',
          body: 'This is a test notification from your customer portal!',
          data: { url: '/customer-portal' },
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg'
        }),
      });

      if (response.ok) {
        toast({
          title: "Test Sent",
          description: "Check for the notification!",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  // Get subscription info for debugging
  const getSubscriptionInfo = useCallback(() => {
    const stored = localStorage.getItem('pushSubscription');
    return stored ? JSON.parse(stored) : null;
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Check subscription when user changes
  useEffect(() => {
    if (userId && state.isSupported) {
      checkSubscription();
    }
  }, [userId, state.isSupported, checkSubscription]);

  // Listen for service worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};

      switch (type) {
        case 'NOTIFICATION_CLICK':
          console.log('Notification clicked, navigating to:', data?.url);
          if (data?.url && data.url !== window.location.pathname) {
            window.location.href = data.url;
          }
          break;
        
        case 'PUSH_RECEIVED':
          console.log('Push notification received:', data);
          break;
          
        default:
          console.log('Service worker message:', event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    ...state,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    checkSubscription,
    registerServiceWorker,
    getSubscriptionInfo
  };
};
