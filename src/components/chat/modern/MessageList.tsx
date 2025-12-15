import React, { useEffect, useRef } from 'react';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';
import { MessageBubble, ConversationEntry, DetectedEntity } from './MessageBubble';

interface MessageListProps {
    history: ConversationEntry[];
    isLoading: boolean;
    processingStage: string;
    toolSteps: string[];
    thinkingSteps: string[];
    isComplexQuery: boolean;
    translated: { [index: number]: string };
    onEntityClick: (entity: DetectedEntity) => void;
    onQuickReply: (text: string) => void;
    onCopy: (text: string) => void;
    onShare: (text: string) => void;
    onExport: (text: string) => void;
    extractEntities: (text: string) => DetectedEntity[];
    getContextualSuggestions: (text: string) => string[];
}

export const MessageList: React.FC<MessageListProps> = ({
    history,
    isLoading,
    processingStage,
    toolSteps,
    thinkingSteps,
    isComplexQuery,
    translated,
    onEntityClick,
    onQuickReply,
    onCopy,
    onShare,
    onExport,
    extractEntities,
    getContextualSuggestions
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading, thinkingSteps, toolSteps]);

    if (history.length === 0 && !isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-inner border border-white dark:border-gray-700 mb-6">
                    <MessageSquare className="w-10 h-10 text-indigo-400 dark:text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to your AI Agent</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    Ask questions about your business, customers, or products. I can also help you with creative tasks and analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
                {history.map((entry, index) => (
                    <MessageBubble
                        key={index}
                        message={entry}
                        isLast={index === history.length - 1} // Only pass true if it's strictly the last message
                        onEntityClick={onEntityClick}
                        onQuickReply={onQuickReply}
                        onCopy={onCopy}
                        onShare={onShare}
                        onExport={onExport}
                        extractEntities={extractEntities}
                        getContextualSuggestions={getContextualSuggestions}
                        translatedText={translated[index]}
                    />
                ))}

                {/* Loading / Thinking State */}
                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="max-w-[85%] md:max-w-[70%]">
                            <div className="flex items-center gap-3 mb-2 px-1">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Bot className={`w-4 h-4 text-white ${isComplexQuery ? 'animate-spin' : ''}`} />
                                </div>
                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    {isComplexQuery ? 'Deep Analysis...' : 'Thinking...'}
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                    </div>
                                </span>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/30 shadow-sm ml-11 space-y-3">
                                {/* Processing Stage */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                                    {processingStage || 'Processing your request...'}
                                </div>

                                {/* Thinking Steps */}
                                {thinkingSteps.length > 0 && (
                                    <div className="space-y-1.5 pl-6 border-l-2 border-indigo-100 dark:border-gray-700">
                                        {thinkingSteps.map((step, i) => (
                                            <div key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                                                <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tool Steps */}
                                {toolSteps.length > 0 && (
                                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5">
                                        {toolSteps.map((step, i) => (
                                            <div key={i} className="text-xs font-mono text-green-600 dark:text-green-400 flex items-center gap-2 bg-green-50 dark:bg-green-900/10 p-1.5 rounded-md w-fit">
                                                <span>Expected:</span> {step}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
