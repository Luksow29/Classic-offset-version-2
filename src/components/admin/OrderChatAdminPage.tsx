import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';
import { uploadAdminChatFile, validateFileForUpload, formatFileSize } from '@/lib/adminFileUpload';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  CheckCircle,
  User,
  AlertCircle,
  Loader2,
  X,
  Package,
  Paperclip,
  Upload,
  File,
  Image as ImageIcon
} from 'lucide-react';
// Timeline imports removed - only showing chat UI
// import { OrderTimeline } from '@/shared/order-timeline';
// import { useOrderTimeline } from '@/hooks/useOrderTimeline';

// Simple Badge component
const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {children}
  </span>
);

interface OrderChatThread {
  id: string;
  order_id: number;
  customer_id: string;
  subject: string;
  status: 'active' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  // Extended fields from joins/calculations
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_type?: string;
  total_amount?: number;
  unread_count?: number;
  last_message?: string;
}

interface OrderChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin' | 'system';
  message_type: 'text' | 'file' | 'image' | 'system';
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Order {
  id: number;
  order_type: string;
  total_amount: number;
  created_at: string;
  status?: string;
}

const OrderChatAdminPage: React.FC = () => {
  const { user } = useUser();
  const [threads, setThreads] = useState<OrderChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<OrderChatThread | null>(null);
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timeline hook removed - only showing chat UI
  /*
  const {
    events: timelineEvents,
    isLoading: timelineLoading,
    error: timelineError,
    refresh: refreshTimeline,
  } = useOrderTimeline(selectedThread?.order_id ?? null, {
    enabled: Boolean(selectedThread?.order_id),
  });
  */

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchThreads();

    // Subscribe to all thread changes for admin
    const adminThreadsChannel = supabase
      .channel('admin_all_order_threads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_chat_threads',
        },
        (payload) => {
          console.log('Admin: Order thread updated:', payload);
          fetchThreads();
        }
      )
      .subscribe((status) => {
        console.log('Admin: Order threads subscription status:', status);
      });

    return () => {
      supabase.removeChannel(adminThreadsChannel);
    };
  }, [statusFilter]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      fetchCustomerDetails(selectedThread.customer_id);
      fetchOrderDetails(selectedThread.order_id);
      markMessagesAsRead(selectedThread.id);
    }
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread) return;

    // Subscribe to new messages for the selected thread
    const channel = supabase
      .channel(`admin_order_messages_${selectedThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
          filter: `thread_id=eq.${selectedThread.id}`
        },
        (payload) => {
          console.log('Admin: New order message received:', payload);
          const newMessage = payload.new as OrderChatMessage;
          setMessages(prev => (prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, newMessage]));

          // Mark as read if it's from customer
          if (newMessage.sender_type === 'customer') {
            console.log('Admin: Marking customer order message as read');
            markMessagesAsRead(selectedThread.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Admin: Order messages subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread]);

  const fetchThreads = async () => {
    try {
      console.log('Admin: Loading order chat threads with filter:', statusFilter);

      // First, get threads without complex joins
      let threadsQuery = supabase
        .from('order_chat_threads')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        threadsQuery = threadsQuery.eq('status', statusFilter);
      }

      const { data: threadsData, error: threadsError } = await threadsQuery;

      if (threadsError) {
        console.error('Admin: Supabase threads error:', threadsError);
        throw threadsError;
      }

      console.log('Admin: Raw threads data:', threadsData);

      if (!threadsData || threadsData.length === 0) {
        console.log('Admin: No threads found');
        setThreads([]);
        return;
      }

      // Then fetch additional data for each thread
      const transformedThreads: OrderChatThread[] = [];

      for (const thread of threadsData) {
        let customerName = 'Unknown Customer';
        let customerPhone = '';
        let customerEmail = '';
        let orderType = 'Unknown';
        let totalAmount = 0;

        // Try to get customer info from customers table using user_id
        try {
          const { data: customerData } = await supabase
            .from('customers')
            .select('name, phone, email')
            .eq('user_id', thread.customer_id)
            .single();

          if (customerData) {
            customerName = customerData.name || 'Unknown Customer';
            customerPhone = customerData.phone || '';
            customerEmail = customerData.email || '';
          }
        } catch (err) {
          console.log('Admin: Could not fetch customer info for:', thread.customer_id);
        }

        // Try to get order info
        try {
          const { data: orderData } = await supabase
            .from('orders')
            .select('id, order_type, total_amount')
            .eq('id', thread.order_id)
            .single();

          if (orderData) {
            orderType = orderData.order_type || 'Unknown';
            totalAmount = orderData.total_amount || 0;
          }
        } catch (err) {
          console.log('Admin: Could not fetch order info for:', thread.order_id);
        }

        transformedThreads.push({
          ...thread,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          order_type: orderType,
          total_amount: totalAmount
        });
      }

      console.log('Admin: Transformed threads:', transformedThreads);
      setThreads(transformedThreads);
    } catch (error) {
      console.error('Error fetching order chat threads:', error);
      toast.error('Failed to load order chat threads');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      console.log('Admin: Loading messages for order thread:', threadId);

      const { data, error } = await supabase
        .from('order_chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Admin: Error loading order messages:', error);
        throw error;
      }

      console.log('Admin: Loaded order messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching order messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      console.log('Admin: Fetching customer details for auth user ID:', customerId);

      // Since customerId references auth.users, we need to get customer via user_id
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('user_id', customerId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching customer:', error);
      }

      if (data) {
        console.log('Admin: Found customer data:', data);
        setCustomer(data);
      } else {
        console.log('Admin: No customer found in customers table, using fallback');
        // Fallback: try to get email from auth.users if possible
        try {
          const { data: authData } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', customerId)
            .single();

          setCustomer({
            id: customerId,
            name: 'Customer',
            phone: '',
            email: authData?.email || ''
          });
        } catch (authError) {
          console.log('Admin: Could not fetch auth user either, using basic fallback');
          setCustomer({ id: customerId, name: 'Customer', phone: '', email: '' });
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      setCustomer({ id: customerId, name: 'Customer', phone: '', email: '' });
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_type, total_amount, created_at')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const markMessagesAsRead = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('order_chat_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .eq('sender_type', 'customer')
        .eq('is_read', false);

      if (error) {
        console.error('Error marking order messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedThread) return;

    const validation = validateFileForUpload(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setUploadingFile(true);
    try {
      console.log('Admin: Uploading file:', file.name);
      const uploadResult = await uploadAdminChatFile(file, selectedThread.id);

      // Determine message type based on file type
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';

      if (!user?.id) {
        toast.error('You must be signed in to send files.');
        return;
      }
      const currentUserId = user.id;

      const messageData = {
        thread_id: selectedThread.id,
        sender_id: currentUserId,
        sender_type: 'admin',
        message_type: messageType,
        content: `📎 ${uploadResult.fileName}`,
        file_url: uploadResult.url,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        file_type: uploadResult.fileType
      };

      console.log('Admin: Inserting file message with data:', messageData);

      const { data, error } = await supabase
        .from('order_chat_messages')
        .insert(messageData)
        .select();

      if (error) {
        console.error('Admin: File message insert error:', error);
        throw error;
      }

      console.log('Admin: File message sent successfully:', data);

      // Update thread's last_message_at
      await supabase
        .from('order_chat_threads')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedThread.id);

      toast.success('File uploaded and sent!');
      await fetchMessages(selectedThread.id);

    } catch (error) {
      console.error('Admin: Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) {
      console.log('Admin: Cannot send - missing message or thread');
      console.log('Admin: newMessage:', newMessage);
      console.log('Admin: selectedThread:', selectedThread);
      return;
    }

    console.log('Admin: Sending order message:', newMessage.trim());
    console.log('Admin: Selected thread ID:', selectedThread.id);
    console.log('Admin: Thread status:', selectedThread.status);
    setSending(true);

    try {
      if (!user?.id) {
        toast.error('You must be signed in to send messages.');
        return;
      }
      const currentUserId = user.id;

      const messageData = {
        thread_id: selectedThread.id,
        sender_id: currentUserId,
        sender_type: 'admin',
        message_type: 'text',
        content: newMessage.trim()
      };

      console.log('Admin: Inserting order message with data:', messageData);
      console.log('Admin: About to call supabase.from("order_chat_messages").insert()');

      const { data, error } = await supabase
        .from('order_chat_messages')
        .insert(messageData)
        .select();

      console.log('Admin: Supabase response - data:', data);
      console.log('Admin: Supabase response - error:', error);

      if (error) {
        console.error('Admin: Supabase insert error details:', error);
        console.error('Admin: Error code:', error.code);
        console.error('Admin: Error message:', error.message);
        console.error('Admin: Error details:', error.details);
        throw error;
      }

      console.log('Admin: Order message sent successfully:', data);

      // Update thread's last_message_at
      console.log('Admin: Updating thread last_message_at for thread ID:', selectedThread.id);
      const { error: updateError } = await supabase
        .from('order_chat_threads')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedThread.id);

      if (updateError) {
        console.error('Admin: Thread update error:', updateError);
      } else {
        console.log('Admin: Thread updated successfully');
      }

      setNewMessage('');
      console.log('Admin: Message cleared, showing success toast');
      toast.success('Message sent!');

      // Refresh messages to show the new message
      console.log('Admin: Refreshing messages...');
      await fetchMessages(selectedThread.id);
    } catch (error) {
      console.error('Admin: Error sending order message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateThreadStatus = async (threadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('order_chat_threads')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId);

      if (error) throw error;

      toast.success('Thread status updated');
      fetchThreads();

      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Error updating thread status:', error);
      toast.error('Failed to update thread status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'Active' },
      resolved: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', label: 'Resolved' },
      closed: { color: 'bg-muted text-muted-foreground border-border', label: 'Closed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-muted text-muted-foreground border-border', label: 'Low' },
      normal: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', label: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'High' },
      urgent: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Urgent' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 md:p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <Package className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-semibold">Order Chat Admin</h1>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 md:px-3 py-1 bg-primary-foreground/10 text-primary-foreground rounded-md text-xs md:text-sm border-primary-foreground/20 focus:ring-primary-foreground/30"
            >
              <option value="all">All Chats</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Chat List */}
        <div className={`${selectedThread ? 'hidden md:flex' : 'flex'} md:w-1/3 w-full bg-card border-r border-border flex-col`}>
          <div className="p-3 bg-muted/30 border-b border-border">
            <h3 className="font-medium text-foreground">Order Chats ({threads.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No order chats</p>
                <p className="text-sm">Customer order discussions will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedThread?.id === thread.id ? 'bg-primary/5 border-r-4 border-primary' : ''
                      }`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                        {thread.customer_name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {thread.customer_name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              #{thread.order_id}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 truncate mb-1">{thread.subject}</p>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {thread.order_type} • ₹{thread.total_amount}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {getStatusBadge(thread.status)}
                            {thread.priority !== 'normal' && getPriorityBadge(thread.priority)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(thread.last_message_at).split(',')[1]?.trim() || ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className={`${selectedThread ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-background`}>
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="bg-card border-b border-border px-3 md:px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden p-1"
                      onClick={() => setSelectedThread(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm md:text-base">
                      {selectedThread.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-foreground text-sm md:text-base truncate">
                        {selectedThread.customer_name}
                      </h2>
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                        <span className="truncate">Order #{selectedThread.order_id}</span>
                        <span>•</span>
                        <span className="truncate">{selectedThread.subject}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 md:gap-2">
                    {customer && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10 p-1 md:p-2"
                          onClick={() => window.open(`tel:${customer.phone}`, '_self')}
                        >
                          <Phone className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10 p-1 md:p-2 hidden md:inline-flex"
                          onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                        >
                          <Mail className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </>
                    )}

                    <select
                      value={selectedThread.status}
                      onChange={(e) => updateThreadStatus(selectedThread.id, e.target.value)}
                      className="text-xs md:text-sm border border-input rounded-md px-1 md:px-2 py-1 bg-background text-foreground"
                      disabled={selectedThread.status === 'closed'}
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* OrderTimeline hidden - only showing chat UI
              <OrderTimeline
                events={timelineEvents}
                isLoading={timelineLoading}
                error={timelineError}
                onRetry={refreshTimeline}
                title="Order activity"
                emptyMessage="No updates recorded for this order yet."
                className="rounded-none border-0 border-b border-gray-200 dark:border-gray-700 shadow-none bg-white dark:bg-gray-800"
              />
              */}

              {/* Messages Area */}
              <div className="flex-1 flex flex-col min-h-0 bg-secondary/20">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.sender_type === 'admin' ? '' : 'flex items-end gap-2'
                          }`}>
                          {message.sender_type === 'customer' && (
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-semibold mb-1">
                              {customer?.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg shadow-sm ${message.sender_type === 'admin'
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-card text-card-foreground rounded-bl-sm border border-border'
                              }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {message.file_url && (
                              <div className="mt-2 p-2 rounded bg-black/10 dark:bg-white/10">
                                <a
                                  href={message.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline flex items-center gap-1 hover:opacity-80"
                                >
                                  <div className="flex items-center gap-1">
                                    {message.message_type === 'image' ? (
                                      <ImageIcon className="h-3 w-3" />
                                    ) : (
                                      <File className="h-3 w-3" />
                                    )}
                                    <span>{message.file_name || 'Attachment'}</span>
                                    {message.file_size && (
                                      <span className="text-xs opacity-70">
                                        ({formatFileSize(message.file_size)})
                                      </span>
                                    )}
                                  </div>
                                </a>
                                {message.message_type === 'image' && message.file_url && (
                                  <img
                                    src={message.file_url}
                                    alt={message.file_name || 'Image'}
                                    className="mt-2 max-w-full h-auto rounded border max-h-48 object-contain"
                                  />
                                )}
                              </div>
                            )}
                            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${message.sender_type === 'admin' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}>
                              <span>
                                {new Date(message.created_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              {message.sender_type === 'admin' && (
                                <div className="flex">
                                  {message.is_read ? (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground/90" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 opacity-70" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                {selectedThread.status !== 'closed' ? (
                  <div className="bg-card border-t border-border p-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          disabled={sending || uploadingFile}
                          className="pr-12 py-3 rounded-full border-input focus:border-primary focus:ring-primary bg-background text-foreground"
                        />
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || sending}
                        className="h-12 w-12 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground p-0 flex items-center justify-center"
                        type="button"
                      >
                        {uploadingFile ? (
                          <Upload className="h-5 w-5 animate-spin" />
                        ) : (
                          <Paperclip className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim() || uploadingFile}
                        className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground p-0 flex items-center justify-center"
                      >
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                    />
                  </div>
                ) : (
                  <div className="bg-muted border-t border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">This order chat has been closed</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center text-muted-foreground">
                <div className="h-32 w-32 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-16 w-16 opacity-50" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Order Chat Admin
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Select an order conversation from the sidebar to start chatting with customers about their orders.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderChatAdminPage;
