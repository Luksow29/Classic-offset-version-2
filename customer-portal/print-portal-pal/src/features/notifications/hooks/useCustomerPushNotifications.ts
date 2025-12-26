import { useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/shared/hooks/useToast';

export const useCustomerPushNotifications = (userId: string | undefined) => {
  const { toast } = useToast();
  // Keep audio context ref global to the hook instance
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize and "Unlock" Audio Context on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      // Create context if not exists
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      const ctx = audioCtxRef.current;

      // Resume if suspended
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Audio resume failed:", e));
      }

      // Play a short silent buffer to "warm up" / unlock the engine on iOS/Safari
      try {
        const buffer = ctx.createBuffer(1, 1, 22050); // 1 sample buffer
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        console.log("Audio Context Unlocked via interaction");
      } catch (e) {
        console.error("Audio unlock silent buffer failed:", e);
      }
    };

    // Listen for interactions once
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
        if (!ctx) {
            console.warn("Audio Context not initialized (no user interaction yet?)");
            return;
        }

        // Always try resume just in case
        if (ctx.state === 'suspended') {
             ctx.resume().catch(() => {});
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // High pitched pleasant "Ping"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
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
    if (!userId) return;

    console.log('[CustomerPush] Initializing global listener for user:', userId);

    const channel = supabase
      .channel(`global_customer_push_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new;
          // Only notify if message is from admin and NOT from self
          if (newMsg.sender_type === 'admin' && newMsg.sender_id !== userId) {
            console.log('[CustomerPush] Received Admin Message:', newMsg);
            
            const title = "New Message from Support";
            const body = newMsg.content || "You have a new message.";

            // 1. In-App Toast
            toast({
              title,
              description: body,
              duration: 5000,
            });
            
            // 2. Play Sound
            playBeep();

            // 3. Browser Push
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, {
                body,
                icon: `${window.location.origin}/icons/icon-192x192.png`,
                tag: `msg-${newMsg.id}`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);
};
