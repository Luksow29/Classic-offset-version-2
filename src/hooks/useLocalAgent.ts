import { useState, useCallback, useRef, useEffect } from 'react';
import { localAgent, LocalAgentMessage } from '../lib/localAgent';
import { ragService } from '../lib/ragServices';

interface UseLocalAgentOptions {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface UseLocalAgentReturn {
  messages: LocalAgentMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  isHealthy: boolean;
  availableModels: string[];
  currentModel: string;
  sendMessage: (content: string) => Promise<void>;
  streamMessage: (content: string) => Promise<void>;
  sendBusinessQuery: (queryType: string, customPrompt?: string) => Promise<void>;
  clearMessages: () => void;
  setModel: (model: string) => void;
  checkHealth: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
}

export const useLocalAgent = (options: UseLocalAgentOptions = {}): UseLocalAgentReturn => {
  const { systemPrompt, temperature = 0.7, maxTokens = -1 } = options;
  const savedModel =
    typeof window !== 'undefined' ? window.localStorage.getItem('lmStudio.currentModel') : null;
  const initialModel = options.model ?? savedModel ?? localAgent.getConfig().model;

  const [messages, setMessages] = useState<LocalAgentMessage[]>(() => {
    const systemMsg = systemPrompt 
      ? { role: 'system' as const, content: systemPrompt }
      : localAgent.createBusinessSystemPrompt();
    return [systemMsg];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(
    initialModel ? [initialModel] : []
  );
  const [currentModel, setCurrentModel] = useState(initialModel);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');

  const loadAvailableModels = useCallback(async () => {
    try {
      const models = await localAgent.getModels();
      setAvailableModels(models);
      if (models.length > 0) {
        setCurrentModel((prev) => {
          const next = models.includes(prev) ? prev : models[0];
          if (next !== prev) {
            localAgent.setModel(next);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('lmStudio.currentModel', next);
            }
          }
          return next;
        });
      }
    } catch (err) {
      console.warn('Could not load available models:', err);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const healthy = await localAgent.isHealthy();
      setIsHealthy(healthy);
      if (!healthy) {
        setError('LM Studio is not running. Please start LM Studio and load a model.');
        return;
      }

      setError(null);
      await loadAvailableModels();
    } catch {
      setIsHealthy(false);
      setError('Failed to check LM Studio status');
    }
  }, [loadAvailableModels]);

  // Check LM Studio health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const setModel = useCallback((newModel: string) => {
    setCurrentModel(newModel);
    localAgent.setModel(newModel);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lmStudio.currentModel', newModel);
    }
  }, []);

  const clearMessages = useCallback(() => {
    const systemMsg = systemPrompt 
      ? { role: 'system' as const, content: systemPrompt }
      : localAgent.createBusinessSystemPrompt();
    setMessages([systemMsg]);
    setError(null);
  }, [systemPrompt]);

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || !content.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const originalContent = content.trim();
    lastUserMessageRef.current = originalContent;

    // Check if this is a business query and get context
    let enhancedContent = originalContent;
    if (ragService.classifyQuery(originalContent) === 'business') {
      try {
        const businessContexts = await ragService.getBusinessContext(originalContent);
        if (businessContexts.length > 0) {
          enhancedContent = ragService.formatContextForLocalAI(businessContexts, originalContent);
        }
      } catch (error) {
        console.warn('Failed to get business context:', error);
        // Continue with original content if RAG service fails
      }
    }

    const userMessage: LocalAgentMessage = { role: 'user', content: originalContent };
    const contextMessage: LocalAgentMessage = { role: 'user', content: enhancedContent };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Use enhanced content for AI request but show original user message
      const messagesForAI = [...messages, contextMessage];
      const response = await localAgent.chatCompletion(
        messagesForAI,
        {
          model: currentModel,
          temperature,
          maxTokens,
          stream: false,
        }
      );

      const assistantMessage: LocalAgentMessage = {
        role: 'assistant',
        content: response.choices[0]?.message?.content || 'No response received',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, currentModel, temperature, maxTokens]);

  const streamMessage = useCallback(async (content: string) => {
    if (isStreaming || !content.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const originalContent = content.trim();
    lastUserMessageRef.current = originalContent;

    // Check if this is a business query and get context
    let enhancedContent = originalContent;
    if (ragService.classifyQuery(originalContent) === 'business') {
      try {
        const businessContexts = await ragService.getBusinessContext(originalContent);
        if (businessContexts.length > 0) {
          enhancedContent = ragService.formatContextForLocalAI(businessContexts, originalContent);
        }
      } catch (error) {
        console.warn('Failed to get business context:', error);
        // Continue with original content if RAG service fails
      }
    }

    const userMessage: LocalAgentMessage = { role: 'user', content: originalContent };
    const contextMessage: LocalAgentMessage = { role: 'user', content: enhancedContent };

    // Add both user message and empty assistant message at once
    const assistantMessage: LocalAgentMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setError(null);

    try {
      // Use enhanced content for AI request but show original user message
      const messagesForAI = [...messages, contextMessage];
      const stream = localAgent.streamChatCompletion(
        messagesForAI,
        {
          model: currentModel,
          temperature,
          maxTokens,
        }
      );

      let accumulatedContent = '';
      for await (const chunk of stream) {
        accumulatedContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          // Ensure we are updating the correct assistant message
          if (lastMessage && lastMessage.role === 'assistant') {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content: accumulatedContent
            };
          }
          return newMessages;
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Stream error:', errorMessage);
      setError(errorMessage);
      
      // Remove ONLY the empty assistant message if it failed completely (empty content)
      setMessages(prev => {
         const last = prev[prev.length - 1];
         if (last && last.role === 'assistant' && !last.content) {
             return prev.slice(0, -1);
         }
         return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, currentModel, temperature, maxTokens]);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  const sendBusinessQuery = useCallback(async (queryType: string, customPrompt?: string) => {
    try {
      // Get business data context
      const businessContexts = await ragService.getQuickBusinessData(queryType);
      
      if (businessContexts.length === 0) {
        setError(`No data found for ${queryType}`);
        return;
      }

      // Create a contextual prompt
      const defaultPrompts = {
        'recent-orders': 'Show me a summary of recent orders with key details',
        'due-payments': 'Show me the due payments list with customer details and amounts',
        'daily-briefing': 'Give me today\'s business briefing',
        'top-customers': 'Show me the top spending customers',
        'low-stock': 'Show me materials with low stock that need attention',
        'all-customers': 'Give me an overview of all customers',
        'all-products': 'Show me the complete product catalog'
      };

      const prompt = customPrompt || defaultPrompts[queryType] || `Analyze the ${queryType} data`;
      const enhancedContent = ragService.formatContextForLocalAI(businessContexts, prompt);

      // Show user prompt and send enhanced content to AI
      const userMessage: LocalAgentMessage = { role: 'user', content: prompt };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const messagesForAI: LocalAgentMessage[] = [...messages, { role: 'user' as const, content: enhancedContent }];
      const response = await localAgent.chatCompletion(
        messagesForAI,
        {
          model: currentModel,
          temperature,
          maxTokens,
          stream: false,
        }
      );

      const assistantMessage: LocalAgentMessage = {
        role: 'assistant',
        content: response.choices[0]?.message?.content || 'No response received',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentModel, temperature, maxTokens]);

  return {
    messages: messages.slice(1), // Don't show system message to user
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
  };
};
