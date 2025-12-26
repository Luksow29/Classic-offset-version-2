import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Database } from '@/types/supabase';
import { useUser } from '@/context/UserContext';
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
  X
} from 'lucide-react';

// Simple Badge component
const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'] & {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  unread_admin_count: number;
  unread_customer_count: number;
  total_messages?: number;
  last_message?: string;
};

type SupportMessage = Database['public']['Tables']['support_messages']['Row'];

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const CustomerSupportPage: React.FC = () => {
  const { user } = useUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchTickets();

    // Subscribe to all ticket changes for admin
    const adminTicketsChannel = supabase
      .channel('admin_all_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          console.log('Admin: Ticket updated:', payload);
          fetchTickets();
        }
      )
      .subscribe((status) => {
        console.log('Admin: Tickets subscription status:', status);
      });

    return () => {
      supabase.removeChannel(adminTicketsChannel);
    };
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      fetchCustomerDetails(selectedTicket.customer_id);
      markMessagesAsRead(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (!selectedTicket) return;

    // Subscribe to new messages for the selected ticket
    const channel = supabase
      .channel(`admin_messages_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('Admin: New message received:', payload);
          const newMessage = payload.new as SupportMessage;
          setMessages(prev => (prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, newMessage]));

          // Mark as read if it's from customer
          if (newMessage.sender_type === 'customer') {
            console.log('Admin: Marking customer message as read');
            markMessagesAsRead(selectedTicket.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Admin: Messages subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      console.log('Admin: Loading tickets with filter:', statusFilter);

      let query = supabase
        .from('support_tickets_summary')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Admin: Supabase error:', error);
        throw error;
      }

      console.log('Admin: Loaded tickets:', data);
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      console.log('Admin: Loading messages for ticket:', ticketId);

      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Admin: Error loading messages:', error);
        throw error;
      }

      console.log('Admin: Loaded messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const markMessagesAsRead = async (ticketId: string) => {
    try {
      await supabase.rpc('mark_messages_as_read', {
        p_ticket_id: ticketId,
        p_reader_type: 'admin'
      });

      // Update local ticket state
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, unread_admin_count: 0 }
          : ticket
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) {
      console.log('Admin: Cannot send - missing message or ticket');
      return;
    }

    if (!user?.id) {
      toast.error('You must be signed in to send messages.');
      return;
    }

    console.log('Admin: Sending message:', newMessage.trim());
    setSending(true);

    try {
      const currentUserId = user.id;

      console.log('Admin: Inserting message with data:', {
        ticket_id: selectedTicket.id,
        sender_type: 'admin',
        sender_id: currentUserId,
        message: newMessage.trim()
      });

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_type: 'admin',
          sender_id: currentUserId,
          message: newMessage.trim()
        })
        .select();

      if (error) {
        console.error('Admin: Supabase insert error:', error);
        throw error;
      }

      console.log('Admin: Message sent successfully:', data);
      const insertedMessage = data?.[0] as SupportMessage | undefined;
      if (insertedMessage) {
        setMessages(prev => (prev.some(msg => msg.id === insertedMessage.id) ? prev : [...prev, insertedMessage]));
      }
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Admin: Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket status updated');
      fetchTickets();

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      waiting_customer: { color: 'bg-orange-100 text-orange-800', label: 'Waiting Customer' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
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
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* WhatsApp-style Header */}
      <div className="bg-green-600 dark:bg-green-700 text-white p-3 md:p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-semibold">Customer Support</h1>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 md:px-3 py-1 bg-green-700 dark:bg-green-800 text-white rounded-md text-xs md:text-sm border-green-500 dark:border-green-600"
            >
              <option value="all">All Chats</option>
              <option value="open">Open</option>
              <option value="in_progress">Active</option>
              <option value="waiting_customer">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* WhatsApp-style Chat List */}
        <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} md:w-1/3 w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col`}>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Chats ({tickets.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No active chats</p>
                <p className="text-sm">Customer messages will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-green-50 dark:bg-green-900/30 border-r-4 border-green-500 dark:border-green-400' : ''
                      }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    {/* Customer Avatar and Info */}
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 flex items-center justify-center text-white font-semibold text-lg">
                        {ticket.customer_name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {ticket.customer_name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {ticket.unread_admin_count > 0 && (
                              <div className="h-5 w-5 bg-green-500 dark:bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                                {ticket.unread_admin_count}
                              </div>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(ticket.last_message_at).split(',')[1]?.trim() || ''}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-1">{ticket.subject}</p>
                        {ticket.last_message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {ticket.last_message.length > 50
                              ? ticket.last_message.substring(0, 50) + '...'
                              : ticket.last_message
                            }
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`h-2 w-2 rounded-full ${ticket.status === 'open' ? 'bg-blue-400 dark:bg-blue-500' :
                              ticket.status === 'in_progress' ? 'bg-yellow-400 dark:bg-yellow-500' :
                                ticket.status === 'waiting_customer' ? 'bg-orange-400 dark:bg-orange-500' :
                                  ticket.status === 'resolved' ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-400 dark:bg-gray-500'
                            }`}></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {ticket.status.replace('_', ' ')}
                          </span>
                          {ticket.priority === 'urgent' && (
                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp-style Chat Interface */}
        <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-white dark:bg-gray-800`}>
          {selectedTicket ? (
            <>
              {/* WhatsApp-style Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden p-1"
                      onClick={() => setSelectedTicket(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                      {selectedTicket.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate">{selectedTicket.customer_name}</h2>
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate max-w-[120px] md:max-w-none">{selectedTicket.subject}</span>
                        <span className="hidden md:inline">•</span>
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${selectedTicket.status === 'open' ? 'bg-blue-400 dark:bg-blue-500' :
                            selectedTicket.status === 'in_progress' ? 'bg-green-400 dark:bg-green-500' :
                              selectedTicket.status === 'waiting_customer' ? 'bg-orange-400 dark:bg-orange-500' :
                                selectedTicket.status === 'resolved' ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-400 dark:bg-gray-500'
                          }`}></div>
                        <span className="capitalize text-xs">{selectedTicket.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 md:gap-2">
                    {customer && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 p-1 md:p-2"
                          onClick={() => window.open(`tel:${customer.phone}`, '_self')}
                        >
                          <Phone className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 p-1 md:p-2 hidden md:inline-flex"
                          onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                        >
                          <Mail className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </>
                    )}

                    {/* Status Update Dropdown */}
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                      className="text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-md px-1 md:px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={selectedTicket.status === 'closed'}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_customer">Waiting</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* WhatsApp-style Messages Area */}
              <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-800 chat-bg">
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
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center text-white text-xs font-semibold mb-1">
                              {customer?.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg shadow-sm ${message.sender_type === 'admin'
                                ? 'bg-green-500 dark:bg-green-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600'
                              }`}
                          >
                            <p className="text-sm leading-relaxed">{message.message}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${message.sender_type === 'admin' ? 'text-green-100 dark:text-green-200' : 'text-gray-500 dark:text-gray-400'
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
                                    <CheckCircle2 className="h-3 w-3 text-blue-200 dark:text-blue-300" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 text-white opacity-70" />
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

                {/* WhatsApp-style Message Input */}
                {selectedTicket.status !== 'closed' ? (
                  <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          disabled={sending}
                          className="pr-12 py-3 rounded-full border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 p-0 flex items-center justify-center"
                      >
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">This conversation has been closed</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <div className="h-32 w-32 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MessageCircle className="h-16 w-16 opacity-50" />
                </div>
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Welcome to Customer Support
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Select a conversation from the sidebar to start chatting with customers.
                  All your support tickets will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportPage;
