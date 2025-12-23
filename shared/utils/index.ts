/**
 * Shared Utilities - Central Export
 * Common utility functions for both main app and customer portal
 */

// Formatters
export {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatRelativeTime,
  formatPhone,
  formatFileSize,
  truncateText,
} from './formatters';

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
  type ValidationResult,
} from './validators';

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
} from './constants';

// Error Handler
export {
  type AppError,
  ERROR_CODES,
  type ErrorCode,
  createAppError,
  parseSupabaseError,
  parseError,
  isAppError,
  isNetworkError,
  isAuthError,
  isErrorCode,
  getErrorMessage,
  logError,
} from './errorHandler';
