// src/components/communication/tabs/TeamChatTab.tsx
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import AddChatRoomModal from '@/components/chat/AddChatRoomModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Icons
import Send from 'lucide-react/dist/esm/icons/send';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

// --- INTERFACES ---
interface ChatRoom {
    id: string;
    topic: string;
    createdBy: { id: string; name: string; role: string; };
    createdAt: any;
    lastMessage: string;
    lastMessageAt: any;
}

interface ChatMessage {
    id: string;
    roomId: string;
    text: string;
    createdAt: any;
    userId: string;
    userName: string;
    userRole: string;
}

interface GroupedMessages {
    [date: string]: ChatMessage[];
}

const TeamChatTab: React.FC = () => {
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

    useEffect(() => {
        const q = query(collection(db, 'chat_rooms'), orderBy('lastMessageAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const roomList: ChatRoom[] = [];
            querySnapshot.forEach((doc) => {
                roomList.push({ id: doc.id, ...doc.data() } as ChatRoom);
            });
            setRooms(roomList);
            setLoadingRooms(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedRoomId) {
            setGroupedMessages({});
            return;
        }
        setLoadingMessages(true);
        const q = query(
            collection(db, 'team_chat_messages'),
            where('roomId', '==', selectedRoomId),
            orderBy('createdAt')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            const grouped = msgs.reduce((acc: GroupedMessages, msg) => {
                const msgDate = dayjs(msg.createdAt?.toDate()).format('YYYY-MM-DD');
                if (!acc[msgDate]) acc[msgDate] = [];
                acc[msgDate].push(msg);
                return acc;
            }, {});
            setGroupedMessages(grouped);
            setLoadingMessages(false);
        });
        return () => unsubscribe();
    }, [selectedRoomId]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !selectedRoomId || !userProfile || !user) return;

        try {
            await addDoc(collection(db, 'team_chat_messages'), {
                roomId: selectedRoomId,
                text: newMessage.trim(),
                createdAt: serverTimestamp(),
                userId: user.id,
                userName: userProfile.name,
                userRole: userProfile.role || 'Member',
            });

            const roomRef = doc(db, 'chat_rooms', selectedRoomId);
            await updateDoc(roomRef, {
                lastMessage: newMessage.trim(),
                lastMessageAt: serverTimestamp(),
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message: ', error);
        }
    };

    const formatDateSeparator = (dateStr: string) => dayjs(dateStr).calendar(null, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        lastWeek: 'dddd, D MMM',
        sameElse: 'dddd, D MMMM YYYY'
    });

    return (
        <>
            <AddChatRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            {/* Changed height from fixed vh to h-full to fit parent container */}
            <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-zinc-900 border border-border overflow-hidden">

                {/* Left Panel: Chat Rooms List */}
                <aside
                    className={`w-full md:w-1/3 md:min-w-[300px] md:max-w-[400px] flex-col md:border-r border-border bg-white dark:bg-zinc-800 ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}
                >
                    <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center bg-white dark:bg-zinc-800 sticky top-0 z-10">
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
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-800 dark:text-white truncate max-w-[70%]">{room.topic}</h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{dayjs(room.lastMessageAt?.toDate()).fromNow()}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{room.lastMessage}</p>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Right Panel: Messages Area */}
                <main className={`flex-1 flex flex-col h-full overflow-hidden ${selectedRoomId ? 'flex' : 'hidden md:flex'}`}>
                    {!selectedRoomId ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-zinc-600" />
                            <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Select a room</h2>
                            <p className="text-gray-500">Choose from the list to start chatting.</p>
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
                            </div>

                            {/* Messages Display */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-muted/20">
                                {loadingMessages ? <p className="text-center">Loading messages...</p> : Object.keys(groupedMessages).sort().map(date => (
                                    <div key={date}>
                                        <div className="relative my-5 text-center">
                                            <hr className="absolute top-1/2 left-0 w-full border-t border-gray-200 dark:border-gray-700" />
                                            <span className="relative inline-block px-3 bg-gray-50 dark:bg-zinc-900 text-sm font-medium text-gray-500 rounded-full">{formatDateSeparator(date)}</span>
                                        </div>
                                        <div className="space-y-4">
                                            {groupedMessages[date].map(msg => {
                                                const isCurrentUser = msg.userId === user?.id;
                                                return (
                                                    <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] sm:max-w-md lg:max-w-lg p-3 rounded-2xl ${isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-card text-card-foreground rounded-bl-lg'}`}>
                                                            {!isCurrentUser && (
                                                                <p
                                                                    className={`text-xs font-bold mb-1 ${String(msg.userRole || '')
                                                                            .toLowerCase()
                                                                            .trim() === 'owner'
                                                                            ? 'text-red-400'
                                                                            : 'text-blue-400'
                                                                        }`}
                                                                >
                                                                    {msg.userName}
                                                                </p>
                                                            )}
                                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                                            <p className="text-xs opacity-70 mt-1 text-right">{dayjs(msg.createdAt?.toDate()).format('h:mm A')}</p>
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
                            </footer>
                        </>
                    )}
                </main>
            </div>
        </>
    );
};

export default TeamChatTab;
