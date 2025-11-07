/**
 * Environment Configuration for Classic Offset Printer App
 * Handles different deployment environments and LM Studio connectivity
 */

export interface EnvironmentConfig {
  isProduction: boolean;
  isNetlify: boolean;
  lmStudioAvailable: boolean;
  baseUrl: string;
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
    
    return {
      isProduction,
      isNetlify,
      lmStudioAvailable: false, // Will be checked dynamically
      baseUrl: lmStudioUrl,
      fallbackMode: isProduction && isNetlify // Enable fallback for production deploys
    };
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  async checkLMStudioAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(3000),
      });
      
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

LM Studio is not accessible from remote deployments. Here are your options:

**Option 1: Enable Remote Access (Recommended)**
1. On your local machine, start LM Studio
2. Go to Settings → Network → Enable CORS
3. Set up port forwarding on your router (port 1234)
4. Update VITE_LM_STUDIO_BASE_URL with your public IP

**Option 2: Use Fallback Mode**
The app will use business data without AI processing when LM Studio is unavailable.

**Option 3: Local Development**
For full functionality, run the app locally: \`npm run dev\`
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
