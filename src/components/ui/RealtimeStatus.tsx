// src/components/ui/RealtimeStatus.tsx
import React from 'react';
import { useRealtime } from '@/context/RealtimeContext';
import { Wifi, WifiOff, Users, Activity } from 'lucide-react';

interface RealtimeStatusProps {
  showDetails?: boolean;
  className?: string;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { isConnected, connectionStatus, activeUsers, lastActivity } = useRealtime();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`} title={getStatusText()}>
        {getStatusIcon()}
        {isConnected && activeUsers > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{activeUsers - 1}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Users className="w-3 h-3" />
          <span>{activeUsers}</span>
        </div>
      </div>
      
      {lastActivity && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last activity: {lastActivity.toLocaleTimeString()}
        </div>
      )}
      
      {connectionStatus === 'connected' && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 dark:text-green-400">Live updates active</span>
        </div>
      )}
    </div>
  );
};

export default RealtimeStatus;
