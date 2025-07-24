import React from 'react';

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message = 'No data available to display', actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="mb-4 opacity-60">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#e5e7eb" />
        <rect x="7" y="9" width="10" height="2" rx="1" fill="#cbd5e1" />
        <rect x="7" y="13" width="6" height="2" rx="1" fill="#cbd5e1" />
      </svg>
      <div className="text-lg font-medium mb-2">{message}</div>
      {actionLabel && onAction && (
        <button
          className="mt-2 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
