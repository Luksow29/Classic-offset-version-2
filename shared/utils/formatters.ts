// shared/utils/formatters.ts
// Shared formatting utilities for both apps

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(
  value: number | null | undefined,
  options: { showSymbol?: boolean; decimals?: number } = {}
): string {
  const { showSymbol = true, decimals = 2 } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return formatted;
}

/**
 * Format currency with compact notation for large numbers
 * e.g., ₹1.5L, ₹25K
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '₹0';
  }

  if (value >= 10000000) { // 1 Crore
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) { // 1 Lakh
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) { // 1 Thousand
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return formatCurrency(value, { decimals: 0 });
}

/**
 * Format a date string to display format
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: { format?: 'short' | 'long' | 'relative' | 'iso'; includeTime?: boolean } = {}
): string {
  const { format = 'short', includeTime = false } = options;

  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  switch (format) {
    case 'iso':
      return dateObj.toISOString().split('T')[0];

    case 'relative':
      return formatRelativeTime(dateObj);

    case 'long':
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
      }).format(dateObj);

    case 'short':
    default:
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
      }).format(dateObj);
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Past times
  if (diffMs >= 0) {
    if (diffSeconds < 60) {
      return 'just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  // Future times
  const absDiffMs = Math.abs(diffMs);
  const absDiffSeconds = Math.floor(absDiffMs / 1000);
  const absDiffMinutes = Math.floor(absDiffSeconds / 60);
  const absDiffHours = Math.floor(absDiffMinutes / 60);
  const absDiffDays = Math.floor(absDiffHours / 24);

  if (absDiffSeconds < 60) {
    return 'in a moment';
  }
  if (absDiffMinutes < 60) {
    return `in ${absDiffMinutes} minute${absDiffMinutes === 1 ? '' : 's'}`;
  }
  if (absDiffHours < 24) {
    return `in ${absDiffHours} hour${absDiffHours === 1 ? '' : 's'}`;
  }
  if (absDiffDays < 7) {
    return `in ${absDiffDays} day${absDiffDays === 1 ? '' : 's'}`;
  }
  if (absDiffDays < 30) {
    const weeks = Math.floor(absDiffDays / 7);
    return `in ${weeks} week${weeks === 1 ? '' : 's'}`;
  }

  return formatDate(dateObj, { format: 'short' });
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Indian phone number formatting
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format order ID with padding
 */
export function formatOrderId(id: number | string, prefix: string = '#'): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return `${prefix}${numId.toString().padStart(4, '0')}`;
}

/**
 * Format quantity with unit
 */
export function formatQuantity(
  quantity: number | null | undefined,
  unit?: string
): string {
  if (quantity === null || quantity === undefined) {
    return '-';
  }

  const formatted = new Intl.NumberFormat('en-IN').format(quantity);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get initials from name
 */
export function getInitials(name: string | null | undefined, maxLength: number = 2): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
}
