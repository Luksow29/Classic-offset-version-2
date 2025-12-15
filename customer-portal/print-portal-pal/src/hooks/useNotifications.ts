import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link_to?: string;
  user_id: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    const subscription = setupRealtimeSubscription();

    return () => {
      subscription?.then(unsub => unsub?.());
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    console.log('[Notifications] Setting up realtime subscription for user:', user.id);
    
    const subscription = supabase
      .channel(`customer-notifications-${user.id}-${Date.now()}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('[Notifications] New notification received:', payload);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification (in-app popup)
          toast({
            title: newNotification.title,
            description: newNotification.message.substring(0, 100) + (newNotification.message.length > 100 ? '...' : ''),
            variant: newNotification.type === 'system_alert' ? 'destructive' : 'default',
            duration: 5000,
          });
          
          // Show browser push notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const browserNotification = new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: `notification-${newNotification.id}`,
                requireInteraction: newNotification.type === 'system_alert',
              });
              
              browserNotification.onclick = () => {
                window.focus();
                if (newNotification.link_to) {
                  window.location.href = newNotification.link_to;
                }
                browserNotification.close();
              };
              
              // Auto close after 8 seconds
              setTimeout(() => browserNotification.close(), 8000);
            } catch (error) {
              console.error('[Notifications] Failed to show browser notification:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      toast({
        title: "All notifications marked as read",
        description: `${unreadIds.length} notifications updated.`,
      });

      return unreadIds.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};
