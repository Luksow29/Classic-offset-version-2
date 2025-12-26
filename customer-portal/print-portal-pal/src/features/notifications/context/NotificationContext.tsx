import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/shared/hooks/useToast';

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

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<number | undefined>;
    refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Audio Context Ref for sound
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context on interaction (Silent Unlock)
    useEffect(() => {
        const unlockAudio = () => {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContext();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => { });
            }

            try {
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            } catch (e) {
                console.error("Audio unlock failed:", e);
            }
        };

        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    const playBeep = () => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx) return;

            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => { });
            }

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Play beep failed:", e);
        }
    };

    useEffect(() => {
        let isMounted = true;
        let channel: ReturnType<typeof supabase.channel> | null = null;

        const fetchNotificationsLocal = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                if (isMounted) {
                    setNotifications(data || []);
                    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isMounted) return;

            console.log('[NotificationContext] Setting up subscription for:', user.id);

            channel = supabase
                .channel(`customer-notifications-${user.id}`)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        if (!isMounted) return;

                        if (payload.eventType === 'INSERT') {
                            const newNotification = payload.new as Notification;

                            setNotifications(prev => {
                                const next = [newNotification, ...prev];
                                setUnreadCount(next.filter(n => !n.is_read).length);
                                return next;
                            });

                            // In-App Toast
                            toast({
                                title: `🔔 ${newNotification.title}`,
                                description: newNotification.message.substring(0, 100) + (newNotification.message.length > 100 ? '...' : ''),
                                variant: newNotification.type === 'system_alert' ? 'destructive' : 'default',
                                duration: 8000,
                            });

                            // Play Sound
                            playBeep();

                            // Browser Push (in-tab)
                            if ('Notification' in window && Notification.permission === 'granted') {
                                try {
                                    const browserNotification = new window.Notification(newNotification.title, {
                                        body: newNotification.message,
                                        icon: `${window.location.origin}/icons/icon-192x192.png`,
                                        badge: `${window.location.origin}/icons/icon-72x72.png`,
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

                                } catch (error) {
                                    console.error('Browser notification failed:', error);
                                }
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            const updated = payload.new as Notification;
                            setNotifications(prev => {
                                const next = prev.map(n => n.id === updated.id ? updated : n);
                                setUnreadCount(next.filter(n => !n.is_read).length);
                                return next;
                            });
                        } else if (payload.eventType === 'DELETE') {
                            const deleted = payload.old as Notification;
                            setNotifications(prev => {
                                const next = prev.filter(n => n.id !== deleted.id);
                                setUnreadCount(next.filter(n => !n.is_read).length);
                                return next;
                            });
                        }
                    }
                )
                .subscribe();

            channelRef.current = channel;
        };

        fetchNotificationsLocal();
        setupSubscription();

        return () => {
            isMounted = false;
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [toast]);

    const markAsRead = async (notificationId: number) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking as read:', error);
            // Revert if needed (omitted for simplicity, but good practice)
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;

            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds);

            if (error) throw error;

            toast({
                title: "Marked all as read",
                description: `${unreadIds.length} notifications updated.`,
            });

            return unreadIds.length;
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const refreshNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};
