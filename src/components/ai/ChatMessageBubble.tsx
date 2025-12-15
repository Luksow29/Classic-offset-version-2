import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Copy, User } from 'lucide-react';
import Button from '../ui/Button';
import type { LocalAgentMessage } from '../../lib/localAgent';

export type ChatRole = Exclude<LocalAgentMessage['role'], 'system'>;

export interface ChatMessageBubbleProps {
  message: { role: ChatRole; content: string };
  isLastAssistant?: boolean;
  onCopy?: (content: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isLastAssistant = false,
  onCopy,
}) => {
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      onCopy?.(message.content);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      <div className={`flex max-w-[85%] min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        <div
          className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10 ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
          }`}
          aria-hidden="true"
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className="min-w-0">
          <div
            className={`relative rounded-2xl px-4 py-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-tl-sm'
            }`}
          >
            <div className={`${isUser ? 'prose-invert' : ''} prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-table:my-2`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || ''}</ReactMarkdown>
            </div>

            {!isUser && isLastAssistant && message.content?.trim() && (
              <div className="absolute -right-2 -top-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2 rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur"
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
