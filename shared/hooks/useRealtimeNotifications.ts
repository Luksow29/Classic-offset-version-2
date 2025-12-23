// shared/hooks/useRealtimeNotifications.ts
// Shared hook for real-time notification subscriptions

import { useEffect, useState, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '../api/supabaseClient';
import type { Notification } from '../types';

export interface UseRealtimeNotificationsOptions {
  /** Whether to enable the subscription (default: true) */
  enabled?: boolean;
  /** Callback when a new notification is received */
  onNotification?: (notification: Notification) => void;
  /** Maximum number of notifications to keep in state */
  maxNotifications?: number;
}

export interface UseRealtimeNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Mark a notification as read */
  markAsRead: (notificationId: number) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Refresh notifications from database */
  refresh: () => Promise<void>;
}

/**
 * Hook for real-time notification subscriptions
 * Works in both Main App and Customer Portal
 * 
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const { notifications, unreadCount, markAsRead } = useRealtimeNotifications({
 *     enabled: !!userId,
 *     onNotification: (n) => toast.success(n.title)
 *   });
 *   
 *   return <Badge count={unreadCount} />;
 * }
 * ```
 */
export function useRealtimeNotifications(
  userId: string | null,
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    enabled = true,
    onNotification,
    maxNotifications = 50,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onNotificationRef = useRef(onNotification);

  // Keep callback ref updated
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(maxNotifications);

      if (fetchError) {
        throw fetchError;
      }

      const notificationData = (data || []) as Notification[];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.is_read).length);
      setError(null);
    } catch (err) {
      console.error('[useRealtimeNotifications] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, maxNotifications]);

  // Setup realtime subscription
  useEffect(() => {
    if (!userId || !enabled) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    const supabase = getSupabase();
    const channelName = `notifications:${userId}:${Date.now()}`;
    
    console.log('[useRealtimeNotifications] Setting up subscription for:', userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useRealtimeNotifications] New notification:', payload);
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => {
            const updated = [newNotification, ...prev];
            return updated.slice(0, maxNotifications);
          });
          setUnreadCount(prev => prev + 1);

          // Call the callback if provided
          if (onNotificationRef.current) {
            onNotificationRef.current(newNotification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length);
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: number };
          setNotifications(prev => prev.filter(n => n.id !== deleted.id));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeNotifications] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('[useRealtimeNotifications] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, fetchNotifications, maxNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    const supabase = getSupabase();

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      console.error('[useRealtimeNotifications] Mark as read error:', updateError);
      return;
    }

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const supabase = getSupabase();

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (updateError) {
      console.error('[useRealtimeNotifications] Mark all as read error:', updateError);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
