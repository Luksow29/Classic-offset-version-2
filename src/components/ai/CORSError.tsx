import React from 'react';
import { AlertTriangle, ExternalLink, Settings, Terminal } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface CORSErrorProps {
  onRetry: () => void;
}

export const CORSError: React.FC<CORSErrorProps> = ({ onRetry }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="p-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
              CORS Configuration Required
            </h3>
            <p className="text-orange-700 dark:text-orange-300 text-sm">
              LM Studio needs to be configured to allow requests from your React app. Follow these steps:
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                LM Studio Configuration
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium">Open LM Studio Settings</p>
                    <p className="text-gray-600 dark:text-gray-400">Go to LM Studio → Preferences/Settings</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium">Enable CORS</p>
                    <p className="text-gray-600 dark:text-gray-400">Look for "CORS" or "Cross-Origin" settings and enable it</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium">Add Allowed Origin</p>
                    <div className="mt-1">
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        http://localhost:5173
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('http://localhost:5173')}
                        className="ml-2 h-6 px-2 text-xs"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <p className="font-medium">Restart LM Studio Server</p>
                    <p className="text-gray-600 dark:text-gray-400">Stop and start the server for changes to take effect</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Alternative: Command Line Launch
              </h4>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                You can also start LM Studio with CORS enabled via command line:
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 font-mono text-xs">
                <code>lms server start --cors-allow-origin="http://localhost:5173"</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('lms server start --cors-allow-origin="http://localhost:5173"')}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Need Help?
              </h4>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  If you can't find CORS settings in LM Studio:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Check LM Studio documentation for your version</li>
                  <li>Look for "Server Settings" or "API Settings"</li>
                  <li>Try updating to the latest LM Studio version</li>
                  <li>Some versions may enable CORS by default</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onRetry} variant="outline" size="sm">
              Test Connection Again
            </Button>
            <Button 
              onClick={() => window.open('https://lmstudio.ai/docs', '_blank')} 
              variant="ghost" 
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              LM Studio Docs
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
