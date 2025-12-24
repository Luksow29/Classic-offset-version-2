import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_to?: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Fetch unread count
        const { count, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (countError) throw countError;
        setUnreadCount(count || 0);

        // Fetch recent notifications
        const { data, error: dataError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (dataError) throw dataError;
        setNotifications(data || []);

      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime changes
    const channelName = `notifications-${user.id}`;
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('[useNotifications] Realtime event:', payload);
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            // Show toast for new notification? Optional
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
            // Re-fetch count to be accurate if read status changed
            if (updatedNotification.is_read) {
                 setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useNotifications] Subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log(`[useNotifications] Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    unreadCount,
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
