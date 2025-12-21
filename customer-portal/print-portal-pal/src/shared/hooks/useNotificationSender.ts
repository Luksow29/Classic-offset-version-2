import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  duration?: number;
}

/**
 * Unified notification sender hook
 * Consolidates notification logic from multiple files into one reusable hook
 */
export const useNotificationSender = () => {
  const { toast } = useToast();

  /**
   * Show an in-app toast notification
   */
  const showToast = useCallback((options: NotificationOptions) => {
    toast({
      title: options.title,
      description: options.message,
      variant: options.type === 'error' ? 'destructive' : 'default',
      duration: options.duration || 5000,
    });
  }, [toast]);

  /**
   * Show a browser notification
   * Returns true if shown successfully, false otherwise
   */
  const showBrowserNotification = useCallback(async (options: NotificationOptions): Promise<boolean> => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    // Check permission
    let permission = Notification.permission;
    
    if (permission === 'default') {
      // Request permission if not yet asked
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-72x72.png',
        tag: options.tag || `notification-${Date.now()}`,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      // Auto-close after duration
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), options.duration || 5000);
      }

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      return false;
    }
  }, []);

  /**
   * Show both toast and browser notification
   */
  const showNotification = useCallback(async (options: NotificationOptions) => {
    // Always show toast
    showToast(options);

    // Try to show browser notification
    const browserShown = await showBrowserNotification(options);
    
    return {
      toastShown: true,
      browserShown,
    };
  }, [showToast, showBrowserNotification]);

  /**
   * Check if browser notifications are enabled
   */
  const canShowBrowserNotifications = useCallback(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  /**
   * Request browser notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  return {
    showToast,
    showBrowserNotification,
    showNotification,
    canShowBrowserNotifications,
    requestPermission,
    permission: typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default' as NotificationPermission,
  };
};
