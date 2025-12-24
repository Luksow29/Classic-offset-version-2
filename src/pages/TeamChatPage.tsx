// src/pages/TeamChatPage.tsx
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import AddChatRoomModal from '@/components/chat/AddChatRoomModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Correctly import individual icons from lucide-react
// Correctly import individual icons from lucide-react
import { Send, MessageSquare, PlusCircle, ArrowLeft } from 'lucide-react';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

// --- INTERFACES ---
interface ChatRoom {
  id: string;
  topic: string;
  created_by: { id: string; name: string; role: string; };
  created_at: string;
  last_message: string;
  last_message_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  text: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_role: string;
}

interface GroupedMessages {
  [date: string]: ChatMessage[];
}

// --- COMPONENT ---
const TeamChatPage: React.FC = () => {
  const { user, userProfile } = useUser();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages>({});
  const [newMessage, setNewMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [groupedMessages]);

  // --- DATA FETCHING ---
  // Fetch chat rooms
  useEffect(() => {
    // Initial fetch
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (data) setRooms(data as ChatRoom[]);
      setLoadingRooms(false);
    };

    fetchRooms();

    // Subscribe to changes
    const roomChannel = supabase
      .channel('chat_rooms_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRooms((prev) => [payload.new as ChatRoom, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRooms((prev) => {
              const updated = payload.new as ChatRoom;
              const filtered = prev.filter(r => r.id !== updated.id);
              // Re-sort to put updated room at top
              return [updated, ...filtered].sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, []);

  // Fetch messages for the selected room
  useEffect(() => {
    if (!selectedRoomId) {
      setGroupedMessages({});
      return;
    }
    setLoadingMessages(true);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('team_chat_messages')
        .select('*')
        .eq('room_id', selectedRoomId)
        .order('created_at', { ascending: true });

      if (data) processMessages(data as ChatMessage[]);
      setLoadingMessages(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`room_${selectedRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages',
          filter: `room_id=eq.${selectedRoomId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setGroupedMessages((prev) => {
            const msgDate = dayjs(newMsg.created_at).format('YYYY-MM-DD');
            return {
              ...prev,
              [msgDate]: [...(prev[msgDate] || []), newMsg],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [selectedRoomId]);

  const processMessages = (msgs: ChatMessage[]) => {
    const grouped = msgs.reduce((acc: GroupedMessages, msg) => {
      const msgDate = dayjs(msg.created_at).format('YYYY-MM-DD');
      if (!acc[msgDate]) acc[msgDate] = [];
      acc[msgDate].push(msg);
      return acc;
    }, {});
    setGroupedMessages(grouped);
  };

  // --- HANDLERS ---
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedRoomId || !userProfile || !user) return;

    try {
      const msgText = newMessage.trim();
      setNewMessage(''); // Optimistic clear

      // 1. Add new message
      const { error: msgError } = await supabase.from('team_chat_messages').insert({
        room_id: selectedRoomId,
        text: msgText,
        user_id: user.id,
        user_name: userProfile.name,
        user_role: userProfile.role || 'Member',
      });

      if (msgError) throw msgError;

      // 2. Update the room's last message
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .update({
          last_message: msgText,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedRoomId);

      if (roomError) console.error('Error updating room:', roomError);

    } catch (error) {
      console.error('Error sending message: ', error);
      // Ideally show toast error here
    }
  };

  const formatDateSeparator = (dateStr: string) => dayjs(dateStr).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'dddd, D MMM',
    sameElse: 'dddd, D MMMM YYYY'
  });

  // --- RENDER ---
  // Note: Updated field names (topic, last_message, etc.) to match snake_case Supabase schema
  return (
    <>
      <AddChatRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="flex flex-col md:flex-row h-[75vh] md:h-[calc(100dvh-8rem)] bg-gray-50 dark:bg-zinc-900 border border-border rounded-2xl overflow-hidden">

        {/* Left Panel: Chat Rooms List */}
        <aside
          className={`w-full md:w-1/3 md:min-w-[300px] md:max-w-[400px] flex-col md:border-r border-border bg-white dark:bg-zinc-800 ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}
        >
          <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold">Chat Rooms</h2>
            <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700" title="Start new chat">
              <PlusCircle className="w-6 h-6 text-primary" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? <p className="p-4 text-center">Loading rooms...</p> : rooms.map(room => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-3 sm:p-4 border-b border-border cursor-pointer ${selectedRoomId === room.id ? 'bg-primary-50 dark:bg-primary-900/50' : 'hover:bg-gray-100 dark:hover:bg-zinc-700/50'}`}
              >
                <h3 className="font-semibold text-gray-800 dark:text-white truncate">{room.topic}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{room.last_message}</p>
                <p className="text-xs text-gray-400 mt-1">{dayjs(room.last_message_at).fromNow()}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel: Messages Area */}
        <main className={`flex-1 flex flex-col ${selectedRoomId ? 'flex' : 'hidden md:flex'}`}>
          {!selectedRoomId ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-zinc-600" />
              <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Select a room to start chatting</h2>
              <p className="text-gray-500">Choose from the list on the left or create a new chat room.</p>
            </div>
          ) : (
            <>
              {/* Mobile Chat Header */}
              <div className="md:hidden flex items-center gap-2 p-3 bg-white dark:bg-zinc-800 border-b border-border">
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700"
                  aria-label="Back to rooms"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {rooms.find(room => room.id === selectedRoomId)?.topic || 'Chat'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {dayjs().format('ddd, D MMM')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700"
                  aria-label="Create room"
                >
                  <PlusCircle className="w-5 h-5 text-primary" />
                </button>
              </div>

              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {loadingMessages ? <p className="text-center">Loading messages...</p> : Object.keys(groupedMessages).sort().map(date => (
                  <div key={date}>
                    <div className="relative my-5 text-center">
                      <hr className="absolute top-1/2 left-0 w-full border-t border-gray-200 dark:border-gray-700" />
                      <span className="relative inline-block px-3 bg-gray-50 dark:bg-zinc-900 text-sm font-medium text-gray-500 rounded-full">{formatDateSeparator(date)}</span>
                    </div>
                    <div className="space-y-4">
                      {groupedMessages[date].map(msg => {
                        const isCurrentUser = msg.user_id === user?.id; // Note: user_id (snake_case)
                        return (
                          <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] sm:max-w-md lg:max-w-lg p-3 rounded-2xl ${isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-card text-card-foreground rounded-bl-lg'}`}>
                              {!isCurrentUser && (
                                <p
                                  className={`text-xs font-bold mb-1 ${String(msg.user_role || '')
                                    .toLowerCase()
                                    .trim() === 'owner'
                                    ? 'text-red-400'
                                    : String(msg.user_role || '')
                                      .toLowerCase()
                                      .trim() === 'manager'
                                      ? 'text-blue-400'
                                      : 'text-green-400'
                                    }`}
                                >
                                  {msg.user_name} ({msg.user_role})
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              <p className="text-xs opacity-70 mt-1 text-right">{dayjs(msg.created_at).format('h:mm A')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <footer className="p-3 sm:p-4 bg-background border-t border-border">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <Input
                    id="message-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 ml-1">Press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border rounded-md">Enter</kbd> to send.</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default TeamChatPage;
