/**
 * Environment Configuration for Classic Offset Printer App
 * Handles different deployment environments and LM Studio connectivity
 */

export interface EnvironmentConfig {
  isProduction: boolean;
  isNetlify: boolean;
  lmStudioAvailable: boolean;
  baseUrl: string;
  proxyUrl?: string;
  fallbackMode: boolean;
}

class EnvironmentService {
  private static instance: EnvironmentService;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.detectEnvironment();
  }

  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  private detectEnvironment(): EnvironmentConfig {
    const isProduction = import.meta.env.PROD;
    const isNetlify = window.location.hostname.includes('netlify') || 
                     window.location.hostname.includes('.app') ||
                     import.meta.env.VITE_DEPLOY_ENV === 'netlify';
    
    // Get LM Studio URL from environment
    const lmStudioUrl = import.meta.env.VITE_LM_STUDIO_BASE_URL || 'http://192.168.3.25:1234';
    const proxyUrl = import.meta.env.VITE_LM_STUDIO_PROXY_URL || '';
    
    return {
      isProduction,
      isNetlify,
      lmStudioAvailable: false, // Will be checked dynamically
      baseUrl: lmStudioUrl,
      proxyUrl: proxyUrl || undefined,
      fallbackMode: isProduction && isNetlify // Enable fallback for production deploys
    };
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  async checkLMStudioAvailability(): Promise<boolean> {
    try {
      const signal = AbortSignal.timeout(3000);
      let response: Response;

      if (this.config.proxyUrl) {
        response = await fetch(this.config.proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: '/v1/models',
            method: 'GET',
          }),
          signal,
        });
      } else {
        response = await fetch(`${this.config.baseUrl}/v1/models`, {
          method: 'GET',
          mode: 'cors',
          signal,
        });
      }
      
      this.config.lmStudioAvailable = response.ok;
      return response.ok;
    } catch (error) {
      console.warn('LM Studio not available:', error);
      this.config.lmStudioAvailable = false;
      return false;
    }
  }

  shouldUseFallback(): boolean {
    return this.config.fallbackMode && !this.config.lmStudioAvailable;
  }

  /**
   * Get appropriate error message based on environment
   */
  getConnectionErrorMessage(): string {
    if (this.config.isNetlify) {
      return `
🌐 **Netlify Deployment Detected**

The hosted app now talks to LM Studio through a secure serverless proxy (Netlify Function / Supabase Edge Function).
If you see this message it means the proxy cannot reach your LM Studio instance.

✅ Verify the proxy function is deployed and configured with:
- LM_STUDIO_BASE_URL (your tunnel / public endpoint)
- LM_STUDIO_API_KEY (if required)

🖥️ On your machine:
1. Start LM Studio and load a model
2. Ensure your public tunnel / forwarded port is online
3. Test from the serverless function: \`curl <proxy-url> -d '{"path":"/v1/models","method":"GET"}'\`

🔁 For local-only usage run \`npm run dev\` which connects directly.
      `.trim();
    } else {
      return `
🖥️ **Local Development**

Cannot connect to LM Studio. Please:

1. Make sure LM Studio is running on port 1234
2. Enable CORS in LM Studio settings
3. Load a model in LM Studio
4. Check your network IP: ${this.config.baseUrl}
      `.trim();
    }
  }

  /**
   * Get setup instructions for different environments
   */
  getSetupInstructions(): {
    title: string;
    steps: string[];
    alternative?: string;
  } {
    if (this.config.isNetlify) {
      return {
        title: "Remote LM Studio Setup",
        steps: [
          "Start LM Studio on your local machine",
          "Load your preferred model",
          "Go to Settings → Network → Enable CORS",
          "Set up router port forwarding (port 1234)",
          "Update .env.remote with your public IP",
          "Redeploy the application"
        ],
        alternative: "For testing: Use local development (npm run dev)"
      };
    } else {
      return {
        title: "Local LM Studio Setup", 
        steps: [
          "Download and install LM Studio",
          "Start LM Studio application",
          "Load a model (recommended: qwen/qwen3-vl-4b)",
          "Go to Settings → Network → Enable CORS",
          "Start the local server on port 1234"
        ],
        alternative: "The app will work with business data only if LM Studio is unavailable"
      };
    }
  }
}

export default EnvironmentService;
