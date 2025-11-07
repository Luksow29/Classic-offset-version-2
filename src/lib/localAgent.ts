import EnvironmentService from './environmentConfig';

interface LocalAgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LocalAgentResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  // Helper property for easy access to content
  content?: string;
}

interface LocalAgentConfig {
  baseUrl: string;
  timeout: number;
  model: string;
}

class LocalAgentService {
  private config: LocalAgentConfig;
  private environmentService: EnvironmentService;

  constructor(config: Partial<LocalAgentConfig> = {}) {
    this.environmentService = EnvironmentService.getInstance();
    
    // Environment-based configuration for different deployment environments
    const defaultBaseUrl = import.meta.env.VITE_LM_STUDIO_BASE_URL || 'http://192.168.3.25:1234';
    const defaultModel = import.meta.env.VITE_LM_STUDIO_MODEL || 'qwen/qwen3-vl-4b';
    
    this.config = {
      baseUrl: defaultBaseUrl,
      timeout: 30000,
      model: defaultModel,
      ...config,
    };
  }

  /**
   * Send a chat completion request to LM Studio
   */
  async chatCompletion(
    messages: LocalAgentMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<LocalAgentResponse> {
    const {
      model = 'qwen/qwen3-vl-4b',
      temperature = 0.7,
      maxTokens = -1,
      stream = false,
    } = options;

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Add content property for easy access
      if (data.choices && data.choices[0] && data.choices[0].message) {
        data.content = data.choices[0].message.content;
      }
      return data;
    } catch (error) {
      // Check environment and provide appropriate error message
      const isAvailable = await this.environmentService.checkLMStudioAvailability();
      
      if (!isAvailable && this.environmentService.shouldUseFallback()) {
        throw new Error(this.environmentService.getConnectionErrorMessage());
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - LM Studio might not be running');
        }
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          // Check if it's likely a CORS error
          if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
            throw new Error('CORS configuration required - please enable CORS in LM Studio settings');
          }
          throw new Error(this.environmentService.getConnectionErrorMessage());
        }
      }
      throw error;
    }
  }

  /**
   * Stream chat completion responses
   */
  async *streamChatCompletion(
    messages: LocalAgentMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const {
      model = 'qwen/qwen3-vl-4b',
      temperature = 0.7,
      maxTokens = -1,
    } = options;

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        mode: 'cors',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }

            // Skip empty data lines
            if (!data) {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content && typeof content === 'string') {
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - LM Studio might not be running');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to LM Studio - make sure it\'s running on localhost:1234');
        }
      }
      throw error;
    }
  }

  /**
   * Get available models from LM Studio
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        mode: 'cors',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: { id: string }) => model.id) || [];
    } catch (error) {
      console.warn('Could not fetch models from LM Studio:', error);
      return ['qwen/qwen3-vl-4b']; // Default fallback
    }
  }

  /**
   * Set the current model for the local agent
   */
  setModel(model: string): void {
    this.config.model = model;
  }

  /**
   * Check if LM Studio is running and accessible
   */
  async isHealthy(): Promise<boolean> {
    return await this.environmentService.checkLMStudioAvailability();
  }

  /**
   * Get environment-specific setup instructions
   */
  getSetupInstructions() {
    return this.environmentService.getSetupInstructions();
  }

  /**
   * Get current environment configuration
   */
  getEnvironmentInfo() {
    return this.environmentService.getConfig();
  }

  /**
   * Update the base URL for the service
   */
  updateBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
  }

  /**
   * Get current configuration
   */
  getConfig(): LocalAgentConfig {
    return { ...this.config };
  }

  /**
   * Create system prompts for printer business context
   */
  createBusinessSystemPrompt(): LocalAgentMessage {
    return {
      role: 'system',
      content: `You are a Local AI Assistant for Classic Offset Printers, a printing business management system. You help with:

CORE FUNCTIONS:
- Order management and analysis
- Customer communication
- Printing process optimization
- Cost calculations and estimates
- Inventory management
- Quality control guidance

BUSINESS CONTEXT:
- This is a printing business with offset printing capabilities
- Orders include various print jobs (business cards, flyers, banners, etc.)
- Customers have different requirements and deadlines
- Cost efficiency and quality are priorities

COMMUNICATION STYLE:
- Professional but friendly
- Provide actionable insights
- Be concise and practical
- Focus on business value

CAPABILITIES:
- Analyze order data and suggest optimizations
- Help draft customer communications
- Provide printing technical guidance
- Calculate costs and timelines
- Suggest workflow improvements

Always consider the printing business context in your responses and provide practical, actionable advice.`
    };
  }
}

// Create a singleton instance
export const localAgent = new LocalAgentService();

// Export types
export type { LocalAgentMessage, LocalAgentResponse, LocalAgentConfig };
