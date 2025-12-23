// shared/utils/validators.ts
// Shared validation utilities for both apps

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Indian phone number regex (10 digits, optionally with +91)
 */
const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

/**
 * Validate email address
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validate that a value is not empty
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate that a number is positive
 */
export function isPositiveNumber(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && !isNaN(value) && value > 0;
}

/**
 * Validate that a number is non-negative
 */
export function isNonNegative(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && !isNaN(value) && value >= 0;
}

/**
 * Validate date is not in the past
 */
export function isNotPastDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj >= today;
}

/**
 * Validate date is a valid date
 */
export function isValidDate(date: string | null | undefined): boolean {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Validate string length within range
 */
export function isLengthInRange(
  value: string | null | undefined,
  min: number,
  max: number
): boolean {
  if (!value) return min === 0;
  return value.length >= min && value.length <= max;
}

/**
 * Validate number within range
 */
export function isInRange(
  value: number | null | undefined,
  min: number,
  max: number
): boolean {
  if (value === null || value === undefined || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============================================
// Form Validation Types
// ============================================

export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate an object against a set of rules
 */
export function validateObject<T extends Record<string, unknown>>(
  data: T,
  rules: Record<keyof T, ValidationRule<T[keyof T]>[]>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const field in rules) {
    const fieldRules = rules[field];
    const value = data[field];

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// Common Validation Rules
// ============================================

export const commonRules = {
  required: (message = 'This field is required'): ValidationRule<string | null | undefined> => ({
    validate: isNotEmpty,
    message,
  }),

  email: (message = 'Please enter a valid email'): ValidationRule<string | null | undefined> => ({
    validate: isValidEmail,
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string | null | undefined> => ({
    validate: isValidPhone,
    message,
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule<number | null | undefined> => ({
    validate: isPositiveNumber,
    message,
  }),

  nonNegative: (message = 'Cannot be negative'): ValidationRule<number | null | undefined> => ({
    validate: isNonNegative,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string | null | undefined> => ({
    validate: (value) => isLengthInRange(value, min, Infinity),
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string | null | undefined> => ({
    validate: (value) => isLengthInRange(value, 0, max),
    message: message || `Must be at most ${max} characters`,
  }),

  futureDate: (message = 'Date must be in the future'): ValidationRule<string | null | undefined> => ({
    validate: isNotPastDate,
    message,
  }),

  validDate: (message = 'Please enter a valid date'): ValidationRule<string | null | undefined> => ({
    validate: isValidDate,
    message,
  }),
};

// ============================================
// Order Validation
// ============================================

export interface OrderFormData {
  customer_name: string;
  order_type: string;
  quantity: number;
  rate: number;
  delivery_date?: string;
}

export function validateOrderForm(data: OrderFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.customer_name)) {
    errors.customer_name = 'Customer name is required';
  }

  if (!isNotEmpty(data.order_type)) {
    errors.order_type = 'Order type is required';
  }

  if (!isPositiveNumber(data.quantity)) {
    errors.quantity = 'Quantity must be positive';
  }

  if (!isNonNegative(data.rate)) {
    errors.rate = 'Rate cannot be negative';
  }

  if (data.delivery_date && !isValidDate(data.delivery_date)) {
    errors.delivery_date = 'Invalid delivery date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// Customer Validation
// ============================================

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
}

export function validateCustomerForm(data: CustomerFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'Name is required';
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Invalid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
