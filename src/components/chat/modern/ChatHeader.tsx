import React from 'react';
import { Bot, Sparkles, MoreHorizontal, Moon, Sun, Monitor } from 'lucide-react';

interface ChatHeaderProps {
    isLoading: boolean;
    online?: boolean;
    onClearChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isLoading, online = true, onClearChat }) => {
    return (
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10 sticky top-0 transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
                            <Bot className="w-7 h-7 text-white" />
                        </div>
                        {online && (
                            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white dark:border-gray-900"></span>
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            Classic AI Agent
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                BETA
                            </span>
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 transition-all duration-300">
                                {isLoading ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                        </span>
                                        <span className="text-indigo-600 dark:text-indigo-400 animate-pulse">Processing request...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                        <span>Ready to assist</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onClearChat && (
                        <button
                            onClick={onClearChat}
                            className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                            title="Clear conversation"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>
                    )}
                    <button className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
