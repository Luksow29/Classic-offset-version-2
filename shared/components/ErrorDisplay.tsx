// shared/components/ErrorDisplay.tsx
// Universal error display component

import React from 'react';
import type { AppError } from '../utils/errorHandler';

export interface ErrorDisplayProps {
  error: Error | AppError | string | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'page' | 'toast';
  className?: string;
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: Error | AppError | string | null): string {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  if ('message' in error) return error.message;
  return 'An unknown error occurred';
}

/**
 * Get error details if available
 */
function getErrorDetails(error: Error | AppError | string | null): string | undefined {
  if (!error || typeof error === 'string') return undefined;
  if ('details' in error && typeof error.details === 'string') {
    return error.details;
  }
  return undefined;
}

// Variant styles
const VARIANT_STYLES = {
  inline: {
    container: 'p-4 rounded-lg border',
    colors: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    detailsColor: 'text-red-600 dark:text-red-300',
  },
  banner: {
    container: 'p-4 rounded-none',
    colors: 'bg-red-600 dark:bg-red-700',
    textColor: 'text-white',
    detailsColor: 'text-red-100',
  },
  page: {
    container: 'p-8 rounded-xl text-center max-w-md mx-auto',
    colors: 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    detailsColor: 'text-red-600 dark:text-red-300',
  },
  toast: {
    container: 'p-3 rounded-lg shadow-lg',
    colors: 'bg-red-600',
    textColor: 'text-white',
    detailsColor: 'text-red-100',
  },
};

/**
 * Error icon SVG
 */
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Close icon SVG
 */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * Universal error display component
 * Works with Tailwind CSS
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Error',
  onRetry,
  onDismiss,
  variant = 'inline',
  className = '',
}) => {
  if (!error) return null;

  const message = getErrorMessage(error);
  const details = getErrorDetails(error);
  const styles = VARIANT_STYLES[variant];

  if (variant === 'page') {
    return (
      <div className={`${styles.container} ${styles.colors} ${className}`}>
        <ErrorIcon className={`h-12 w-12 mx-auto mb-4 ${styles.textColor}`} />
        <h2 className={`text-xl font-semibold mb-2 ${styles.textColor}`}>
          {title}
        </h2>
        <p className={`mb-4 ${styles.textColor}`}>{message}</p>
        {details && (
          <p className={`text-sm mb-4 ${styles.detailsColor}`}>{details}</p>
        )}
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${styles.colors} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <ErrorIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.textColor}`} />
        <div className="flex-1 min-w-0">
          {title && variant !== 'toast' && (
            <h3 className={`font-semibold ${styles.textColor}`}>{title}</h3>
          )}
          <p className={`text-sm ${styles.textColor}`}>{message}</p>
          {details && (
            <p className={`text-xs mt-1 ${styles.detailsColor}`}>{details}</p>
          )}
          {onRetry && variant === 'inline' && (
            <button
              onClick={onRetry}
              className={`mt-2 text-sm underline hover:no-underline ${styles.textColor}`}
            >
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${styles.textColor} hover:opacity-70`}
            aria-label="Dismiss"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Inline error message (minimal)
 */
export const InlineError: React.FC<{
  message: string | null | undefined;
  className?: string;
}> = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <p className={`text-sm text-red-600 dark:text-red-400 ${className}`}>
      {message}
    </p>
  );
};

/**
 * Empty state display
 */
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ title, description, icon, action, className = '' }) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
