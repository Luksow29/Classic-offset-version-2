import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  User, 
  Clock, 
  CheckCheck, 
  AlertCircle,
  Eye,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { supabase } from '@/services/supabase/client';
import type { ChatThread, ChatMessage } from '@/shared/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface AdminChatDashboardProps {
  className?: string;
}

interface ThreadWithDetails extends ChatThread {
  customer?: { id: string; email: string };
}

const AdminChatDashboard: React.FC<AdminChatDashboardProps> = ({ className = "" }) => {
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch all chat threads for admin view
  const fetchThreads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('order_chat_threads')
        .select(`*`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Apply filters with proper type casting
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (priorityFilter && priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const threadsData = data || [];
      const customerIds = [...new Set(threadsData.map(t => t.customer_id))];
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', customerIds);

      if (usersError) throw usersError;

      const usersById = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      let combinedData = threadsData.map(thread => ({
        ...thread,
        customer: usersById[thread.customer_id]
      }));

      let filteredThreads = combinedData as ThreadWithDetails[];
      
      // Apply search filter
      if (searchQuery) {
        filteredThreads = filteredThreads.filter(thread =>
          thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setThreads(filteredThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected thread
  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_chat_messages')
        .select(`
          *,
          sender:users!sender_id(id, username, email)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message as admin
  const sendAdminMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('order_chat_messages')
        .insert({
          thread_id: selectedThread.id,
          sender_id: session.user.id,
          sender_type: 'admin',
          message_type: 'text',
          content: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('order_chat_threads')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedThread.id);

      setNewMessage('');
      await fetchMessages(selectedThread.id);
      await fetchThreads(); // Refresh thread list
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Update thread status
  const updateThreadStatus = async (threadId: string, status: 'active' | 'resolved' | 'closed') => {
    try {
      const { error } = await supabase
        .from('order_chat_threads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', threadId);

      if (error) throw error;
      
      await fetchThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread({ ...selectedThread, status });
      }
    } catch (error) {
      console.error('Error updating thread status:', error);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'resolved': return 'text-blue-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  // Count unread messages per thread
  const getUnreadCount = (thread: ChatThread) => {
    // This would need to be calculated on the backend for efficiency
    // For now, we'll use a placeholder
    return Math.floor(Math.random() * 3); // Demo unread count
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Chat Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer chat threads and messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {threads.length} threads
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search threads, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {threads.map((thread) => {
                const unreadCount = getUnreadCount(thread);
                return (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedThread?.id === thread.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className={`${getPriorityColor(thread.priority)} text-white text-xs`}
                            >
                              {thread.priority.toUpperCase()}
                            </Badge>
                            <span className={`text-sm font-medium ${getStatusColor(thread.status)}`}>
                              {thread.status.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-1">
                            {thread.subject}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Order #{thread.order_id} • {thread.customer?.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {thread.last_message_at 
                              ? formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })
                              : formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })
                            }
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                          <MessageCircle size={16} className="text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {threads.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No chat threads found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">{selectedThread.subject}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Order #{selectedThread.order_id} • {selectedThread.customer?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedThread.status} 
                      onValueChange={(status: any) => updateThreadStatus(selectedThread.id, status)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isAdmin = message.sender_type === 'admin';
                    const isSystem = message.sender_type === 'system';

                    if (isSystem) {
                      return (
                        <div key={message.id} className="flex justify-center my-4">
                          <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm">
                            {message.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isAdmin
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <time>
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </time>
                            {isAdmin && (
                              <div className="flex items-center">
                                {message.is_read ? (
                                  <CheckCheck size={12} className="text-blue-500" />
                                ) : (
                                  <Clock size={12} className="text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAdminMessage();
                      }
                    }}
                    disabled={sending || selectedThread.status === 'closed'}
                  />
                  <Button
                    onClick={sendAdminMessage}
                    disabled={!newMessage.trim() || sending || selectedThread.status === 'closed'}
                    size="sm"
                  >
                    <MessageSquare size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Select a chat thread to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatDashboard;
