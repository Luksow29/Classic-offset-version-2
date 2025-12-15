import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { localAgent } from '../../lib/localAgent';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface LocalAgentSettingsProps {
  className?: string;
  onConfigChange?: (baseUrl: string, isHealthy: boolean) => void;
}

export const LocalAgentSettings: React.FC<LocalAgentSettingsProps> = ({
  className = '',
  onConfigChange,
}) => {
  const [baseUrl, setBaseUrl] = useState(() => localAgent.getConfig().baseUrl);
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const commonUrls = [
    'http://localhost:1234',
    'http://127.0.0.1:1234',
    'http://192.168.1.32:1234',
  ];

  const checkConnection = useCallback(async (url?: string) => {
    const targetUrl = url || baseUrl;
    setIsChecking(true);
    
    try {
      // Update the service URL
      localAgent.updateBaseUrl(targetUrl);
      
      // Check health
      const healthy = await localAgent.isHealthy();
      setIsHealthy(healthy);
      setLastCheck(new Date());
      
      // Update parent component
      onConfigChange?.(targetUrl, healthy);
      
      return healthy;
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsHealthy(false);
      onConfigChange?.(targetUrl, false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [baseUrl, onConfigChange]);

  const handleUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
  };

  const handleQuickConnect = async (url: string) => {
    setBaseUrl(url);
    await checkConnection(url);
  };

  useEffect(() => {
    // Initial connection check
    checkConnection();
  }, [checkConnection]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Local Agent Configuration</h3>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Wifi className="w-5 h-5" />
                <span className="font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <WifiOff className="w-5 h-5" />
                <span className="font-medium">Disconnected</span>
              </div>
            )}
            {lastCheck && (
              <span className="text-sm text-muted-foreground">
                Last checked: {lastCheck.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkConnection()}
            disabled={isChecking}
          >
            {isChecking ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Server URL Configuration */}
        <div className="space-y-3">
          <label className="text-sm font-medium">LM Studio Server URL</label>
          <div className="flex gap-2">
            <Input
              value={baseUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="http://localhost:1234"
              className="flex-1"
            />
            <Button
              onClick={() => checkConnection()}
              disabled={isChecking}
              variant={isHealthy ? 'primary' : 'outline'}
            >
              Test
            </Button>
          </div>
        </div>

        {/* Quick Connect Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quick Connect</label>
          <div className="grid grid-cols-2 gap-2">
            {commonUrls.map((url) => (
              <Button
                key={url}
                variant="outline"
                size="sm"
                onClick={() => handleQuickConnect(url)}
                disabled={isChecking}
                className={`justify-start text-xs ${
                  baseUrl === url ? 'bg-muted' : ''
                }`}
              >
                {url.replace('http://', '')}
              </Button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Connection Instructions:
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>1. Make sure LM Studio is running</p>
            <p>2. Load a model in the Chat tab</p>
            <p>3. Click "Start Server" in LM Studio</p>
            <p>4. Note the server URL (usually localhost:1234)</p>
            <p>5. Update the URL above if different</p>
          </div>
        </div>

        {/* CORS Help */}
        {!isHealthy && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Connection Issues?
            </h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <p>• Check if LM Studio server is running</p>
              <p>• Try using your computer's IP address instead of localhost</p>
              <p>• Make sure no firewall is blocking the connection</p>
              <p>• Restart LM Studio if needed</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
