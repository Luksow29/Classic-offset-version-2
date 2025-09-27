// OrderChat component for customer-admin communication
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  X, 
  Clock,
  AlertCircle,
  CheckCheck,
  User,
  Headphones,
  Upload,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderChat } from '@/hooks/useOrderChat';
import type { ChatThread, ChatMessage } from '@/types/chat';
import { uploadChatFile, validateFileForUpload, getFileIcon, formatFileSize } from '@/lib/fileUpload';
import { testDatabaseConnection } from '@/lib/chatDebug';
import { formatDistanceToNow } from 'date-fns';

interface OrderChatProps {
  orderId?: number;
  orderNumber?: string;
  className?: string;
}

const OrderChat: React.FC<OrderChatProps> = ({ 
  orderId, 
  orderNumber, 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadPriority, setNewThreadPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [newThreadMessage, setNewThreadMessage] = useState('');
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    threads,
    messages,
    loading,
    fetchThreads,
    fetchMessages,
    createThread,
    sendMessage,
    lastError,
    sessionUserId
  } = useOrderChat(orderId || 0);

  const [debugOpen, setDebugOpen] = useState(false);
  const [debugRunning, setDebugRunning] = useState(false);
  const [debugSteps, setDebugSteps] = useState<any[] | null>(null);
  const [debugSummary, setDebugSummary] = useState<string | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when current thread changes
  useEffect(() => {
    if (currentThread) {
      fetchMessages(currentThread.id);
    }
  }, [currentThread, fetchMessages]);

  // Debug database connection
  const handleDebugTest = async () => {
    setDebugRunning(true);
    setDebugSteps(null);
    setDebugSummary(null);
    const result = await testDatabaseConnection();
    console.log('Debug test result:', result);
    setDebugSteps(result.steps || []);
    setDebugSummary(`${result.success ? '✅' : '❌'} ${result.message}`);
    setDebugRunning(false);
    setDebugOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentThread) return;

    const validation = validateFileForUpload(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingFile(true);
    try {
      const uploadResult = await uploadChatFile(file, currentThread.id);
      
      // Determine message type based on file type
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      
      // Send message with file attachment and metadata
      await sendMessage(currentThread.id, `📎 ${uploadResult.fileName}`, messageType, {
        file_url: uploadResult.url,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        file_type: uploadResult.fileType
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentThread || sending) return;

    setSending(true);
    await sendMessage(currentThread.id, newMessage.trim());
    setNewMessage('');
    setSending(false);
  };

  // Handle creating new thread
  const handleCreateThread = async () => {
    if (!orderId || !newThreadSubject.trim() || !newThreadMessage.trim() || sending) return;

    setSending(true);
    const thread = await createThread(newThreadSubject.trim(), newThreadPriority);

    if (thread) {
      setShowNewThreadDialog(false);
      setNewThreadSubject('');
      setNewThreadMessage('');
      setNewThreadPriority('normal');
      
      // Select the newly created thread and send initial message
      setCurrentThread(thread);
      await sendMessage(thread.id, newThreadMessage.trim());
    }
    setSending(false);
  };

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

  // Message component - WhatsApp style
  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isCustomer = message.sender_type === 'customer';
    const isAdmin = message.sender_type === 'admin';
    const isSystem = message.sender_type === 'system';

    if (isSystem) {
      return (
        <div className="flex justify-center my-4">
          <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`max-w-[70%] ${isCustomer ? '' : 'flex items-end gap-2'}`}>
          {/* Admin Avatar */}
          {isAdmin && (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 flex items-center justify-center text-white text-xs font-semibold mb-1">
              <Headphones size={14} />
            </div>
          )}
          <div
            className={`px-4 py-2 rounded-lg shadow-sm ${
              isCustomer
                ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
            {message.file_url && (
              <div className="mt-2 p-2 rounded bg-black/10">
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
                      <span className="text-gray-500">
                        ({formatFileSize(message.file_size)})
                      </span>
                    )}
                  </div>
                </a>
                {message.message_type === 'image' && message.file_url && (
                  <img 
                    src={message.file_url} 
                    alt={message.file_name || 'Image'} 
                    className="mt-2 max-w-full h-auto rounded border max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.file_url, '_blank')}
                  />
                )}
              </div>
            )}
            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
              isCustomer ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span>
                {new Date(message.created_at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
              {isCustomer && (
                <div className="flex">
                  {message.is_read ? (
                    <CheckCheck className="h-3 w-3 text-blue-200 dark:text-blue-300" />
                  ) : (
                    <Clock className="h-3 w-3 text-white opacity-70" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`${className} flex gap-2`}>
      {/* Debug button - remove in production */}
      <div className="flex flex-col gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDebugTest}
          className="text-xs"
        >
          {debugRunning ? 'Running Debug...' : 'Debug DB'}
        </Button>
        {(lastError || sessionUserId) && (
          <div className="text-[10px] leading-tight max-w-xs border rounded p-2 bg-gray-50 dark:bg-gray-900/40">
            <div>Session: {sessionUserId ? sessionUserId.slice(0,8) : 'none'}</div>
            {lastError && <div className="text-red-600 dark:text-red-400">LastError: {lastError}</div>}
            <button
              onClick={() => setDebugOpen(o => !o)}
              className="underline text-blue-600 text-[10px] mt-1"
            >{debugOpen ? 'Hide' : 'Show'} Debug Panel</button>
          </div>
        )}
      </div>
      
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageCircle size={16} />
            Chat About Order
            {threads.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {threads.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
  <DialogContent className="max-w-4xl h-[80vh] p-0">
          <div className="flex h-full min-h-[500px]">
            {/* Thread List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle className="flex items-center justify-between">
                  <span>Order Chats</span>
                  {orderId && (
                    <Button
                      size="sm"
                      onClick={() => setShowNewThreadDialog(true)}
                      className="text-xs"
                    >
                      New Chat
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading chats...
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {orderId ? (
                      <div>
                        <MessageCircle size={32} className="mx-auto mb-2 text-gray-400" />
                        <p>No chats for this order yet.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowNewThreadDialog(true)}
                          className="mt-2"
                        >
                          Start a chat
                        </Button>
                      </div>
                    ) : (
                      'No chat conversations found'
                    )}
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {threads.map((thread) => (
                      <Card
                        key={thread.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          currentThread?.id === thread.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                        }`}
                        onClick={() => setCurrentThread(thread)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">{thread.subject}</h4>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(thread.priority)} flex-shrink-0 ml-2`} />
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            Order #{thread.order_id}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={getStatusColor(thread.status)}>
                              {thread.status}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {currentThread ? (
                <>
                  {/* Chat Header - WhatsApp Style */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 flex items-center justify-center text-white font-semibold">
                          <Headphones size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{currentThread.subject}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Order #{currentThread.order_id} • Support Team
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(currentThread.priority)}`} />
                        <Badge variant="outline" className={getStatusColor(currentThread.status)}>
                          {currentThread.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Messages - WhatsApp Style */}
                  <div className="flex-1 overflow-hidden min-h-0 bg-gray-50 dark:bg-gray-900">
                    <ScrollArea className="h-full p-4 min-h-[300px]">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <MessageBubble key={message.id} message={message} />
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </ScrollArea>
                  </div>

                  {/* Message Input - WhatsApp Style */}
                  <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-end gap-3">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || sending}
                        size="sm"
                        variant="ghost"
                        className="rounded-full p-2 h-10 w-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {uploadingFile ? (
                          <Upload size={20} className="animate-spin" />
                        ) : (
                          <Paperclip size={20} />
                        )}
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          disabled={sending}
                          className="rounded-full bg-gray-100 dark:bg-gray-700 border-0 px-4 py-2 min-h-[2.5rem] focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                        className="rounded-full p-2 h-10 w-10 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        <Send size={20} />
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
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>Select a chat to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline Debug Panel */}
      {debugOpen && (
        <div className="fixed bottom-4 right-4 w-80 max-h-96 overflow-auto text-xs border bg-white dark:bg-gray-800 shadow-lg rounded p-3 z-50">
          <div className="flex justify-between items-center mb-2">
            <strong>Chat Debug Panel</strong>
            <button onClick={() => setDebugOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
          {debugSummary && <div className="mb-2 font-medium">{debugSummary}</div>}
          {debugSteps ? (
            <ul className="space-y-1">
              {debugSteps.map((s, idx) => (
                <li key={idx} className="flex gap-2">
                  <span>{s.status === 'ok' ? '✅' : s.status === 'fail' ? '❌' : '⏭️'}</span>
                  <span className="break-all">{s.step}: {s.detail || s.error}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div>Run debug to see steps...</div>
          )}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={handleDebugTest} disabled={debugRunning}>{debugRunning ? 'Re-running...' : 'Re-run Debug'}</Button>
          </div>
        </div>
      )}

      {/* New Thread Dialog */}
      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                placeholder="What's this chat about?"
                value={newThreadSubject}
                onChange={(e) => setNewThreadSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <Select value={newThreadPriority} onValueChange={(value: any) => setNewThreadPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <Textarea
                placeholder="Type your message..."
                value={newThreadMessage}
                onChange={(e) => setNewThreadMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewThreadDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateThread}
                disabled={!newThreadSubject.trim() || !newThreadMessage.trim() || sending}
              >
                {sending ? 'Creating...' : 'Start Chat'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderChat;
