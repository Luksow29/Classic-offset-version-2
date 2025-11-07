import { useState, useCallback, useRef, useEffect } from 'react';
import { localAgent, LocalAgentMessage } from '../lib/localAgent';

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
  clearMessages: () => void;
  setModel: (model: string) => void;
  checkHealth: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
}

export const useLocalAgent = (options: UseLocalAgentOptions = {}): UseLocalAgentReturn => {
  const {
    systemPrompt,
    model = 'qwen/qwen3-vl-4b',
    temperature = 0.7,
    maxTokens = -1,
  } = options;

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
  const [availableModels, setAvailableModels] = useState<string[]>([model]);
  const [currentModel, setCurrentModel] = useState(model);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');

  const checkHealth = useCallback(async () => {
    try {
      const healthy = await localAgent.isHealthy();
      setIsHealthy(healthy);
      if (!healthy) {
        setError('LM Studio is not running. Please start LM Studio and load a model.');
      } else {
        setError(null);
      }
    } catch {
      setIsHealthy(false);
      setError('Failed to check LM Studio status');
    }
  }, []);

  const loadAvailableModels = useCallback(async () => {
    try {
      const models = await localAgent.getModels();
      setAvailableModels(models);
    } catch (err) {
      console.warn('Could not load available models:', err);
    }
  }, []);

  // Check LM Studio health on mount
  useEffect(() => {
    checkHealth();
    loadAvailableModels();
  }, [checkHealth, loadAvailableModels]);

  const setModel = useCallback((newModel: string) => {
    setCurrentModel(newModel);
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

    const userMessage: LocalAgentMessage = { role: 'user', content: content.trim() };
    lastUserMessageRef.current = content.trim();

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await localAgent.chatCompletion(
        [...messages, userMessage],
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

    const userMessage: LocalAgentMessage = { role: 'user', content: content.trim() };
    lastUserMessageRef.current = content.trim();

    // Add both user message and empty assistant message at once
    const assistantMessage: LocalAgentMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setError(null);

    try {
      const stream = localAgent.streamChatCompletion(
        [...messages, userMessage],
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
          if (lastMessage.role === 'assistant') {
            // Use accumulated content to prevent duplication
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
      setError(errorMessage);
      
      // Remove both user and assistant messages if there was an error
      setMessages(prev => prev.slice(0, -2));
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, currentModel, temperature, maxTokens]);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

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
    clearMessages,
    setModel,
    checkHealth,
    retryLastMessage,
  };
};
