// src/context/RealtimeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from './UserContext';
import toast from 'react-hot-toast';

interface RealtimeContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: Date | null;
  activeUsers: number;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  connectionStatus: 'disconnected',
  lastActivity: null,
  activeUsers: 0
});

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    if (!user || !userProfile) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    setConnectionStatus('connecting');

    // Create a main presence channel for the application
    const mainChannel = supabase.channel('classic-offset-main', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    mainChannel
      .on('presence', { event: 'sync' }, () => {
        const state = mainChannel.presenceState();
        const userCount = Object.keys(state).length;
        setActiveUsers(userCount);
        setLastActivity(new Date());
        
        if (!isConnected) {
          setIsConnected(true);
          setConnectionStatus('connected');
          toast.success('🔄 Real-time connection established', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', newPresences);
        setLastActivity(new Date());
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', leftPresences);
        setLastActivity(new Date());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await mainChannel.track({
            user_id: user.id,
            name: userProfile.name,
            role: userProfile.role || 'Member',
            joined_at: new Date().toISOString(),
            page: window.location.pathname
          });
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setIsConnected(false);
          toast.error('Real-time connection failed', {
            duration: 3000
          });
        }
      });

    // Heartbeat to detect disconnections
    const heartbeat = setInterval(() => {
      if (mainChannel.state === 'joined') {
        setLastActivity(new Date());
      } else {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(mainChannel);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [user, userProfile]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        connectionStatus,
        lastActivity,
        activeUsers
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};
