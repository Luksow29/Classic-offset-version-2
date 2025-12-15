import React from 'react';
import { Bot } from 'lucide-react';

export const ChatTypingIndicator: React.FC<{ label?: string }> = ({
  label = 'Thinking…',
}) => {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex gap-3 max-w-[85%]">
        <div className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-1 ring-black/5 dark:ring-white/10">
          <Bot className="h-4 w-4" />
        </div>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white dark:bg-gray-900 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
