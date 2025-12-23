import React, { useState } from 'react';
import { Brain, Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistantTab: React.FC = () => {
    const [mode, setMode] = useState<'classic' | 'local'>('classic');
    const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([
        { id: '1', role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: inputValue, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: mode === 'classic'
                    ? "I am the Classic Assistant (Gemini/Perplexity). I can search the web and answer complex queries."
                    : "I am the Local AI Agent. I run privately on your machine and have access to your local data.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-background min-h-0">
            {/* Header */}
            <div className="bg-card border-b p-4 flex justify-between items-center shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${mode === 'classic' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {mode === 'classic' ? <Brain size={20} /> : <Sparkles size={20} />}
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            {mode === 'classic' ? 'Classic Assistant' : 'Local AI Agent'}
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                                {mode === 'classic' ? 'Web Connected' : 'Private & Secure'}
                            </span>
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {mode === 'classic' ? 'Powered by Gemini & Perplexity' : 'Running locally on your device'}
                        </p>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border">
                    <button
                        onClick={() => setMode('classic')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'classic'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Classic
                    </button>
                    <button
                        onClick={() => setMode('local')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'local'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Local Agent
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-secondary/5">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : mode === 'classic' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>

                            <div className={`p-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-card border shadow-sm rounded-tl-none'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] block mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    }`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${mode === 'classic' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Loader2 size={14} className="animate-spin" />
                            </div>
                            <div className="bg-card border shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t flex-shrink-0">
                <div className="relative">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder={`Message ${mode === 'classic' ? 'Classic Assistant' : 'Local Agent'}...`}
                        className="pr-12 py-6 shadow-sm"
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Button
                            size="sm"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isLoading}
                            className="h-8 w-8 p-0 rounded-full"
                        >
                            <Send size={14} />
                        </Button>
                    </div>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                    AI can make mistakes. Please verify important information.
                </p>
            </div>
        </div>
    );
};

export default AIAssistantTab;
