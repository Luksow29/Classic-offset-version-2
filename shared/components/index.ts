// shared/components/index.ts
// Shared components central export

// Status Badge Components
export {
  StatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  type StatusBadgeProps,
} from './StatusBadge';

// Loading Components
export {
  LoadingSpinner,
  LoadingOverlay,
  PageLoader,
  ButtonSpinner,
  type LoadingSpinnerProps,
} from './LoadingSpinner';

// Error Display Components
export {
  ErrorDisplay,
  InlineError,
  EmptyState,
  type ErrorDisplayProps,
} from './ErrorDisplay';

// Dialog Components
export {
  ConfirmDialog,
  useConfirmDialog,
  type ConfirmDialogProps,
} from './ConfirmDialog';
