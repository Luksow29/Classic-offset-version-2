import React, { useState, useMemo } from 'react';
import { useLocalAgent } from '@/hooks/useLocalAgent';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInputArea, AttachmentFile } from './ChatInputArea';
import { ConversationEntry, DetectedEntity } from './MessageBubble';
import { ragService } from '@/lib/ragServices';
import { Database } from 'lucide-react';

interface LocalChatContainerProps {
    className?: string;
}

export const LocalChatContainer: React.FC<LocalChatContainerProps> = ({ className = '' }) => {
    const {
        messages,
        isLoading,
        isStreaming,
        error,
        isHealthy,
        sendMessage,
        streamMessage,
        sendBusinessQuery,
        clearMessages,
        checkHealth,
        currentModel
    } = useLocalAgent();

    const [prompt, setPrompt] = useState('');
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [isBusinessMode, setIsBusinessMode] = useState(false);
    const [businessContext, setBusinessContext] = useState<string | null>(null);

    // Map LocalAgent messages to ConversationEntry format
    const formattedMessages: ConversationEntry[] = useMemo(() => {
        return messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
    }, [messages]);

    const handleSend = async (manualMessage?: string) => {
        // If manualMessage is provided, use it. Otherwise use state prompt.
        const messageToSend = typeof manualMessage === 'string' ? manualMessage : prompt;

        if (!messageToSend.trim() && attachments.length === 0) return;

        if (typeof manualMessage !== 'string') {
            setPrompt('');
        }
        setAttachments([]); // Clear attachments after sending logic starts

        // Note: Attachments are not currently supported by useLocalAgent in this version

        const queryType = ragService.classifyQuery(messageToSend);

        if (queryType === 'business') {
            setIsBusinessMode(true);
            try {
                await streamMessage(messageToSend);
            } catch (err) {
                console.error("RAG Error", err);
                await streamMessage(messageToSend);
            }
        } else {
            setIsBusinessMode(false);
            setBusinessContext(null);
            await streamMessage(messageToSend);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newAttachments: AttachmentFile[] = Array.from(e.target.files).map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file)
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const activeContext = businessContext ? (
        <div className="flex items-center gap-2 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full w-fit mx-auto mb-2">
            <Database className="w-3 h-3" />
            <span>Business Context Active</span>
        </div>
    ) : null;

    // Dummy handlers for unsupported features in Local Agent
    const noOp = () => { };
    const dummyExtract = (text: string) => [];
    const dummySuggestions = (text: string) => [];

    return (
        <div className={`flex flex-col h-full bg-transparent ${className}`}>
            <ChatHeader
                isLoading={isLoading || isStreaming}
                online={isHealthy}
                onClearChat={clearMessages}
            />

            <div className="flex-1 overflow-hidden relative flex flex-col">
                <MessageList
                    history={formattedMessages}
                    isLoading={isLoading || isStreaming}
                    processingStage={isBusinessMode ? "Analyzing Business Data..." : ""}
                    toolSteps={[]}
                    thinkingSteps={[]}
                    isComplexQuery={isBusinessMode}
                    translated={{}}
                    onEntityClick={() => { }}
                    onQuickReply={(text) => handleSend(text)}
                    onCopy={(text) => navigator.clipboard.writeText(text)}
                    onShare={noOp}
                    onExport={noOp}
                    extractEntities={dummyExtract}
                    getContextualSuggestions={dummySuggestions}
                />
                {!isHealthy && (
                    <div className="absolute top-0 left-0 w-full p-2 bg-red-100/80 text-red-800 text-center text-sm backdrop-blur-sm z-10">
                        Connection Lost. Please check LM Studio.
                    </div>
                )}
            </div>

            <div className="p-4 pt-2">
                {activeContext}
                <ChatInputArea
                    prompt={prompt}
                    setPrompt={setPrompt}
                    isLoading={isLoading || isStreaming}
                    isListening={false}
                    attachments={attachments}
                    onSend={() => handleSend()}
                    onFileSelect={handleFileSelect}
                    onRemoveAttachment={(idx) => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    onVoiceToggle={noOp}
                />
                <div className="flex justify-between items-center px-2 mt-2">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        {isHealthy ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Connected to LM Studio
                                <span className="text-slate-500">({currentModel})</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Disconnected from LM Studio
                            </>
                        )}
                    </p>
                    {error && (
                        <p className="text-xs text-red-500 truncate max-w-[200px]" title={error}>
                            Error: {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
