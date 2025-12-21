import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useToast } from "@/shared/hooks/useToast";
import { supabase } from "@/services/supabase/client";
import type { Database } from "@/services/supabase/types";
import { 
  MessageCircle, 
  Phone, 
  Mail,
  Send,
  Clock,
  CheckCircle,
  CheckCircle2,
  X,
  Loader2,
  Plus
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CustomerSupportProps {
  customer: Customer;
}

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'] & {
  total_messages?: number;
  last_message?: string;
  unread_customer_count: number;
};

type SupportMessage = Database['public']['Tables']['support_messages']['Row'];

export default function CustomerSupport({ customer }: CustomerSupportProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Live Chat State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New ticket creation state
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('create_support_ticket', {
        p_customer_id: customer.id,
        p_subject: subject,
        p_description: message,
        p_initial_message: message
      });

      if (error) throw error;

      toast({
        title: "Support Request Submitted",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setSubject("");
      setMessage("");
      setPriority("medium");
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit support request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load customer's support tickets
  const loadTickets = async () => {
    try {
      setLoading(true);
      console.log('Loading tickets for customer:', customer.id);
      
      const { data, error } = await supabase
        .from('support_tickets_summary')
        .select('*')
        .eq('customer_id', customer.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Loaded tickets:', data);
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load support tickets.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected ticket
  const loadMessages = async (ticketId: string) => {
    try {
      console.log('Customer: Loading messages for ticket:', ticketId);
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Customer: Error loading messages:', error);
        throw error;
      }
      
      console.log('Customer: Loaded messages:', data);
      setMessages(data || []);

      // Mark messages as read
      console.log('Customer: Marking messages as read');
      const { error: markError } = await supabase.rpc('mark_messages_as_read', {
        p_ticket_id: ticketId,
        p_reader_type: 'customer'
      });
      
      if (markError) {
        console.error('Customer: Error marking messages as read:', markError);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages.",
      });
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) {
      console.log('Customer: Cannot send - missing ticket or message');
      return;
    }

    console.log('Customer: Sending message:', newMessage.trim());
    console.log('Customer: Selected ticket:', selectedTicket.id);
    console.log('Customer: Customer ID:', customer.id);

    try {
      setSendingMessage(true);
      
      const messageData = {
        ticket_id: selectedTicket.id,
        sender_type: 'customer' as const,
        sender_id: customer.id,
        message: newMessage.trim(),
      };
      
      console.log('Customer: Inserting message with data:', messageData);

      const { data, error } = await supabase
        .from('support_messages')
        .insert(messageData)
        .select();

      if (error) {
        console.error('Customer: Supabase insert error:', error);
        throw error;
      }

      console.log('Customer: Message sent successfully:', data);
      setNewMessage("");
      // Messages will be updated via real-time subscription
    } catch (error) {
      console.error('Customer: Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Create new ticket from chat interface
  const createNewTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

    try {
      setCreatingTicket(true);
      const { data, error } = await supabase.rpc('create_support_ticket', {
        p_customer_id: customer.id,
        p_subject: newTicketSubject.trim(),
        p_description: newTicketMessage.trim(),
        p_initial_message: newTicketMessage.trim()
      });

      if (error) throw error;

      toast({
        title: "Ticket Created",
        description: "Your support ticket has been created successfully.",
      });

      setNewTicketSubject("");
      setNewTicketMessage("");
      setShowNewTicketForm(false);
      
      // Reload tickets
      await loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create support ticket.",
      });
    } finally {
      setCreatingTicket(false);
    }
  };

  // Use ref to track tickets for notifications without causing re-renders
  const ticketsRef = useRef<SupportTicket[]>([]);
  
  // Keep ref in sync with tickets state
  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  // Real-time subscriptions - only depend on customer.id
  useEffect(() => {
    loadTickets();

    // Subscribe to ticket updates
    const ticketsChannel = supabase
      .channel(`customer_tickets_${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `customer_id=eq.${customer.id}`,
        },
        (payload) => {
          console.log('Customer: Ticket updated:', payload);
          loadTickets();
        }
      )
      .subscribe((status) => {
        console.log('Customer: Tickets subscription status:', status);
      });

    // Global subscription for ALL support messages (for notifications)
    const globalMessagesChannel = supabase
      .channel(`customer_all_messages_${customer.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        async (payload) => {
          console.log('Customer: Global message received:', payload);
          const newMsg = payload.new as SupportMessage;
          
          // Check if this message belongs to one of the customer's tickets (using ref)
          const isMyTicket = ticketsRef.current.some(t => t.id === newMsg.ticket_id);
          
          // Show notification for admin messages on customer's tickets
          if (newMsg.sender_type === 'admin' && isMyTicket) {
            console.log('Customer: Showing notification for admin message');
            
            // Show toast notification
            toast({
              title: "📩 New Support Message",
              description: newMsg.message.substring(0, 100) + (newMsg.message.length > 100 ? '...' : ''),
              duration: 8000,
            });
            
            // Show browser push notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('New Support Message', {
                  body: newMsg.message.substring(0, 100),
                  icon: '/icons/icon-192x192.png',
                  tag: `support-global-${newMsg.id}`,
                });
              } catch (e) {
                console.error('[CustomerSupport] Browser notification error:', e);
              }
            }
            
            // Refresh tickets to update unread count
            loadTickets();
          }
        }
      )
      .subscribe((status) => {
        console.log('Customer: Global messages subscription status:', status);
      });

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(globalMessagesChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  useEffect(() => {
    if (!selectedTicket) return;

    loadMessages(selectedTicket.id);

    // Subscribe to new messages for selected ticket
    const messagesChannel = supabase
      .channel(`customer_messages_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          console.log('Customer: New message received:', payload);
          const newMessage = payload.new as SupportMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if it's from admin and show notifications
          if (newMessage.sender_type === 'admin') {
            console.log('Customer: Marking admin message as read');
            supabase.rpc('mark_messages_as_read', {
              p_ticket_id: selectedTicket.id,
              p_reader_type: 'customer'
            });
            
            // Show toast notification
            toast({
              title: "New Support Message",
              description: newMessage.message.substring(0, 100) + (newMessage.message.length > 100 ? '...' : ''),
              duration: 5000,
            });
            
            // Show browser push notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('New Support Message', {
                  body: newMessage.message.substring(0, 100),
                  icon: '/icons/icon-192x192.png',
                  tag: `support-${newMessage.id}`,
                });
              } catch (e) {
                console.error('[CustomerSupport] Browser notification error:', e);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Customer: Messages subscription status:', status);
      });

    return () => {
      supabase.removeChannel(messagesChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?.id, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'waiting_customer': return 'outline';
      case 'resolved': return 'secondary';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };



  return (
    <div className="space-y-6">
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="form">Support Form</TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Methods */}
            <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>{t('support.call')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary mb-2">
                <a href="tel:+919842578847" className="underline">+91 98425 78847</a>
              </p>
              <p className="text-sm text-muted-foreground">{t('support.phone_hours')}</p>
            </CardContent>
            </Card>

            <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>{t('support.email')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-primary mb-2">
                <a href="mailto:classicprinterskdnl@gmail.com" className="underline">classicprinterskdnl@gmail.com</a>
              </p>
              <p className="text-sm text-muted-foreground">{t('support.email_hours')}</p>
            </CardContent>
            </Card>

            <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>{t('support.whatsapp')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-primary mb-2">
                <a href="https://wa.me/919842578847" target="_blank" rel="noopener noreferrer" className="underline">+91 98425 78847</a>
              </p>
              <p className="text-sm text-muted-foreground">{t('support.whatsapp_quick')}</p>
            </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>{t('support.faq_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">{t('support.faq1_q')}</h4>
                <p className="text-sm text-muted-foreground">{t('support.faq1_a')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t('support.faq2_q')}</h4>
                <p className="text-sm text-muted-foreground">{t('support.faq2_a')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t('support.faq3_q')}</h4>
                <p className="text-sm text-muted-foreground">{t('support.faq3_a')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t('support.faq4_q')}</h4>
                <p className="text-sm text-muted-foreground">{t('support.faq4_a')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          {/* Support Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>{t('support.submit_title')}</CardTitle>
              <CardDescription>
                {t('support.submit_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitSupport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">{t('support.your_name')}</Label>
                    <Input
                      id="customer-name"
                      value={customer.name}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">{t('support.your_email')}</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customer.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('support.subject')}</Label>
                    <Input
                      id="subject"
                      placeholder={t('support.subject_placeholder')}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">{t('support.priority')}</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high' | 'urgent')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('support.priority_low')}</SelectItem>
                        <SelectItem value="medium">{t('support.priority_medium')}</SelectItem>
                        <SelectItem value="high">{t('support.priority_high')}</SelectItem>
                        <SelectItem value="urgent">{t('support.priority_urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('support.message')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('support.message_placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      {t('support.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t('support.submit_button')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            {/* Tickets List */}
            <Card className="shadow-elegant">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Support Tickets</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowNewTicketForm(true)}
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[480px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">No tickets yet</p>
                      <Button
                        size="sm"
                        onClick={() => setShowNewTicketForm(true)}
                        variant="outline"
                      >
                        Create First Ticket
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 p-3">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTicket?.id === ticket.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium truncate pr-2">
                              {ticket.subject}
                            </h4>
                            {ticket.unread_customer_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {ticket.unread_customer_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getStatusBadgeVariant(ticket.status)} className="text-xs">
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="text-xs">
                              {ticket.priority}
                            </Badge>
                          </div>
                          {ticket.last_message && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ticket.last_message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ticket.last_message_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              {!selectedTicket ? (
                <Card className="shadow-elegant h-full">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Select a Ticket</h3>
                      <p className="text-muted-foreground">
                        Choose a support ticket to start chatting
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-elegant h-full flex flex-col">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                            {selectedTicket.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {/* Messages */}
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.sender_type === 'customer'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs opacity-70">
                                  {new Date(message.created_at).toLocaleTimeString()}
                                </p>
                                {message.sender_type === 'customer' && (
                                  message.is_read ? (
                                    <CheckCircle2 className="h-3 w-3 opacity-70" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 opacity-70" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={sendingMessage}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* New Ticket Modal */}
          {showNewTicketForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Create New Ticket</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewTicketForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="new-ticket-subject">Subject</Label>
                    <Input
                      id="new-ticket-subject"
                      placeholder="Brief description of your issue"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-ticket-message">Description</Label>
                    <Textarea
                      id="new-ticket-message"
                      placeholder="Please describe your issue in detail"
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={createNewTicket}
                      disabled={!newTicketSubject.trim() || !newTicketMessage.trim() || creatingTicket}
                      className="flex-1 bg-gradient-primary hover:shadow-glow"
                    >
                      {creatingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Ticket'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTicketForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
