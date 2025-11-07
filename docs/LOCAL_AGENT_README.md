# Local Agent Integration

This integration allows you to use your local LM Studio server as a private AI assistant within your Classic Offset Printers app.

## 🚀 Features

- **Private & Offline**: All conversations stay on your machine
- **No API Costs**: Use your own models without usage limits
- **Business-Focused**: Specialized prompts for printing business operations
- **Streaming Support**: Real-time response streaming
- **Model Switching**: Easy switching between loaded models
- **Floating Widget**: Access from anywhere in the app
- **Context-Aware**: Understands your printing business domain

## 📋 Setup Instructions

### 1. Install LM Studio
1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Install and launch the application

### 2. Download a Model
1. In LM Studio, go to the "Search" tab
2. Download a recommended model:
   - **Qwen/Qwen2.5-7B-Instruct** (Good balance of performance and size)
   - **Microsoft/Phi-3-mini-4k-instruct** (Lightweight, fast)
   - **Meta-Llama-3.1-8B-Instruct** (High quality responses)

### 3. Load and Start the Server
1. Go to the "Chat" tab in LM Studio
2. Load your downloaded model
3. Click "Start Server" (should run on localhost:1234)
4. Keep LM Studio running while using the Local Agent

### 4. Use in Your App
- Navigate to **Communication > Local Agent** in the sidebar
- The app will automatically connect to your local server
- Start chatting with business-specific prompts and actions

## 🎯 Quick Actions

The Local Agent comes with pre-built business actions:

- **📊 Analyze Current Order**: Get optimization suggestions for orders
- **✉️ Draft Customer Email**: Create professional customer communications
- **💰 Calculate Print Costs**: Estimate costs for printing projects
- **✅ Quality Guidelines**: Get quality control procedures
- **⚡ Optimize Workflow**: Improve production processes
- **🔧 Troubleshoot Issues**: Diagnose printing problems

## 🔧 Components

### Main Components
- **LocalAgent**: Full chat interface with model selection
- **LocalAgentWidget**: Floating chat widget for global access
- **ModelSelector**: Dropdown for switching between models

### API Service
- **localAgent**: Service for communicating with LM Studio
- **useLocalAgent**: React hook for state management

### Business Context
- **BusinessPromptBuilder**: Creates business-specific system prompts
- **defaultQuickActions**: Pre-built business actions

## 💡 Usage Examples

### Basic Usage
```tsx
import { LocalAgent } from '@/components/ai';

function MyPage() {
  return (
    <LocalAgent 
      showModelSelector={true}
      quickActions={[
        {
          label: 'Custom Action',
          prompt: 'Help me with a specific task',
          icon: <Bot className="w-4 h-4" />
        }
      ]}
    />
  );
}
```

### Floating Widget
```tsx
import { LocalAgentWidget } from '@/components/ai';

function Layout() {
  return (
    <div>
      {/* Your layout content */}
      <LocalAgentWidget />
    </div>
  );
}
```

### Custom Business Context
```tsx
import { useLocalAgent, BusinessPromptBuilder } from '@/components/ai';

function CustomAgent() {
  const { sendMessage } = useLocalAgent({
    systemPrompt: BusinessPromptBuilder.createSystemPrompt({
      currentPage: 'orders',
      selectedOrder: currentOrder
    }).content
  });

  const analyzeOrder = () => {
    const prompt = BusinessPromptBuilder.generateOrderAnalysisPrompt(currentOrder);
    sendMessage(prompt);
  };

  return (
    <button onClick={analyzeOrder}>
      Analyze This Order
    </button>
  );
}
```

## 🛠️ Configuration

### Environment Variables

| Variable | Purpose | Local Value | Remote Value |
| --- | --- | --- | --- |
| `VITE_LM_STUDIO_BASE_URL` | Direct LM Studio endpoint | `http://192.168.3.25:1234` | Internal LM Studio URL / tunnel |
| `VITE_LM_STUDIO_PROXY_URL` | **New:** Supabase/Netlify proxy endpoint that the browser can call | *(leave empty)* | `https://<project>.supabase.co/functions/v1/lm-studio-proxy` |
| `VITE_LM_STUDIO_MODEL` | Default model id | `qwen/qwen3-vl-4b` | same |

> When `VITE_LM_STUDIO_PROXY_URL` is set, the frontend never talks to LM Studio directly.  
> All `/v1/chat/completions` and `/v1/models` requests go through the secure proxy.

### Serverless Proxy (Netlify / Supabase Edge)

1. Deploy the `supabase/functions/lm-studio-proxy` function.
2. Set these secrets for the function:
   - `LM_STUDIO_BASE_URL` – your LM Studio public/tunnel URL  
   - `LM_STUDIO_API_KEY` – optional if LM Studio requires it
3. In Netlify builds, set `VITE_LM_STUDIO_PROXY_URL` to the Supabase function URL.  
4. (Optional) If you prefer Netlify Functions, reuse the same handler logic.

### Customizing the Base URL
```tsx
import { LocalAgentService } from '@/lib/localAgent';

const customAgent = new LocalAgentService({
  baseUrl: 'http://localhost:8080', // Custom port
  timeout: 60000 // Custom timeout
});
```

## 🎨 Styling

The components use your app's existing Tailwind classes and design system:
- Respects dark/light theme
- Uses your color palette
- Follows your spacing and typography

## 🔒 Privacy & Security

- **No External Requests**: Everything runs locally
- **No Data Collection**: No telemetry or analytics
- **Full Control**: You own your models and data
- **Offline Capable**: Works without internet connection

## 🐛 Troubleshooting

### Connection Issues
- Ensure LM Studio is running on localhost:1234
- Check that a model is loaded in LM Studio
- Verify the server is started in LM Studio

### Performance Issues
- Try a smaller model (like Phi-3-mini)
- Adjust temperature and max tokens
- Close other resource-intensive applications

### Model Switching
- Models must be loaded in LM Studio first
- Refresh the model list if new models don't appear
- Some models may require different prompt formats

## 📚 Best Practices

1. **Start Small**: Begin with a lightweight model like Phi-3-mini
2. **Business Context**: Use the business-specific quick actions
3. **Iterative Prompts**: Refine your questions for better responses
4. **Model Selection**: Choose models based on your hardware capabilities
5. **Keep it Running**: Leave LM Studio running for best experience

## 🚀 Advanced Features

### Custom System Prompts
Create specialized prompts for different business functions:

```tsx
const orderAnalysisPrompt = BusinessPromptBuilder.createSystemPrompt({
  currentPage: 'orders',
  selectedOrder: order,
  orderStatistics: stats
});
```

### Streaming Responses
Enable real-time response streaming for better UX:

```tsx
const { streamMessage, isStreaming } = useLocalAgent();

const handleStreamingChat = async (message: string) => {
  await streamMessage(message);
};
```

### Model Health Checking
Monitor your local server status:

```tsx
const { isHealthy, checkHealth } = useLocalAgent();

useEffect(() => {
  const interval = setInterval(checkHealth, 30000);
  return () => clearInterval(interval);
}, []);
```

---

**Made for Classic Offset Printers** - Your private AI assistant for printing business excellence! 🖨️✨
