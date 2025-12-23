// src/components/communication/tabs/OrderChatTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { uploadAdminChatFile, validateFileForUpload } from '@/lib/adminFileUpload';
import toast from 'react-hot-toast';
import {
    Package, Send, Phone, Mail, Loader2, X, Paperclip
} from 'lucide-react';

// Simplified imports for internal components
const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
        {children}
    </span>
);

// ... Interfaces (OrderChatThread, OrderChatMessage) ...
interface OrderChatThread {
    id: string;
    order_id: number;
    customer_id: string;
    subject: string;
    status: 'active' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    last_message_at: string;
    // ... extra fields
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    order_type?: string;
    total_amount?: number;
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
    created_at: string;
}

const OrderChatTab: React.FC = () => {
    const { user } = useUser();
    const [threads, setThreads] = useState<OrderChatThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<OrderChatThread | null>(null);
    const [messages, setMessages] = useState<OrderChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [customer, setCustomer] = useState<any | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [uploadingFile, setUploadingFile] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchThreads();

        const adminThreadsChannel = supabase
            .channel('admin_all_order_threads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_chat_threads' }, () => fetchThreads())
            .subscribe();

        return () => { supabase.removeChannel(adminThreadsChannel); };
    }, [statusFilter]);

    useEffect(() => {
        if (selectedThread) {
            fetchMessages(selectedThread.id);
            fetchCustomerDetails(selectedThread.customer_id);
        }
    }, [selectedThread]);

    useEffect(() => {
        if (!selectedThread) return;

        const channel = supabase
            .channel(`admin_order_messages_${selectedThread.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'order_chat_messages', filter: `thread_id=eq.${selectedThread.id}` },
                (payload) => {
                    const newMessage = payload.new as OrderChatMessage;
                    setMessages(prev => (prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, newMessage]));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedThread]);

    const fetchThreads = async () => {
        try {
            let threadsQuery = supabase.from('order_chat_threads').select('*').order('last_message_at', { ascending: false });
            if (statusFilter !== 'all') threadsQuery = threadsQuery.eq('status', statusFilter);

            const { data: threadsData, error } = await threadsQuery;
            if (error) throw error;

            if (!threadsData) { setThreads([]); return; }

            // Manual join logic (simplified)
            const transformedThreads: OrderChatThread[] = [];
            for (const thread of threadsData) {
                // simplified fetches
                const { data: cData } = await supabase.from('customers').select('name, phone, email').eq('user_id', thread.customer_id).single();
                const { data: oData } = await supabase.from('orders').select('order_type, total_amount').eq('id', thread.order_id).single();

                transformedThreads.push({
                    ...thread,
                    customer_name: cData?.name || 'Unknown',
                    customer_phone: cData?.phone,
                    customer_email: cData?.email,
                    order_type: oData?.order_type,
                    total_amount: oData?.total_amount
                });
            }
            setThreads(transformedThreads);
        } catch (error) { toast.error('Failed to load threads'); } finally { setLoading(false); }
    };

    const fetchMessages = async (threadId: string) => {
        const { data } = await supabase.from('order_chat_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
        setMessages(data || []);
    };

    const fetchCustomerDetails = async (customerId: string) => {
        const { data } = await supabase.from('customers').select('*').eq('user_id', customerId).single();
        setCustomer(data);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedThread || !user?.id) return;
        setSending(true);
        try {
            // Send message logic
            const messageData = {
                thread_id: selectedThread.id,
                sender_id: user.id,
                sender_type: 'admin',
                message_type: 'text',
                content: newMessage.trim()
            };
            await supabase.from('order_chat_messages').insert(messageData);
            await supabase.from('order_chat_threads').update({ last_message_at: new Date().toISOString() }).eq('id', selectedThread.id);
            setNewMessage('');
            fetchMessages(selectedThread.id);
        } catch (err) { toast.error("Failed to send"); } finally { setSending(false); }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // Simplified file upload logic reusing existing imports
        const file = event.target.files?.[0];
        if (!file || !selectedThread || !user?.id) return;

        const validation = validateFileForUpload(file);
        if (!validation.valid) { toast.error(validation.error || 'Invalid file'); return; }

        setUploadingFile(true);
        try {
            const uploadResult = await uploadAdminChatFile(file, selectedThread.id);
            const messageData = {
                thread_id: selectedThread.id,
                sender_id: user.id,
                sender_type: 'admin',
                message_type: file.type.startsWith('image/') ? 'image' : 'file',
                content: `📎 ${uploadResult.fileName}`,
                file_url: uploadResult.url,
                file_name: uploadResult.fileName
            };
            await supabase.from('order_chat_messages').insert(messageData);
            await supabase.from('order_chat_threads').update({ last_message_at: new Date().toISOString() }).eq('id', selectedThread.id);
            fetchMessages(selectedThread.id);
        } catch (e) { toast.error("Upload failed"); } finally { setUploadingFile(false); }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>;

    return (
        // Changed h-screen to h-full
        <div className="h-full bg-background flex flex-col">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-3 shadow-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <h1 className="text-lg font-semibold">Order Chat Admin</h1>
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1 bg-primary-foreground/10 text-primary-foreground rounded text-xs">
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
                {/* List */}
                <div className={`${selectedThread ? 'hidden md:flex' : 'flex'} md:w-1/3 w-full border-r bg-card flex-col`}>
                    <div className="flex-1 overflow-y-auto">
                        {threads.map(thread => (
                            <div key={thread.id} onClick={() => setSelectedThread(thread)} className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${selectedThread?.id === thread.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                                <div className="flex justify-between">
                                    <span className="font-semibold truncate">{thread.customer_name}</span>
                                    <span className="text-xs text-muted-foreground">Order #{thread.order_id}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{thread.subject}</p>
                                <div className="flex justify-between mt-1 items-center">
                                    <Badge className={thread.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{thread.status}</Badge>
                                    <span className="text-xs text-muted-foreground">{formatDate(thread.last_message_at).split(',')[1]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <div className={`${selectedThread ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-background h-full min-h-0`}>
                    {selectedThread ? (
                        <>
                            <div className="border-b p-3 flex justify-between items-center bg-card flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedThread(null)}><X className="w-4 h-4" /></Button>
                                    <span className="font-semibold">{selectedThread.customer_name}</span>
                                </div>
                                {customer?.phone && <Button variant="ghost" size="sm" onClick={() => window.open(`tel:${customer.phone}`)}><Phone className="w-4 h-4" /></Button>}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/10">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                            {msg.file_url ? (
                                                msg.message_type === 'image' ? <img src={msg.file_url} alt="attachment" className="max-w-[200px] rounded" /> : <a href={msg.file_url} target="_blank" className="flex items-center gap-2 underline"><Paperclip className="w-4 h-4" /> {msg.file_name}</a>
                                            ) : <p className="text-sm">{msg.content}</p>}
                                            <span className="text-[10px] block text-right mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 border-t bg-card flex-shrink-0">
                                <div className="flex gap-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}><Paperclip className="w-5 h-5" /></Button>
                                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} className="flex-1 bg-transparent border rounded px-3" placeholder="Type a message..." />
                                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}><Send className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex justify-center items-center text-muted-foreground">Select a chat</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderChatTab;
