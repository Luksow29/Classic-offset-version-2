// src/hooks/useRealtimePresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

interface PresenceUser {
  user_id: string;
  name: string;
  role: string;
  online_at: string;
  status: 'online' | 'typing' | 'away';
  current_page?: string;
}

export const useRealtimePresence = (roomId?: string) => {
  const { user, userProfile } = useUser();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user || !userProfile) return;

    const channelName = roomId ? `presence-room-${roomId}` : 'presence-global';
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.keys(state).forEach((presenceKey) => {
          const presences = state[presenceKey];
          if (presences && presences.length > 0) {
            const presence = presences[0] as unknown as PresenceUser;
            if (presence.user_id && presence.name) {
              users.push(presence);
            }
          }
        });
        
        setOnlineUsers(users.filter(u => u.status === 'online'));
        setTypingUsers(users.filter(u => u.status === 'typing'));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Set initial presence
          await channel.track({
            user_id: user.id,
            name: userProfile.name,
            role: userProfile.role || 'Member',
            online_at: new Date().toISOString(),
            status: 'online',
            current_page: window.location.pathname
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userProfile, roomId]);

  const updateStatus = async (status: 'online' | 'typing' | 'away') => {
    if (!user || !userProfile) return;
    
    const channelName = roomId ? `presence-room-${roomId}` : 'presence-global';
    const channel = supabase.channel(channelName);
    
    await channel.track({
      user_id: user.id,
      name: userProfile.name,
      role: userProfile.role || 'Member',
      online_at: new Date().toISOString(),
      status,
      current_page: window.location.pathname
    });
  };

  const broadcastTyping = async (isTyping: boolean) => {
    await updateStatus(isTyping ? 'typing' : 'online');
    
    // Auto-clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => updateStatus('online'), 3000);
    }
  };

  return {
    onlineUsers,
    typingUsers,
    updateStatus,
    broadcastTyping
  };
};
