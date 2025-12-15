// @ts-nocheck
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, FileText, Download, Share2, Copy, BarChart2 } from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { AttachmentFile } from './ChatInputArea';

// Register Chart.js components
Chart.register(...registerables);

// --- TYPE DEFINITIONS ---
export interface DetectedEntity {
    type: 'customer' | 'date' | 'amount' | 'product' | 'order';
    value: string;
    action?: string;
}

export interface ContentPart {
    text: string;
}

export interface ConversationEntry {
    role: 'user' | 'model';
    parts: ContentPart[];
    attachments?: AttachmentFile[];
    timestamp?: number;
}

interface MessageBubbleProps {
    message: ConversationEntry;
    isLast: boolean;
    onEntityClick: (entity: DetectedEntity) => void;
    onQuickReply: (text: string) => void;
    onCopy: (text: string) => void;
    onShare: (text: string) => void;
    onExport: (text: string) => void;
    extractEntities: (text: string) => DetectedEntity[];
    getContextualSuggestions: (text: string) => string[];
    translatedText?: string;
    renderContent?: (text: string) => React.ReactNode;
}

// ChartRenderer component (internal)
const ChartRenderer = ({ chartType, data, options }: any) => {
    if (chartType === 'bar') return <Bar data={data} options={options} />;
    if (chartType === 'line') return <Line data={data} options={options} />;
    if (chartType === 'pie') return <Pie data={data} options={options} />;
    return <div className="p-4 bg-gray-100 rounded text-gray-500">Unsupported chart type</div>;
};

// Default content renderer if not provided
const DefaultContentRenderer = ({ text }: { text: string }) => {
    // Detect chart code block
    const chartMatch = text.match(/```chartjs\n([\s\S]*?)```/);
    if (chartMatch) {
        try {
            const chartSpec = JSON.parse(chartMatch[1]);
            return (
                <div className="my-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <ChartRenderer chartType={chartSpec.type} data={chartSpec.data} options={chartSpec.options} />
                </div>
            );
        } catch (e) {
            // Fallback
        }
    }

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:rounded-xl">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }) => {
                        return inline ? (
                            <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm text-pink-500 font-mono" {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono my-2 shadow-inner" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >{text}</ReactMarkdown>
        </div>
    );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isLast,
    onEntityClick,
    onQuickReply,
    onCopy,
    onShare,
    onExport,
    extractEntities,
    getContextualSuggestions,
    translatedText
}) => {
    const isUser = message.role === 'user';
    const entities = !isUser ? extractEntities(message.parts[0].text) : [];
    const suggestions = (!isUser && isLast) ? getContextualSuggestions(message.parts[0].text) : [];

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex max-w-[90%] md:max-w-[80%] lg:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md ${isUser
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                    {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {isUser ? 'You' : 'Classic AI'}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className={`relative px-5 py-4 rounded-2xl shadow-sm ${isUser
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none'
                        }`}>
                        {/* Attachments (User) */}
                        {isUser && message.attachments && message.attachments.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {message.attachments.map((att, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-indigo-700/50 p-2 rounded-lg border border-indigo-500/30">
                                        {att.preview ? (
                                            <img src={att.preview} className="w-8 h-8 rounded object-cover" alt="" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-indigo-200" />
                                        )}
                                        <div className="max-w-[150px]">
                                            <p className="text-xs font-medium truncate opacity-90">{att.name}</p>
                                            <p className="text-[10px] opacity-70">{(att.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Text Content */}
                        <div className={isUser ? 'text-white/95' : ''}>
                            <DefaultContentRenderer text={message.parts[0].text} />
                        </div>

                        {/* Translation */}
                        {translatedText && (
                            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                                <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">தமிழ் மொழிபெயர்ப்பு:</div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 italic bg-purple-50 dark:bg-purple-900/10 p-2.5 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                    {translatedText}
                                </div>
                            </div>
                        )}

                        {/* Action Chips (Entities) */}
                        {!isUser && entities.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {entities.map((entity, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onEntityClick(entity)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium transition-colors"
                                    >
                                        <BarChart2 className="w-3 h-3" />
                                        {entity.value}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions (Copy, Share, Export) */}
                    {!isUser && (
                        <div className="flex items-center gap-2 mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={() => onCopy(message.parts[0].text)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Copy"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => onShare(message.parts[0].text)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Share"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => onExport(message.parts[0].text)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Export"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Contextual Suggestions */}
                    {!isUser && isLast && suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 px-1 animate-in fade-in duration-500 delay-300">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => onQuickReply(suggestion)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm text-gray-600 dark:text-gray-300 text-xs rounded-xl transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
