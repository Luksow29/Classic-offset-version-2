import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No data available to display',
  description,
  actionLabel,
  onAction,
  icon: Icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <div className="mb-4 opacity-60 bg-gray-100 p-4 rounded-full dark:bg-gray-800">
        {Icon ? (
          <Icon size={32} className="text-gray-400" />
        ) : (
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="text-gray-300">
            <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" />
            <rect x="7" y="9" width="10" height="2" rx="1" fill="#cbd5e1" />
            <rect x="7" y="13" width="6" height="2" rx="1" fill="#cbd5e1" />
          </svg>
        )}
      </div>
      <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{message}</div>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>}

      {actionLabel && onAction && (
        <button
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow-sm"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
