import React, { useState } from 'react';
import { ChevronDown, Cpu, RefreshCw, Check } from 'lucide-react';
import { localAgent } from '../../lib/localAgent';
import Button from '../ui/Button';

interface ModelSelectorProps {
  currentModel: string;
  availableModels: string[];
  onModelChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  availableModels,
  onModelChange,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [models, setModels] = useState<string[]>(availableModels);

  const refreshModels = async () => {
    setIsRefreshing(true);
    try {
      const freshModels = await localAgent.getModels();
      setModels(freshModels);
    } catch (error) {
      console.error('Failed to refresh models:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleModelSelect = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  const formatModelName = (model: string) => {
    // Clean up model names for display
    return model.replace(/^.*\//, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getModelInfo = (model: string) => {
    // Extract model type and size information
    const modelLower = model.toLowerCase();
    let type = 'Unknown';
    let size = '';

    if (modelLower.includes('qwen')) type = 'Qwen';
    else if (modelLower.includes('llama')) type = 'Llama';
    else if (modelLower.includes('mistral')) type = 'Mistral';
    else if (modelLower.includes('phi')) type = 'Phi';
    else if (modelLower.includes('gemma')) type = 'Gemma';

    if (modelLower.includes('7b')) size = '7B';
    else if (modelLower.includes('13b')) size = '13B';
    else if (modelLower.includes('3b')) size = '3B';
    else if (modelLower.includes('1b')) size = '1B';
    else if (modelLower.includes('4b')) size = '4B';

    return { type, size };
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span className="truncate">{formatModelName(currentModel)}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Available Models</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshModels}
                  disabled={isRefreshing}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="py-1">
              {models.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No models available. Make sure LM Studio is running with a loaded model.
                </div>
              ) : (
                models.map((model) => {
                  const { type, size } = getModelInfo(model);
                  const isSelected = model === currentModel;

                  return (
                    <button
                      key={model}
                      onClick={() => handleModelSelect(model)}
                      className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {formatModelName(model)}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{type}</span>
                          {size && (
                            <>
                              <span>•</span>
                              <span>{size} params</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {models.length > 0 && (
              <div className="p-2 border-t border-border text-xs text-muted-foreground">
                <p>Models are loaded from LM Studio. Refresh to see newly loaded models.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
