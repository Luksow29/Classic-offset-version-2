// shared/utils/constants.ts
// Shared constants for both apps

// ============================================
// Application Constants
// ============================================

export const APP_NAME = 'Classic Offset';
export const APP_VERSION = '2.0.0';

// ============================================
// Date/Time Constants
// ============================================

export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_LONG: 'dd MMMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy, HH:mm',
  TIME_ONLY: 'HH:mm',
} as const;

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// ============================================
// Pagination Constants
// ============================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ============================================
// Status Colors
// ============================================

export const STATUS_COLORS = {
  // Order Status Colors
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dark: 'dark:bg-yellow-900/30 dark:text-yellow-300' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', dark: 'dark:bg-blue-900/30 dark:text-blue-300' },
  design: { bg: 'bg-purple-100', text: 'text-purple-800', dark: 'dark:bg-purple-900/30 dark:text-purple-300' },
  printing: { bg: 'bg-orange-100', text: 'text-orange-800', dark: 'dark:bg-orange-900/30 dark:text-orange-300' },
  in_progress: { bg: 'bg-orange-100', text: 'text-orange-800', dark: 'dark:bg-orange-900/30 dark:text-orange-300' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', dark: 'dark:bg-green-900/30 dark:text-green-300' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800', dark: 'dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', dark: 'dark:bg-red-900/30 dark:text-red-300' },
  
  // Payment Status Colors
  paid: { bg: 'bg-green-100', text: 'text-green-800', dark: 'dark:bg-green-900/30 dark:text-green-300' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', dark: 'dark:bg-yellow-900/30 dark:text-yellow-300' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', dark: 'dark:bg-red-900/30 dark:text-red-300' },
  
  // Ticket Status Colors
  open: { bg: 'bg-blue-100', text: 'text-blue-800', dark: 'dark:bg-blue-900/30 dark:text-blue-300' },
  waiting_customer: { bg: 'bg-yellow-100', text: 'text-yellow-800', dark: 'dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', dark: 'dark:bg-green-900/30 dark:text-green-300' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-800', dark: 'dark:bg-gray-900/30 dark:text-gray-300' },
  
  // Priority Colors
  low: { bg: 'bg-gray-100', text: 'text-gray-800', dark: 'dark:bg-gray-900/30 dark:text-gray-300' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-800', dark: 'dark:bg-blue-900/30 dark:text-blue-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', dark: 'dark:bg-orange-900/30 dark:text-orange-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-800', dark: 'dark:bg-red-900/30 dark:text-red-300' },

  // Default
  default: { bg: 'bg-gray-100', text: 'text-gray-800', dark: 'dark:bg-gray-900/30 dark:text-gray-300' },
} as const;

/**
 * Get color classes for a status
 */
export function getStatusColor(status: string): { bg: string; text: string; dark: string } {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
}

// ============================================
// Status Display Labels
// ============================================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  design: 'Design',
  printing: 'Printing',
  in_progress: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  // Legacy labels
  Pending: 'Pending',
  Design: 'Design',
  Printing: 'Printing',
  Delivered: 'Delivered',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_customer: 'Waiting for Customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/**
 * Get display label for a status
 */
export function getStatusLabel(status: string, type: 'order' | 'payment' | 'ticket' | 'priority' = 'order'): string {
  const labels = {
    order: ORDER_STATUS_LABELS,
    payment: PAYMENT_STATUS_LABELS,
    ticket: TICKET_STATUS_LABELS,
    priority: PRIORITY_LABELS,
  };

  return labels[type][status] || status;
}

// ============================================
// Routes Constants
// ============================================

export const ADMIN_ROUTES = {
  HOME: '/',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  PAYMENTS: '/payments',
  INVOICES: '/invoices',
  MATERIALS: '/materials',
  PRODUCTS: '/products',
  STAFF: '/staff',
  USERS: '/users',
  SETTINGS: '/settings',
  REPORTS: '/reports',
  INSIGHTS: '/insights',
  SUPPORT: '/customer-support',
  ORDER_CHAT: '/order-chat-admin',
  ADMIN_CONTENT: '/admin/content',
} as const;

export const CUSTOMER_ROUTES = {
  HOME: '/customer-portal',
  ORDERS: '/customer-portal/orders',
  REQUESTS: '/customer-portal/requests',
  NEW_REQUEST: '/customer-portal/new-request',
  INVOICES: '/customer-portal/invoices',
  SUPPORT: '/customer-portal/support',
  PROFILE: '/customer-portal/profile',
  NOTIFICATIONS: '/customer-portal/notifications',
  SHOWCASE: '/customer-portal/showcase',
} as const;

// ============================================
// API Constants
// ============================================

export const API_TIMEOUT = 30000; // 30 seconds
export const REALTIME_EVENTS_PER_SECOND = 10;

// ============================================
// File Upload Constants
// ============================================

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ============================================
// Notification Constants
// ============================================

export const NOTIFICATION_CATEGORIES = ['orders', 'payments', 'messages', 'system'] as const;

export const NOTIFICATION_SOUNDS = {
  NEW_MESSAGE: '/sounds/notification.mp3',
  ORDER_UPDATE: '/sounds/order-update.mp3',
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sb-auth-token',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
  NOTIFICATION_PREFERENCES: 'notification-preferences',
  LAST_VISITED_PAGE: 'last-visited-page',
} as const;
