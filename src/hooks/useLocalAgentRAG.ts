// src/hooks/useLocalAgentRAG.ts
// Enhanced Local Agent Hook with RAG Capabilities

import { useState, useEffect, useCallback } from 'react';
import { localAgent, LocalAgentMessage } from '../lib/localAgent';
import { ragService, LocalRAGService } from '../lib/ragServices';

interface UseLocalAgentRAGOptions {
  systemPrompt?: string;
  initialModel?: string;
}

interface UseLocalAgentRAGReturn {
  // Basic messaging
  messages: LocalAgentMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Local AI state
  isHealthy: boolean;
  availableModels: string[];
  currentModel: string;
  
  // RAG-specific state
  isBusinessQuery: boolean;
  businessContext: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendBusinessQuery: (content: string) => Promise<void>;
  streamMessage: (content: string) => Promise<void>;
  streamBusinessQuery: (content: string) => Promise<void>;
  clearMessages: () => void;
  setModel: (model: string) => void;
  checkHealth: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
  
  // Business quick actions
  runQuickBusinessQuery: (queryType: string) => Promise<void>;
}

export const useLocalAgentRAG = (options: UseLocalAgentRAGOptions = {}): UseLocalAgentRAGReturn => {
  // Basic state from original hook
  const [messages, setMessages] = useState<LocalAgentMessage[]>(() => {
    const systemPrompt = options.systemPrompt || 
      `You are a helpful AI assistant for Classic Offset printing business. 
      You provide professional, well-formatted responses with business expertise.
      When provided with business data, analyze it thoroughly and present insights clearly.
      Use tables, bullet points, and proper formatting for better readability.`;
    
    return [{ role: 'system', content: systemPrompt }];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState(options.initialModel || '');
  
  // RAG-specific state
  const [isBusinessQuery, setIsBusinessQuery] = useState(false);
  const [businessContext, setBusinessContext] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    const initializeAgent = async () => {
      await checkHealth();
      await loadModels();
    };
    initializeAgent();
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const healthy = await localAgent.isHealthy();
      setIsHealthy(healthy);
      setError(healthy ? null : 'Local AI agent is not available');
    } catch (err) {
      setIsHealthy(false);
      setError(err instanceof Error ? err.message : 'Health check failed');
    }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const models = await localAgent.getModels();
      setAvailableModels(models);
      if (models.length > 0 && !currentModel) {
        setCurrentModel(models[0]);
        localAgent.setModel(models[0]);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  }, [currentModel]);

  const setModel = useCallback((model: string) => {
    setCurrentModel(model);
    localAgent.setModel(model);
  }, []);

  const clearMessages = useCallback(() => {
    const systemMessage = messages.find(m => m.role === 'system');
    setMessages(systemMessage ? [systemMessage] : []);
    setError(null);
    setBusinessContext(null);
    setIsBusinessQuery(false);
  }, [messages]);

  // Standard message sending (no RAG)
  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || isStreaming) return;

    const userMessage: LocalAgentMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setIsBusinessQuery(false);
    setBusinessContext(null);

    try {
      const response = await localAgent.chatCompletion(
        [...messages, userMessage].slice(-10), // Keep last 10 messages for context
        { model: currentModel }
      );

      const assistantMessage: LocalAgentMessage = {
        role: 'assistant',
        content: response.content || 'No response received'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      const errorResponse: LocalAgentMessage = {
        role: 'assistant',
        content: `Error: ${errorMessage}`
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isStreaming, currentModel]);

  // Enhanced business query with RAG
  const sendBusinessQuery = useCallback(async (content: string) => {
    if (isLoading || isStreaming) return;

    const userMessage: LocalAgentMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setIsBusinessQuery(true);

    try {
      // Step 1: Classify query
      const queryType = ragService.classifyQuery(content);
      
      if (queryType === 'business') {
        // Step 2: Get business context
        const contexts = await ragService.getBusinessContext(content);
        const enrichedPrompt = ragService.formatContextForLocalAI(contexts, content);
        
        setBusinessContext(enrichedPrompt);

        // Step 3: Send enriched prompt to local AI
        const response = await localAgent.chatCompletion(
          [
            { role: 'system', content: messages[0].content },
            { role: 'user', content: enrichedPrompt }
          ],
          { model: currentModel }
        );

        const assistantMessage: LocalAgentMessage = {
          role: 'assistant',
          content: response.content || 'No response received'
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback to regular message for non-business queries
        await sendMessage(content);
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process business query';
      setError(errorMessage);
      
      const errorResponse: LocalAgentMessage = {
        role: 'assistant',
        content: `Business Query Error: ${errorMessage}`
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isStreaming, currentModel, sendMessage]);

  // Streaming message (standard)
  const streamMessage = useCallback(async (content: string) => {
    if (isLoading || isStreaming) return;

    const userMessage: LocalAgentMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);
    setIsBusinessQuery(false);
    setBusinessContext(null);

    const assistantMessage: LocalAgentMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const stream = localAgent.streamChatCompletion(
        [...messages, userMessage].slice(-10),
        { model: currentModel }
      );

      for await (const chunk of stream) {
        if (chunk.content) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk.content;
            }
            return newMessages;
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Streaming failed';
      setError(errorMessage);
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = `Streaming Error: ${errorMessage}`;
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isLoading, isStreaming, currentModel]);

  // Streaming business query with RAG
  const streamBusinessQuery = useCallback(async (content: string) => {
    if (isLoading || isStreaming) return;

    const userMessage: LocalAgentMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);
    setIsBusinessQuery(true);

    try {
      // Step 1: Classify and get context
      const queryType = ragService.classifyQuery(content);
      
      if (queryType === 'business') {
        const contexts = await ragService.getBusinessContext(content);
        const enrichedPrompt = ragService.formatContextForLocalAI(contexts, content);
        
        setBusinessContext(enrichedPrompt);

        // Step 2: Stream with enriched context
        const assistantMessage: LocalAgentMessage = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMessage]);

        const stream = localAgent.streamChatCompletion(
          [
            { role: 'system', content: messages[0].content },
            { role: 'user', content: enrichedPrompt }
          ],
          { model: currentModel }
        );

        for await (const chunk of stream) {
          if (chunk.content) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.content += chunk.content;
              }
              return newMessages;
            });
          }
        }
      } else {
        // Fallback to regular streaming
        await streamMessage(content);
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stream business query';
      setError(errorMessage);
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = `Business Streaming Error: ${errorMessage}`;
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isLoading, isStreaming, currentModel, streamMessage]);

  // Quick business queries
  const runQuickBusinessQuery = useCallback(async (queryType: string) => {
    if (isLoading || isStreaming) return;

    const queryLabels = {
      'daily-briefing': 'Get daily business briefing',
      'all-customers': 'Show all customers', 
      'top-customers': 'Show top 5 customers',
      'due-payments': 'Show customers with due payments',
      'all-products': 'Show all products',
      'recent-orders': 'Show recent orders',
      'low-stock': 'Show low stock materials'
    };

    const queryLabel = queryLabels[queryType] || 'Run business query';
    await sendBusinessQuery(queryLabel);
  }, [sendBusinessQuery, isLoading, isStreaming]);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message if it exists
      setMessages(prev => {
        const filtered = prev.slice();
        if (filtered[filtered.length - 1]?.role === 'assistant') {
          filtered.pop();
        }
        return filtered;
      });
      
      // Retry based on whether it was a business query
      if (isBusinessQuery) {
        await sendBusinessQuery(lastUserMessage.content);
      } else {
        await sendMessage(lastUserMessage.content);
      }
    }
  }, [messages, isBusinessQuery, sendBusinessQuery, sendMessage]);

  return {
    // Basic state
    messages,
    isLoading,
    isStreaming,
    error,
    isHealthy,
    availableModels,
    currentModel,
    
    // RAG state
    isBusinessQuery,
    businessContext,
    
    // Actions
    sendMessage,
    sendBusinessQuery,
    streamMessage,
    streamBusinessQuery,
    clearMessages,
    setModel,
    checkHealth,
    retryLastMessage,
    runQuickBusinessQuery,
  };
};
