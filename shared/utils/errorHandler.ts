// shared/utils/errorHandler.ts
// Centralized error handling utilities

/**
 * Standard error structure for API responses
 */
export interface AppError {
  code: string;
  message: string;
  details?: string;
  field?: string;
  originalError?: unknown;
}

/**
 * Error codes used across the application
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  
  // Validation errors
  VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  
  // Database errors
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  DB_DUPLICATE: 'DB_DUPLICATE',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  
  // Permission errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED]: 'Please confirm your email address before signing in.',
  [ERROR_CODES.VALIDATION_REQUIRED]: 'This field is required.',
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format.',
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 'Value is out of acceptable range.',
  [ERROR_CODES.DB_NOT_FOUND]: 'The requested item was not found.',
  [ERROR_CODES.DB_DUPLICATE]: 'This item already exists.',
  [ERROR_CODES.DB_CONSTRAINT_VIOLATION]: 'This operation violates data constraints.',
  [ERROR_CODES.DB_CONNECTION_ERROR]: 'Unable to connect to the database. Please try again.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ERROR_CODES.NETWORK_TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ERROR_CODES.OPERATION_FAILED]: 'Operation failed. Please try again.',
};

/**
 * Create a standardized AppError
 */
export function createAppError(
  code: ErrorCode,
  details?: string,
  field?: string,
  originalError?: unknown
): AppError {
  return {
    code,
    message: ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details,
    field,
    originalError,
  };
}

/**
 * Parse Supabase error to AppError
 */
export function parseSupabaseError(error: { message?: string; code?: string; details?: string }): AppError {
  const message = error.message || '';
  const code = error.code || '';

  // Auth errors
  if (message.includes('Invalid login credentials')) {
    return createAppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }
  if (message.includes('JWT expired') || message.includes('session_expired')) {
    return createAppError(ERROR_CODES.AUTH_SESSION_EXPIRED);
  }
  if (message.includes('Email not confirmed')) {
    return createAppError(ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED);
  }
  if (code === '42501' || message.includes('permission denied')) {
    return createAppError(ERROR_CODES.PERMISSION_DENIED);
  }

  // Database errors
  if (code === 'PGRST116' || message.includes('not found')) {
    return createAppError(ERROR_CODES.DB_NOT_FOUND);
  }
  if (code === '23505' || message.includes('duplicate')) {
    return createAppError(ERROR_CODES.DB_DUPLICATE);
  }
  if (code === '23503' || code === '23514' || message.includes('constraint')) {
    return createAppError(ERROR_CODES.DB_CONSTRAINT_VIOLATION, error.details);
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return createAppError(ERROR_CODES.NETWORK_ERROR);
  }

  // Default
  return createAppError(ERROR_CODES.UNKNOWN_ERROR, message, undefined, error);
}

/**
 * Parse any error to AppError
 */
export function parseError(error: unknown): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Supabase error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return parseSupabaseError(error as { message?: string; code?: string; details?: string });
  }

  // Error instance
  if (error instanceof Error) {
    return createAppError(ERROR_CODES.UNKNOWN_ERROR, error.message, undefined, error);
  }

  // String error
  if (typeof error === 'string') {
    return createAppError(ERROR_CODES.UNKNOWN_ERROR, error);
  }

  // Unknown
  return createAppError(ERROR_CODES.UNKNOWN_ERROR, String(error), undefined, error);
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Get user-friendly message for an error
 */
export function getErrorMessage(error: unknown): string {
  const appError = parseError(error);
  return appError.message;
}

/**
 * Check if error is a specific type
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  const appError = parseError(error);
  return appError.code === code;
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  const appError = parseError(error);
  return appError.code.startsWith('AUTH_');
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: unknown): boolean {
  const appError = parseError(error);
  return appError.code.startsWith('NETWORK_');
}

/**
 * Log error with context (for debugging)
 */
export function logError(
  error: unknown,
  context?: { component?: string; action?: string; data?: unknown }
): void {
  const appError = parseError(error);
  
  const logData: Record<string, unknown> = {
    code: appError.code,
    message: appError.message,
    details: appError.details,
  };
  
  if (context) {
    logData.context = context;
  }
  
  if (appError.originalError) {
    logData.originalError = appError.originalError;
  }
  
  console.error('[Error]', logData);
}

/**
 * Error boundary helper for async operations
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = parseError(error);
    logError(error);
    return { data: fallback ?? null, error: appError };
  }
}
