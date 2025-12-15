/**
 * PRODUCTION Order Chat Hook - DO NOT OVERWRITE WITH STUBS
 * -------------------------------------------------------------
 * This file contains the real Supabase-integrated implementation.
 * Avoid overwriting with demo/stub versions. If you need a mock,
 * create a separate `useOrderChat.mock.ts` and swap via env flag.
 * -------------------------------------------------------------
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatThread, ChatMessage } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export const useOrderChat = (orderId: number) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  // Get current user from Supabase session
  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('getSession error', error);
        setLastError(`AUTH_SESSION_ERROR: ${error.message}`);
      }
      if (session?.user && mountedRef.current) {
        setSessionUserId(session.user.id);
      }
      return session?.user;
    } catch (e: any) {
      console.error('Unexpected getSession error', e);
      setLastError(`AUTH_SESSION_UNEXPECTED: ${e.message}`);
      return null;
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    const user = await getCurrentUser();
    console.log('Fetching threads - User:', user?.email, 'Order ID:', orderId);
    
    if (!user) {
      console.log('No user found, skipping thread fetch');
      return;
    }
    
    setLoading(true);
    setLastError(null);
    try {
      const { data, error } = await supabase
        .from('order_chat_threads')
        .select('*')
        .eq('order_id', orderId)
        .eq('customer_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching threads:', error);
        throw error;
      }
      
      console.log('Fetched threads:', data);
      setThreads((data as ChatThread[]) || []);
    } catch (error: any) {
      console.error('Error fetching threads:', error);
      
      // More detailed error reporting
      let errorMessage = "Failed to load chat threads.";
      if (error.message?.includes('relation "order_chat_threads" does not exist')) {
        errorMessage = "Chat system not set up. Please run step9_create_chat_system.sql first.";
      }
      if (error.message?.includes('permission denied')) {
        errorMessage += ' (permission denied)';
      }
      setLastError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getCurrentUser, orderId, toast]);

  const fetchMessages = useCallback(async (threadId: string) => {
    const user = await getCurrentUser();
    if (!user) return;

    setLoading(true);
    try {
      // Simple query without foreign key joins - thread_id is UUID
      console.log('Fetching messages for thread_id:', threadId, 'type:', typeof threadId);
      const { data, error } = await supabase
        .from('order_chat_messages')
        .select('*')
        .eq('thread_id', threadId) // threadId should be UUID string
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      setMessages((data as ChatMessage[]) || []);
      
      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => 
          msg.sender_id !== user.id && !msg.is_read
        );
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('order_chat_messages')
            .update({ 
              is_read: true, 
              read_at: new Date().toISOString() 
            })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getCurrentUser, toast]);

  const createThread = useCallback(async (subject: string, priority: 'low' | 'normal' | 'high' | 'urgent'): Promise<ChatThread | null> => {
    const user = await getCurrentUser();
    console.log('Creating thread - User:', user?.email, 'Order ID:', orderId);
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create a chat thread.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Attempting to insert thread with data:', {
        order_id: orderId,
        customer_id: user.id,
        subject,
        priority,
        status: 'active'
      });

      const { data, error } = await supabase
        .from('order_chat_threads')
        .insert({
          order_id: orderId,
          customer_id: user.id,
          subject,
          priority,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Thread created successfully:', data);

      toast({
        title: "Chat thread created",
        description: `Created new thread: ${subject}`,
      });
      
      // Refresh threads after creating
      await fetchThreads();
      
      // Return the thread object that matches ChatThread interface
      const chatThread: ChatThread = {
        id: data.id,
        order_id: data.order_id,
        customer_id: data.customer_id,
        subject: data.subject,
        status: data.status as ChatThread['status'],
        priority: data.priority as ChatThread['priority'],
        last_message_at: data.last_message_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      return chatThread;
    } catch (error: any) {
      console.error('Error creating thread:', error);
      let errorMessage = "Failed to create chat thread.";
      if (error.message?.includes('relation "order_chat_threads" does not exist')) {
        errorMessage = "Chat system not set up. Please run the database migration first.";
      } else if (error.message?.includes('permission denied')) {
        errorMessage = `Permission denied. User: ${sessionUserId || 'unknown'} - Check RLS policies.`;
      }
      setLastError(errorMessage + ` Raw: ${error.message}`);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [getCurrentUser, orderId, sessionUserId, toast, fetchThreads]);

  const sendMessage = useCallback(async (threadId: string, content: string, messageType: 'text' | 'file' | 'image' = 'text', fileData?: {
    file_url?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
  }) => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      console.log('Sending message - Thread ID:', threadId, 'User ID:', user.id, 'Type:', messageType);
      
      const messageData = {
        thread_id: threadId,
        sender_id: user.id,
        sender_type: 'customer' as const,
        message_type: messageType,
        content,
        is_read: false,
        ...(fileData && {
          file_url: fileData.file_url,
          file_name: fileData.file_name,
          file_size: fileData.file_size,
          file_type: fileData.file_type
        })
      };

      console.log('Inserting message with data:', messageData);
      
      const { data, error } = await supabase
        .from('order_chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('order_chat_threads')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId);

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      
      // Refresh messages after sending
      await fetchMessages(threadId);
      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  }, [getCurrentUser, fetchMessages, toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Track the current thread ID for realtime updates
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Update currentThreadId when fetchMessages is called
  const fetchMessagesWithTracking = useCallback(async (threadId: string) => {
    setCurrentThreadId(threadId);
    return fetchMessages(threadId);
  }, [fetchMessages]);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let currentUserId: string | null = null;

    const setupRealtimeSubscription = async () => {
      const user = await getCurrentUser();
      if (!user || !active) return;
      
      currentUserId = user.id;
      console.log('[OrderChat Realtime] Setting up subscription for order:', orderId, 'user:', user.id);

      channel = supabase
        .channel(`order_chat_${orderId}_${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'order_chat_threads',
          filter: `order_id=eq.${orderId}`,
        }, (payload) => {
          console.log('[OrderChat Realtime] Thread change:', payload);
          if (active) fetchThreads();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
        }, (payload) => {
          console.log('[OrderChat Realtime] New message received:', payload);
          
          if (payload.new && active) {
            const newMsg = payload.new as ChatMessage;
            console.log('[OrderChat Realtime] Message details - sender_type:', newMsg.sender_type, 'sender_id:', newMsg.sender_id, 'currentUserId:', currentUserId);
            
            // Show toast notification for messages from admin (not from self)
            if (newMsg.sender_type === 'admin' && newMsg.sender_id !== currentUserId) {
              console.log('[OrderChat Realtime] Showing notification for admin message');
              
              toast({
                title: "📩 New Message from Admin",
                description: newMsg.content?.substring(0, 100) + ((newMsg.content?.length || 0) > 100 ? '...' : ''),
                duration: 8000,
              });
              
              // Show browser push notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification('New Order Chat Message', {
                    body: newMsg.content?.substring(0, 100) || 'New message',
                    icon: '/icons/icon-192x192.png',
                    tag: `order-chat-${newMsg.id}`,
                  });
                  console.log('[OrderChat Realtime] Browser notification shown');
                } catch (e) {
                  console.error('[OrderChat] Browser notification error:', e);
                }
              } else {
                console.log('[OrderChat Realtime] Browser notification permission:', Notification.permission);
              }
            }
            
            // If we have a current thread and the message belongs to it, refresh
            if (currentThreadId && newMsg.thread_id === currentThreadId) {
              console.log('[OrderChat Realtime] Refreshing messages for current thread');
              fetchMessages(currentThreadId);
            } else {
              // Also refresh threads to update unread counts/last message time
              fetchThreads();
            }
          }
        })
        .subscribe((status) => {
          console.log('[OrderChat Realtime] Subscription status:', status);
        });
    };

    setupRealtimeSubscription();
    
    return () => { 
      active = false;
      if (channel) {
        console.log('[OrderChat Realtime] Cleaning up subscription');
        channel.unsubscribe();
      }
    };
  }, [orderId, fetchThreads, fetchMessages, getCurrentUser, currentThreadId, toast]);

  useEffect(() => { fetchThreads(); }, [orderId, fetchThreads]);

  return {
    threads,
    messages,
    loading,
    fetchThreads,
    fetchMessages: fetchMessagesWithTracking,
    createThread,
    sendMessage,
    lastError,
    sessionUserId
  };
};
