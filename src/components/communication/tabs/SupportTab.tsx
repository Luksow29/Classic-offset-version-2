// src/components/communication/tabs/SupportTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
    CheckCircle2,
    CheckCircle,
    Loader2,
    X
} from 'lucide-react';

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

const SupportTab: React.FC = () => {
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

        const adminTicketsChannel = supabase
            .channel('admin_all_tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_tickets' },
                () => fetchTickets()
            )
            .subscribe();

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

        const channel = supabase
            .channel(`admin_messages_${selectedTicket.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicket.id}` },
                (payload) => {
                    const newMessage = payload.new as SupportMessage;
                    setMessages(prev => (prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, newMessage]));

                    if (newMessage.sender_type === 'customer') {
                        markMessagesAsRead(selectedTicket.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedTicket]);

    const fetchTickets = async () => {
        try {
            let query = supabase.from('support_tickets_summary').select('*').order('last_message_at', { ascending: false });
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }
            const { data, error } = await query;
            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            toast.error('Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (ticketId: string) => {
        try {
            const { data, error } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            toast.error('Failed to load messages');
        }
    };

    const fetchCustomerDetails = async (customerId: string) => {
        try {
            const { data } = await supabase.from('customers').select('id, name, phone, email').eq('id', customerId).single();
            setCustomer(data);
        } catch (error) {
            console.error(error);
        }
    };

    const markMessagesAsRead = async (ticketId: string) => {
        try {
            await supabase.rpc('mark_messages_as_read', { p_ticket_id: ticketId, p_reader_type: 'admin' });
            setTickets(prev => prev.map(ticket => ticket.id === ticketId ? { ...ticket, unread_admin_count: 0 } : ticket));
        } catch (error) { console.error(error); }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedTicket || !user?.id) return;
        setSending(true);
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .insert({ ticket_id: selectedTicket.id, sender_type: 'admin', sender_id: user.id, message: newMessage.trim() })
                .select();

            if (error) throw error;
            const insertedMessage = data?.[0] as SupportMessage | undefined;
            if (insertedMessage) {
                setMessages(prev => [...prev, insertedMessage]);
            }
            setNewMessage('');
        } catch (error) {
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
            toast.error('Failed to update ticket status');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        // Changed h-screen to h-full
        <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-green-600 dark:bg-green-700 text-white p-3 shadow-md flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        <h1 className="text-lg font-semibold">Customer Support</h1>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2 py-1 bg-green-700 dark:bg-green-800 text-white rounded-md text-xs border-green-500"
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

            <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
                {/* Chat List */}
                <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} md:w-1/3 w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col`}>
                    <div className="flex-1 overflow-y-auto">
                        {tickets.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No active chats</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedTicket?.id === ticket.id ? 'bg-green-50 dark:bg-green-900/30 border-r-4 border-green-500' : ''
                                            }`}
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        {/* Customer Avatar and Info */}
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                                {ticket.customer_name?.charAt(0) || 'C'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{ticket.customer_name}</h4>
                                                    <span className="text-xs text-gray-500">{formatDate(ticket.last_message_at).split(',')[1]?.trim()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">{ticket.last_message}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`h-2 w-2 rounded-full ${ticket.status === 'open' ? 'bg-blue-400' : 'bg-gray-400'}`} />
                                                    <span className="text-xs capitalize">{ticket.status.replace('_', ' ')}</span>
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
                <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-white dark:bg-gray-800`}>
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className="md:hidden p-1" onClick={() => setSelectedTicket(null)}><X className="h-4 w-4" /></Button>
                                    <h2 className="font-semibold">{selectedTicket.customer_name}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {customer && customer.phone && <Button variant="ghost" size="sm" onClick={() => window.open(`tel:${customer.phone}`)}><Phone className="h-4 w-4" /></Button>}
                                    <select value={selectedTicket.status} onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)} className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-700">
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-800">
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.map((message) => (
                                        <div key={message.id} className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${message.sender_type === 'admin' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-700 border'}`}>
                                                <p className="text-sm">{message.message}</p>
                                                <span className={`text-[10px] block text-right mt-1 ${message.sender_type === 'admin' ? 'text-green-100' : 'text-gray-400'}`}>
                                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                {selectedTicket.status !== 'closed' && (
                                    <div className="bg-white dark:bg-gray-800 border-t p-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                                                className="flex-1"
                                            />
                                            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                                                {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Select a chat to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportTab;
