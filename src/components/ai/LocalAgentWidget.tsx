import React, { useState } from 'react';
import { Bot, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { LocalAgent } from './LocalAgent';
import Button from '../ui/Button';

interface LocalAgentWidgetProps {
  className?: string;
}

export const LocalAgentWidget: React.FC<LocalAgentWidgetProps> = ({
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={toggleWidget}
          className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          title="Open Local Agent"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`bg-background border border-border rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-96 h-[600px] md:w-[500px] md:h-[700px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-sm">Local Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
              className="w-8 h-8 p-0 hover:bg-muted"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeWidget}
              className="w-8 h-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="h-[calc(100%-4rem)] overflow-hidden">
            <LocalAgent 
              className="h-full"
              showModelSelector={false}
              quickActions={[
                { 
                  label: 'Quick Help', 
                  prompt: 'I need quick help with my printing business. What can you assist me with?',
                  icon: <MessageCircle className="w-4 h-4" />
                },
                { 
                  label: 'Order Analysis', 
                  prompt: 'Help me analyze the current order for potential improvements.',
                  icon: <Bot className="w-4 h-4" />
                },
              ]}
            />
          </div>
        )}

        {isMinimized && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Click to expand Local Agent
          </div>
        )}
      </div>
    </div>
  );
};
