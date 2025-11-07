// src/components/ai/LocalAgentRAG.tsx
// Enhanced Local Agent with RAG capabilities

import React, { useState, useRef } from 'react';
import { Send, Bot, User, RefreshCw, AlertCircle, Brain, Database, Zap, TrendingUp, Users, Package, DollarSign, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { CORSError } from './CORSError';
import { useLocalAgent } from '../../hooks/useLocalAgent';
import { ragService } from '../../lib/ragServices';

interface LocalAgentRAGProps {
  className?: string;
  showModelSelector?: boolean;
}

export const LocalAgentRAG: React.FC<LocalAgentRAGProps> = ({
  className = '',
  showModelSelector = true,
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
    clearMessages,
    setModel,
    checkHealth,
    retryLastMessage,
  } = useLocalAgent();

  const [input, setInput] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [businessContext, setBusinessContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Business quick actions
  const businessActions = [
    { 
      label: 'Daily Business Briefing', 
      query: 'Get today\'s business briefing with orders, revenue, and alerts',
      icon: <TrendingUp className="w-4 h-4" />,
      type: 'daily-briefing'
    },
    { 
      label: 'Show All Customers', 
      query: 'Show me all customers in our database',
      icon: <Users className="w-4 h-4" />,
      type: 'all-customers'  
    },
    { 
      label: 'Top 5 Customers', 
      query: 'Who are our top 5 spending customers of all time?',
      icon: <DollarSign className="w-4 h-4" />,
      type: 'top-customers'
    },
    { 
      label: 'Due Payments', 
      query: 'Show customers with outstanding due payments',
      icon: <AlertCircle className="w-4 h-4" />,
      type: 'due-payments'
    },
    { 
      label: 'All Products', 
      query: 'List all our products and services',
      icon: <Package className="w-4 h-4" />,
      type: 'all-products'
    },
    { 
      label: 'Recent Orders', 
      query: 'Show recent orders from customers',
      icon: <FileText className="w-4 h-4" />,
      type: 'recent-orders'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const message = input.trim();
    setInput('');

    // Check if this is a business query
    const queryType = ragService.classifyQuery(message);
    
    if (queryType === 'business') {
      await handleBusinessQuery(message);
    } else {
      // Regular local AI query
      setIsBusinessMode(false);
      setBusinessContext(null);
      
      if (useStreaming) {
        await streamMessage(message);
      } else {
        await sendMessage(message);
      }
    }
  };

  const handleBusinessQuery = async (query: string) => {
    setIsBusinessMode(true);
    
    try {
      // Get business context from RAG service
      const contexts = await ragService.getBusinessContext(query);
      const enrichedPrompt = ragService.formatContextForLocalAI(contexts, query);
      
      setBusinessContext(enrichedPrompt);

      // Send enriched prompt to local AI
      if (useStreaming) {
        await streamMessage(enrichedPrompt);
      } else {
        await sendMessage(enrichedPrompt);
      }
    } catch (error) {
      console.error('Business query error:', error);
      // Fallback to regular query
      if (useStreaming) {
        await streamMessage(query);
      } else {
        await sendMessage(query);
      }
    }
  };

  const handleQuickAction = async (action: typeof businessActions[0]) => {
    if (isLoading || isStreaming) return;
    
    setInput(action.query);
    await handleBusinessQuery(action.query);
  };

  const formatMessage = (content: string) => {
    // Enhanced formatting for business responses
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>\n')
      .replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>\n')
      .replace(/# (.*?)\n/g, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>\n')
      .replace(/\n/g, '<br>');
  };

  // Check if error is CORS related
  const isCORSError = error && (
    error.includes('CORS') || 
    error.includes('Access-Control-Allow-Origin') ||
    error.includes('access control checks')
  );

  return (
    <div className={`flex flex-col space-y-4 max-w-6xl mx-auto h-screen max-h-screen p-4 ${className}`}>
      {/* Header */}
      <Card className="flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-5 h-5" />
                {isBusinessMode && <Database className="w-3 h-3 absolute -top-1 -right-1 text-blue-500" />}
              </div>
              <h2 className="text-lg font-semibold">
                Local AI Agent {isBusinessMode && <span className="text-blue-600">+ Business RAG</span>}
              </h2>
              <span className={`px-2 py-1 text-xs rounded-full ${
                isHealthy 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {isHealthy ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showModelSelector && availableModels.length > 1 && (
                <select
                  value={currentModel}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-2 py-1 text-sm border rounded-md bg-background"
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
          
          {/* Settings & Mode Toggle */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
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
            {isBusinessMode && (
              <div className="flex items-center gap-2 text-blue-600">
                <Database className="w-4 h-4" />
                <span>Business RAG Active</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="mb-4">
          {isCORSError ? (
            <CORSError onRetry={checkHealth} />
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={retryLastMessage}>
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business Quick Actions */}
      {messages.length <= 1 && (
        <Card className="flex-shrink-0" title="Business Intelligence">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Business Quick Actions</h3>
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full">
                RAG-Powered
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {businessActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-4 text-left"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading || isStreaming || !isHealthy}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Messages */}
      <Card className="flex flex-col flex-1 min-h-0 max-h-full overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Bot className="w-12 h-12 opacity-50" />
                  <Database className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-lg font-medium">Welcome to Local AI Agent with RAG!</p>
                <p className="text-sm">Your private AI assistant with business intelligence</p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-green-500" />
                    <span>100% Local Processing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-blue-500" />
                    <span>Business RAG</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-purple-500" />
                    <span>Zero Cost</span>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              message.role !== 'system' && (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] min-w-0 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <div className="relative">
                          <Bot className="w-4 h-4" />
                          {isBusinessMode && index === messages.length - 1 && (
                            <Database className="w-2 h-2 absolute -top-0.5 -right-0.5 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-3 break-words ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(message.content),
                        }}
                        className="prose prose-sm dark:prose-invert max-w-none break-words overflow-wrap-anywhere [&>*]:break-words [&>*]:overflow-wrap-anywhere"
                      />
                    </div>
                  </div>
                </div>
              )
            ))}

            {(isLoading || isStreaming) && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span className="text-sm text-muted-foreground">
                        {isBusinessMode ? 'Analyzing business data...' : isStreaming ? 'Thinking...' : 'Generating response...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 bg-card border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isHealthy
                    ? 'Ask about business data or general questions...'
                    : 'LM Studio is not connected'
                }
                disabled={isLoading || isStreaming || !isHealthy}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || isStreaming || !isHealthy}
                className={isBusinessMode ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {businessContext && (
              <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Business context loaded - enhanced response incoming</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
