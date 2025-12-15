// src/components/ai/LocalAgentRAG.tsx
// Enhanced Local Agent with RAG capabilities

import React, { useState, useRef, useEffect } from 'react';
import { Bot, RefreshCw, AlertCircle, Brain, Database, Zap, TrendingUp, Users, Package, DollarSign, FileText, Wifi, WifiOff, Globe, Home } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { CORSError } from './CORSError';
import { useLocalAgent } from '../../hooks/useLocalAgent';
import EnvironmentService, { EnvironmentConfig } from '../../lib/environmentConfig';
import { ragService } from '../../lib/ragServices';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { ChatComposer } from './ChatComposer';

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
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Environment detection
  useEffect(() => {
    const envService = EnvironmentService.getInstance();
    setEnvironmentInfo(envService.getConfig());
    
    // Check LM Studio availability on mount
    envService.checkLMStudioAvailability();
  }, []);

  // Auto-scroll on new messages/streaming updates
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isStreaming, isLoading]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);

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

  // Check if error is CORS related
  const isCORSError = error && (
    error.includes('CORS') || 
    error.includes('Access-Control-Allow-Origin') ||
    error.includes('access control checks')
  );

  return (
    <div className={
      `flex flex-col space-y-4 max-w-6xl mx-auto min-h-0 h-[calc(100vh-5rem)] p-4 ${className}`
    }>
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

          {copied && (
            <div className="mt-3 text-xs text-green-700 dark:text-green-300">
              Copied to clipboard
            </div>
          )}
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

      {/* Environment Status */}
      {environmentInfo && (
        <Card className="flex-shrink-0">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {environmentInfo.isNetlify ? (
                <Globe className="w-4 h-4 text-blue-500" />
              ) : (
                <Home className="w-4 h-4 text-green-500" />
              )}
              <h4 className="text-sm font-medium">
                {environmentInfo.isNetlify ? 'Remote Deployment' : 'Local Development'}
              </h4>
              <div className="flex items-center gap-1 ml-auto">
                {environmentInfo.lmStudioAvailable ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {environmentInfo.lmStudioAvailable ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {!environmentInfo.lmStudioAvailable && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-orange-600 dark:text-orange-400">
                  {environmentInfo.isNetlify ? 
                    '⚠️ LM Studio requires remote access setup for Netlify deployments' :
                    '⚠️ LM Studio is not running or accessible'
                  }
                </p>
                <p>
                  {environmentInfo.isNetlify ? 
                    'Business data available, but AI processing disabled' :
                    'Start LM Studio and enable CORS for full functionality'
                  }
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Messages */}
      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col h-full min-h-0">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-blue-700 dark:text-blue-200" />
                </div>
                <p className="text-lg font-semibold text-foreground">Local AI Agent</p>
                <p className="text-sm">Private chat + Business RAG (orders, customers, payments)</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    <Zap className="h-3 w-3 text-green-600" /> 100% Local
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    <Database className="h-3 w-3 text-blue-600" /> RAG
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    <DollarSign className="h-3 w-3 text-purple-600" /> Zero cost
                  </span>
                </div>
              </div>
            )}

            {messages.map((message, index) => {
                if (message.role === 'system') return null;
                const isLastAssistant =
                  message.role === 'assistant' && index === messages.length - 1 && !isStreaming && !isLoading;
                return (
                  <ChatMessageBubble
                    key={index}
                    message={{ role: message.role, content: message.content }}
                    isLastAssistant={isLastAssistant}
                    onCopy={() => setCopied(true)}
                  />
                );
              })
            }

            {(isLoading || isStreaming) && (
              <ChatTypingIndicator
                label={isBusinessMode ? 'Analyzing business data…' : 'Thinking…'}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          <ChatComposer
            value={input}
            onChange={setInput}
            disabled={isLoading || isStreaming || !isHealthy}
            placeholder={isHealthy ? 'Ask about business data or general questions…' : 'LM Studio is not connected'}
            hint={
              businessContext ? (
                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">
                  <Database className="h-3 w-3" /> Business context loaded
                </span>
              ) : null
            }
            onSubmit={async () => {
              if (!input.trim()) return;
              const message = input.trim();
              setInput('');

              const queryType = ragService.classifyQuery(message);
              if (queryType === 'business') {
                await handleBusinessQuery(message);
              } else {
                setIsBusinessMode(false);
                setBusinessContext(null);
                if (useStreaming) {
                  await streamMessage(message);
                } else {
                  await sendMessage(message);
                }
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
};
