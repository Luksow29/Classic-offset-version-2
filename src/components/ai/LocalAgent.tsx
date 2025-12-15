import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, RefreshCw, AlertCircle, Settings, ChevronDown } from 'lucide-react';
import { useLocalAgent } from '../../hooks/useLocalAgent';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { CORSError } from './CORSError';

interface LocalAgentProps {
  className?: string;
  showModelSelector?: boolean;
  quickActions?: Array<{
    label: string;
    prompt: string;
    icon?: React.ReactNode;
  }>;
}

export const LocalAgent: React.FC<LocalAgentProps> = ({
  className = '',
  showModelSelector = true,
  quickActions = [
    { label: 'Recent Orders', prompt: 'recent-orders', icon: <Bot className="w-4 h-4" /> },
    { label: 'Due Payments', prompt: 'due-payments', icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Daily Briefing', prompt: 'daily-briefing', icon: <RefreshCw className="w-4 h-4" /> },
    { label: 'Top Customers', prompt: 'top-customers', icon: <User className="w-4 h-4" /> },
    { label: 'Low Stock Alert', prompt: 'low-stock', icon: <Settings className="w-4 h-4" /> },
    { label: 'All Customers', prompt: 'all-customers', icon: <User className="w-4 h-4" /> },
  ],
}) => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    isHealthy,
    availableModels,
    currentModel,
    sendMessage,
    streamMessage,
    sendBusinessQuery,
    clearMessages,
    setModel,
    checkHealth,
    retryLastMessage,
  } = useLocalAgent();

  const [input, setInput] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessageCountRef = useRef(messages.length);
  const latestMessageContent = messages.length ? messages[messages.length - 1].content : '';
  const lastMessageLengthRef = useRef(latestMessageContent.length);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior,
    });
  }, []);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 8;
    setIsNearBottom(isAtBottom);
  };

  useEffect(() => {
    const hasNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (!isNearBottom || !hasNewMessage) return;
    scrollMessagesToBottom('smooth');
  }, [messages, isNearBottom, scrollMessagesToBottom]);

  useEffect(() => {
    const currentLength = latestMessageContent.length;
    const previousLength = lastMessageLengthRef.current;
    lastMessageLengthRef.current = currentLength;
    if (!isNearBottom) return;
    if (currentLength > previousLength) {
      scrollMessagesToBottom('smooth');
    }
  }, [latestMessageContent, isNearBottom, scrollMessagesToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const message = input.trim();
    setInput('');
    setIsNearBottom(true);

    if (useStreaming) {
      await streamMessage(message);
    } else {
      await sendMessage(message);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (isLoading || isStreaming) return;
    setIsNearBottom(true);

    // Check if this is a business query type
    const businessQueryTypes = ['recent-orders', 'due-payments', 'daily-briefing', 'top-customers', 'low-stock', 'all-customers', 'all-products'];
    
    if (businessQueryTypes.includes(prompt)) {
      // Use business query for data-driven actions
      await sendBusinessQuery(prompt);
    } else {
      // Use regular message for general prompts
      if (useStreaming) {
        await streamMessage(prompt);
      } else {
        await sendMessage(prompt);
      }
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const isCORSError = error && (
    error.includes('CORS') ||
    error.includes('Access-Control-Allow-Origin') ||
    error.includes('access control checks')
  );

  return (
    <div className={`grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)] ${className}`}>
      <Card className="flex flex-col h-[75vh] min-h-[560px] overflow-hidden border border-border/60 shadow-xl shadow-black/5">
        <div className="px-6 py-4 border-b border-border/60 backdrop-blur-sm bg-background/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Local Agent</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">Printing Ops Copilot</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    isHealthy
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {isHealthy ? 'Live connection' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Private chat backed by your LM Studio deployment.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {showModelSelector && availableModels.length > 0 && (
                <select
                  value={currentModel}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-md bg-background shadow-sm"
                  disabled={isLoading || isStreaming}
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={checkHealth}
                disabled={isLoading || isStreaming}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={isLoading || isStreaming}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 border-b border-border/60 bg-red-50/60 dark:bg-red-900/20">
            {isCORSError ? (
              <CORSError onRetry={checkHealth} />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={retryLastMessage}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 relative bg-muted/20 overflow-hidden">
          <div
            ref={messagesContainerRef}
            className="absolute inset-0 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar"
            onScroll={handleScroll}
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                <div className="p-4 rounded-2xl bg-background shadow-inner border border-dashed border-border/60">
                  <Bot className="w-10 h-10 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-foreground">Start a conversation</p>
                  <p className="text-sm text-muted-foreground">
                    Ask about orders, production, or customer communications.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-foreground border border-border/70'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                        : 'bg-white dark:bg-gray-900 text-foreground border border-border/60'
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(message.content),
                      }}
                      className="prose prose-sm max-w-none dark:prose-invert"
                    />
                  </div>
                </div>
              </div>
            ))}

            {(isLoading || isStreaming) && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 text-foreground border border-border/70">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>{isStreaming ? 'Streaming response…' : 'Generating response…'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isNearBottom && (
            <div className="absolute bottom-24 right-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsNearBottom(true);
                  scrollMessagesToBottom();
                }}
                className="rounded-full w-11 h-11 p-0 shadow-lg bg-background/80 backdrop-blur border-2"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-5 py-4 bg-background/95 shadow-inner sticky bottom-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isHealthy
                  ? 'Ask your local AI assistant anything...'
                  : 'LM Studio is not connected'
              }
              disabled={isLoading || isStreaming || !isHealthy}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || isStreaming || !isHealthy}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="rounded"
              />
              Stream responses
            </label>
            <span>Model: {currentModel}</span>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {quickActions.length > 0 && (
          <Card className="p-5 space-y-4 border border-border/60 shadow-lg shadow-black/5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workflow boosts</p>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Drop in a curated prompt to get instant help.</p>
            </div>
            <div className="flex flex-col gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-between h-auto px-4 py-3 text-left border-border/70 hover:border-primary/40 hover:bg-primary/5"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading || isStreaming || !isHealthy}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                      {action.icon || <Bot className="w-4 h-4" />}
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Run</span>
                </Button>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5 space-y-4 border border-border/60 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Session</p>
              <h3 className="text-lg font-semibold">Control Center</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isHealthy
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {isHealthy ? 'Connected' : 'Action needed'}
            </span>
          </div>

          {showModelSelector && availableModels.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Current model</label>
              <select
                value={currentModel}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background shadow-sm"
                disabled={isLoading || isStreaming}
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={isLoading || isStreaming}
              className="flex-1 min-w-[140px]"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Check Health
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              disabled={isLoading || isStreaming}
              className="flex-1 min-w-[140px]"
            >
              Clear History
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Messages</p>
              <p className="text-2xl font-semibold text-foreground">{messages.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Mode</p>
              <p className="text-sm font-medium text-foreground">{useStreaming ? 'Streaming' : 'Standard'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
