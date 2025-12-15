import React, { useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, MicOff, X, Image as ImageIcon, FileText, Globe, Sparkles } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface AttachmentFile {
    name: string;
    type: string;
    size: number;
    url: string;
    preview?: string;
    extractedText?: string;
}

interface ChatInputAreaProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isLoading: boolean;
    isListening: boolean;
    attachments: AttachmentFile[];
    onSend: () => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAttachment: (index: number) => void;
    onVoiceToggle: () => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
    prompt,
    setPrompt,
    isLoading,
    isListening,
    attachments,
    onSend,
    onFileSelect,
    onRemoveAttachment,
    onVoiceToggle
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="flex-shrink-0 p-4 sm:p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
            <div className="max-w-4xl mx-auto">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {attachments.map((attachment, index) => (
                            <div key={index} className="relative group bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 flex items-center gap-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600">
                                    {attachment.preview ? (
                                        <img src={attachment.preview} alt={attachment.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    )}
                                </div>
                                <div className="min-w-0 max-w-[120px]">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{attachment.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        {(attachment.size / 1024).toFixed(1)} KB
                                        {attachment.extractedText && <span className="text-green-500 text-[10px] font-bold">TEXT</span>}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveAttachment(index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Bar */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-100 blur transition duration-500 group-focus-within:opacity-100"></div>
                    <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-xl border border-gray-200 dark:border-gray-700">
                        {/* File Upload Button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.txt,.md,.csv,.json"
                            onChange={onFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all duration-200"
                            title="Attach files"
                            disabled={isLoading}
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>

                        {/* Main Input */}
                        <div className="flex-grow py-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isListening ? 'Listening...' : "Ask anything..."}
                                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base font-medium resize-none max-h-32 py-1"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 pb-1">
                            <button
                                onClick={onVoiceToggle}
                                className={`p-2.5 rounded-xl transition-all duration-300 ${isListening
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400'
                                    }`}
                                title="Voice Input"
                                disabled={isLoading}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>

                            <Button
                                onClick={onSend}
                                disabled={isLoading || (!prompt.trim() && attachments.length === 0)}
                                className={`p-2.5 rounded-xl transition-all duration-300 ${prompt.trim() || attachments.length > 0
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isLoading ? (
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3" />
                            Wait for accurate info
                        </span>
                        <span className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            PDFs & Images supported
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
