import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast'; // Using react-hot-toast instead of shadcn/ui toast as seen in App.tsx
import { supabase } from '@/lib/supabaseClient';

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
      toast.error("Failed to register service worker for notifications.");
      return null;
    }
  }, []);

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
      toast.error("Push notifications are not supported in this browser.");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID public key not found');
      toast.error("Push notifications are not properly configured (Missing Key).");
      return false;
    }

    if (!userId) {
      toast.error("Please log in to enable notifications.");
      return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast.error("Please enable notifications in your browser settings.");
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

      // Store subscription data in localStorage for now
      localStorage.setItem('pushSubscription', JSON.stringify({
        ...subscriptionData,
        userId: userId,
        timestamp: new Date().toISOString()
      }));

      // Send subscription to backend server
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            subscription: subscriptionData,
            userId: userId
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to store subscription on server:', error);
        } else {
          console.log('Subscription stored on server successfully');
        }
      } catch (error) {
        console.error('Error sending subscription to server:', error);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        loading: false
      }));

      toast.success("Notifications Enabled! You'll now receive push notifications.");

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      
      setState(prev => ({ ...prev, loading: false }));

      toast.error("Failed to enable push notifications. Please try again.");
      
      return false;
    }
  }, [state.isSupported, userId, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !userId) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('Push subscription cancelled');
        }
      }

      // Remove from localStorage
      localStorage.removeItem('pushSubscription');

      // Notify backend server
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            userId: userId,
            endpoint: state.subscription?.endpoint
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to remove subscription from server:', error);
        } else {
          console.log('Subscription removed from server successfully');
        }
      } catch (error) {
        console.error('Error removing subscription from server:', error);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        loading: false
      }));

      toast.success("Notifications Disabled.");

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      
      setState(prev => ({ ...prev, loading: false }));

      toast.error("Failed to disable push notifications. Please try again.");
      
      return false;
    }
  }, [state.isSupported, userId]);

  // Send a test notification
    const sendTestNotification = useCallback(async () => {
    if (!userId) {
      toast.error("User ID not available");
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
          body: 'This is a test notification from Classic Offset!',
          data: { url: '/' },
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png'
        }),
      });

      if (response.ok) {
        toast.success("Test Sent! Check for the notification.");
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast.error(error.message || "Failed to send test notification");
    }
  }, [userId]);

  // Initialize on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Check subscription when user changes
  useEffect(() => {
    if (userId && state.isSupported) {
      checkSubscription();
      
      // Attempt to update the service worker to ensure latest logic
      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(reg => {
              if (reg) {
                  reg.update().catch(err => console.log('SW update check failed:', err));
              }
          });
      }
    }
  }, [userId, state.isSupported, checkSubscription]);

  return {
    ...state,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    checkSubscription,
    registerServiceWorker
  };
};
