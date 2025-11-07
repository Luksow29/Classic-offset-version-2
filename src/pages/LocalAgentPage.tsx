import React, { useState } from 'react';
import { LocalAgent } from '../components/ai/LocalAgent';
import { LocalAgentRAG } from '../components/ai/LocalAgentRAG';
import { LocalAgentSettings } from '../components/ai/LocalAgentSettings';
import { defaultQuickActions } from '../components/ai/BusinessContext';
import { Bot, Sparkles, Zap, Info, MessageSquare, SlidersHorizontal, Database } from 'lucide-react';
import Card from '../components/ui/Card';

const LocalAgentPage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState({ url: '', isHealthy: false });
  const tabs = [
    { id: 'information', label: 'Information', icon: Info },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'control', label: 'Control', icon: SlidersHorizontal },
  ];
  const [activeTab, setActiveTab] = useState<'information' | 'chat' | 'control'>('information');

  // Business-specific quick actions for the main page
  const businessQuickActions = defaultQuickActions.map(action => ({
    label: action.label,
    prompt: action.prompt(),
    icon: typeof action.icon === 'string' 
      ? <span className="text-base">{action.icon}</span> 
      : <Bot className="w-4 h-4" />
  }));

  const handleConfigChange = (baseUrl: string, isHealthy: boolean) => {
    setConnectionStatus({ url: baseUrl, isHealthy });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="space-y-6">
            <LocalAgentRAG 
              showModelSelector={true}
            />
          </div>
        );
      case 'control':
        return (
          <div className="space-y-6">
            <LocalAgentSettings 
              onConfigChange={handleConfigChange}
            />
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Connection Overview
              </h3>
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">Server URL:</span> {connectionStatus.url || 'http://192.168.3.25:1234'}</p>
                <p className="flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 rounded-full ${connectionStatus.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                  {connectionStatus.isHealthy ? 'Connection looks good' : 'Connection not established yet'}
                </p>
                <p className="text-muted-foreground">
                  Update the server URL, test connectivity, and manage quick-connect options from the panel above.
                </p>
              </div>
            </Card>
          </div>
        );
      case 'information':
      default:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Local Agent
                  </h1>
                  <p className="text-muted-foreground">
                    Your private AI assistant powered by LM Studio
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Offline & Private</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  All conversations stay on your machine. No data sent to external servers.
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Business-Focused</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Specialized prompts and actions for printing business operations.
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">No API Costs</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use your own models with no usage limits or subscription fees.
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Getting Started
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { title: 'Download and Install LM Studio', description: 'Get LM Studio from lmstudio.ai and install it on your machine.' },
                  { title: 'Load a Model', description: 'Download and load a model like Qwen, Llama, or Mistral in LM Studio.' },
                  { title: 'Start Local Server', description: 'Click "Start Server" in LM Studio - it should run on your network IP (like 192.168.3.25:1234).' },
                  { title: 'Configure Connection', description: 'Use the Control tab to test and configure your LM Studio server connection.' },
                  { title: 'Start Chatting!', description: 'Once connected, the Local Agent will be ready to help with your printing business.' },
                ].map((item, index) => (
                  <div className="flex items-start gap-3" key={item.title}>
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 text-center text-sm text-muted-foreground space-y-2">
              <p>Local Agent connects to your LM Studio server at {connectionStatus.url || '192.168.3.25:1234'}</p>
              <p>All conversations are private and stay on your machine</p>
              {connectionStatus.isHealthy && (
                <p className="text-green-600 dark:text-green-400 font-medium">✓ Connected and ready to chat!</p>
              )}
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Local AI Agent</p>
          <h1 className="text-3xl font-bold">Work the way you prefer</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Switch between Information, Chat, and Control panels to keep the experience focused and professional.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full border transition ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/40'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
};

export default LocalAgentPage;
