// src/lib/sharedUtils.ts
// Re-exports from @classic-offset/shared for easier migration
// Components can gradually migrate to import directly from '@classic-offset/shared'

// Formatters
export {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatRelativeTime,
  formatPhone,
  formatFileSize,
  truncateText,
} from '@classic-offset/shared';

// Validators
export {
  isValidEmail,
  isValidPhone,
  isNotEmpty,
  isPositiveNumber,
  isNonNegative,
  isValidUUID,
  validateOrderForm,
  validateCustomerForm,
} from '@classic-offset/shared';

// Constants
export {
  APP_NAME,
  APP_VERSION,
  DATE_FORMATS,
  DEFAULT_TIMEZONE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  STATUS_COLORS,
  getStatusColor,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@classic-offset/shared';

// Error Handling
export {
  ERROR_CODES,
  createAppError,
  parseSupabaseError,
  parseError,
  isAppError,
  isNetworkError,
  isAuthError,
  isErrorCode,
  getErrorMessage,
  logError,
} from '@classic-offset/shared';

// Types
export type {
  AppError,
  ErrorCode,
  ValidationResult,
} from '@classic-offset/shared';
