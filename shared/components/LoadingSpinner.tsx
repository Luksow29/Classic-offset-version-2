// shared/components/LoadingSpinner.tsx
// Universal loading spinner component

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'current';
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

// Size mappings
const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

// Color mappings
const COLOR_CLASSES = {
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-gray-600 dark:text-gray-400',
  white: 'text-white',
  current: 'text-current',
};

/**
 * SVG Spinner icon
 */
const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`animate-spin ${className || ''}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Universal loading spinner component
 * Works with Tailwind CSS
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label,
  fullScreen = false,
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const colorClass = COLOR_CLASSES[color];

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <SpinnerIcon className={`${sizeClass} ${colorClass}`} />
      {label && (
        <span className={`text-sm ${colorClass}`}>{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Loading overlay for containers
 */
export const LoadingOverlay: React.FC<{
  loading: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ loading, label, children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-lg">
          <LoadingSpinner size="lg" label={label} />
        </div>
      )}
    </div>
  );
};

/**
 * Page-level loading state
 */
export const PageLoader: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="xl" label={message} />
    </div>
  );
};

/**
 * Button loading state (inline spinner)
 */
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <SpinnerIcon className={`h-4 w-4 text-current ${className}`} />
  );
};

export default LoadingSpinner;
