import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import toast from 'react-hot-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { usePushNotifications } from '@/hooks/usePushNotifications';

import { normalizeStaffRole } from '@/lib/rbac';


// Helper to validate UUIDs
const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

// Define types broadly to cover both admin and potential user notifications

export interface Notification {
    id: string; // Changed to string to support both UUIDs and potentially other IDs
    user_id?: string; // Optional, as admin notifications might not be user-specific
    type: string;
    title?: string;
    message: string;
    link_to?: string;
    related_id?: string;
    triggered_by?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
    isPushEnabled: boolean;
    enablePush: () => Promise<boolean>;
    disablePush: () => Promise<boolean>;
    pushPermission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

const ADMIN_ROLES = new Set(['owner', 'manager', 'office', 'designer', 'production', 'purchase']);
const TOAST_NOTIFICATION_TYPES = new Set(['support_message', 'order_chat_message', 'order_request', 'payment', 'customer_created']);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile } = useUser();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio for notification sound
    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3'); // Ensure this file exists in public/
        // Fallback or check if file exists skipped for now
    }, []);

    const playFallbackSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Pleasant "ping" sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Fallback sound failed:", e);
        }
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            // Check if audio is playable or has error
            if (audioRef.current.error) {
                console.warn("Notification sound file missing/error, playing fallback.");
                playFallbackSound();
                return;
            }
            const promise = audioRef.current.play();
            if (promise !== undefined) {
                promise.catch(e => {
                    // If file load failed or not supported, play fallback
                    console.warn("Audio play failed, using fallback:", e);
                    playFallbackSound();
                });
            }
        } else {
            playFallbackSound();
        }
    };

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Robust Role Check
            const normalizedRole = normalizeStaffRole(userProfile?.role);
            const isAdmin = normalizedRole && ADMIN_ROLES.has(normalizedRole);

            console.log(`[NotificationContext] Fetching for role: ${userProfile?.role} (Normalized: ${normalizedRole}), IsAdmin: ${isAdmin}`);

            const tableName = isAdmin ? 'admin_notifications' : 'notifications';

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Validate IDs based on mode to prevent mixing types (e.g. UUID vs Int)
            const loadedNotifications = (data as any[]).map(n => ({
                ...n,
                id: String(n.id) // Ensure ID is string
            })).filter(n => {
                // Ensure we only keep valid notifications for the current table type
                // This prevents "leakage" of integer-ID notifications into the admin view
                if (isAdmin) {
                    return isValidUUID(n.id);
                }
                return true;
            });

            setNotifications(loadedNotifications);
            setUnreadCount(loadedNotifications.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch & Reset on Role Change
    useEffect(() => {
        // Clear notifications when role changes to avoid mixing table data (Integer vs UUID)
        setNotifications([]);
        setUnreadCount(0);
        fetchNotifications();
    }, [user, userProfile?.role]);

    // Realtime Subscription
    useEffect(() => {
        if (!user) return;

        const normalizedRole = normalizeStaffRole(userProfile?.role);
        const isAdmin = normalizedRole && ADMIN_ROLES.has(normalizedRole);
        const tableName = isAdmin ? 'admin_notifications' : 'notifications';

        // Filter: Admin sees all (or role filtered? Assuming all for now based on previous code), User sees own
        const filter = isAdmin ? undefined : `user_id=eq.${user.id}`;

        const channelName = `realtime-notifications-${user.id}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                filter
                    ? {
                        event: '*', // Listen for INSERT and UPDATE
                        schema: 'public',
                        table: tableName,
                        filter,
                    }
                    : {
                        event: '*', // Listen for INSERT and UPDATE
                        schema: 'public',
                        table: tableName,
                    },
                (payload) => {
                    console.log('[NotificationContext] Realtime event:', payload);

                    if (payload.eventType === 'INSERT') {
                        const newNotif = { ...payload.new, id: String(payload.new.id) } as Notification;

                        if (isAdmin && !isValidUUID(newNotif.id)) {
                            console.warn('[NotificationContext] Ignoring INSERT with invalid admin UUID:', newNotif.id);
                            return;
                        }

                        setNotifications(prev => {
                            const next = [newNotif, ...prev];
                            setUnreadCount(next.filter(n => !n.is_read).length);
                            return next;
                        });

                        // Toast and Sound
                        if (TOAST_NOTIFICATION_TYPES.has(newNotif.type) || !isAdmin) {
                            const title = newNotif.title || 'New Notification';
                            const message = newNotif.message;

                            // Use toast.custom or a standard string format that shows the title
                            toast((t) => (
                                <span>
                                    <div style={{ fontWeight: 600 }}>{title}</div>
                                    <div style={{ fontSize: '0.9em' }}>{message}</div>
                                </span>
                            ), {
                                icon: '🔔',
                                duration: 5000,
                                position: 'top-right',
                                style: {
                                    background: '#333',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    padding: '12px',
                                }
                            });
                            playNotificationSound();

                            // Trigger Browser Push Notification if permission is granted
                            // This ensures the admin gets notified even if the tab is not focused
                            if ('Notification' in window && Notification.permission === 'granted') {
                                try {
                                    const url = newNotif.link_to || '/notifications';
                                    const browserNotification = new Notification(title, {
                                        body: message,
                                        icon: `${window.location.origin}/icons/icon-192x192.png`,
                                        tag: `admin-notif-${newNotif.id}`
                                    });
                                    browserNotification.onclick = () => {
                                        try {
                                            window.focus();
                                            window.location.href = url;
                                        } finally {
                                            browserNotification.close();
                                        }
                                    };
                                } catch (e) {
                                    console.error("Error showing browser notification:", e);
                                }
                            }
                        }
                    }

                    else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = { ...payload.new, id: String(payload.new.id) } as Notification;
                        if (isAdmin && !isValidUUID(updatedNotif.id)) {
                            console.warn('[NotificationContext] Ignoring UPDATE with invalid admin UUID:', updatedNotif.id);
                            return;
                        }

                        setNotifications(prev => {
                            const next = prev.map(n => n.id === updatedNotif.id ? updatedNotif : n);
                            setUnreadCount(next.filter(n => !n.is_read).length);
                            return next;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, userProfile?.role]);


    const markAsRead = async (id: string) => {
        const normalizedRole = normalizeStaffRole(userProfile?.role);
        const isAdmin = normalizedRole && ADMIN_ROLES.has(normalizedRole);
        const tableName = isAdmin ? 'admin_notifications' : 'notifications';

        try {
            // Validate ID format based on table
            if (isAdmin && !isValidUUID(id)) {
                console.warn(`[NotificationContext] Skipping markAsRead for invalid UUID: ${id} on admin table`);
                // Optimistically remove it or mark read to clear UI
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
                return;
            }

            // Optimistic Update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            const { error } = await supabase
                .from(tableName)
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error("Error marking as read:", err);
            // Revert optimization if needed (omitted for brevity)
        }
    };

    const markAllAsRead = async () => {
        const normalizedRole = normalizeStaffRole(userProfile?.role);
        const isAdmin = normalizedRole && ADMIN_ROLES.has(normalizedRole);
        const tableName = isAdmin ? 'admin_notifications' : 'notifications';

        // Only mark *loaded* unread notifications as read to avoid massive DB updates if unnecessary
        const idsToUpdate = notifications.filter(n => !n.is_read).map(n => n.id);

        // Filter IDs to ensure we don't send conflicting types (e.g. integers to UUID column)
        const validIdsToUpdate = idsToUpdate.filter(id => {
            if (!id) return false;
            // If we are targeting admin_notifications, ONLY allow valid UUIDs
            if (isAdmin) {
                return isValidUUID(id);
            }
            return true;
        });

        if (validIdsToUpdate.length === 0) {
            // If we filtered everything out (e.g. all were legacy integers), just clear UI state
            if (idsToUpdate.length > 0) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
            return;
        }

        try {
            // Optimistic Update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);

            const { error } = await supabase
                .from(tableName)
                .update({ is_read: true })
                .in('id', validIdsToUpdate);

            if (error) throw error;

            // Re-fetch to ensure server state is perfectly synced (e.g. if new unread items came in or update failed partially)
            await fetchNotifications();

        } catch (err: any) {
            console.error("Error marking all as read:", err);
            toast.error("Failed to mark notifications as read");
            // Optionally revert state here, or just let the re-fetch handle it
            await fetchNotifications();
        }
    };

    // Push Notifications Integration
    const {
        isSubscribed,
        subscribeToPush,
        unsubscribeFromPush,
        permission: pushPermission
    } = usePushNotifications(user?.id);

    // Auto-check on mount (hook handles it)

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications,
            // Expose Push capabilities
            isPushEnabled: isSubscribed,
            enablePush: subscribeToPush,
            disablePush: unsubscribeFromPush,
            pushPermission
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
