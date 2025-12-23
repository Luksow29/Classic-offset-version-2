/**
 * Classic Offset - Shared Package
 * Central export for all shared code between main app and customer portal
 * 
 * @packageDocumentation
 */

// ============================================
// Types & Enums
// ============================================
export {
  // Status Constants & Types
  ORDER_STATUS,
  type OrderStatus,
  LEGACY_ORDER_STATUS,
  type LegacyOrderStatus,
  type AnyOrderStatus,
  PRICING_STATUS,
  type PricingStatus,
  REQUEST_STATUS,
  type RequestStatus,
  PAYMENT_STATUS,
  type PaymentStatus,
  PAYMENT_METHOD,
  type PaymentMethod,
  NOTIFICATION_TYPE,
  type NotificationType,
  TICKET_STATUS,
  type TicketStatus,
  TICKET_PRIORITY,
  type TicketPriority,
  USER_ROLE,
  type UserRole,
  
  // Database Types
  type Json,
  type Customer,
  type Order,
  type OrderRequest,
  type Payment,
  type User,
  type Employee,
  type Material,
  type Product,
  type Notification,
  type NotificationPreferences,
  type PushSubscription,
  type SupportTicket,
  type SupportMessage,
  type OrderChatThread,
  type OrderChatMessage,
  type OrderTimelineEvent,
  type CustomerSummary,
  type AllOrderSummary,
  type OrdersTableOrder,
  type SupportTicketSummary,
  
  // Timeline Types (from order-timeline)
  type TimelineEventTypeLiteral,
  type ActorTypeLiteral,
  type TimelineEvent,
} from './types';

// ============================================
// API Utilities
// ============================================
export {
  // Supabase Client
  createAppSupabaseClient,
  getSupabase,
  resetSupabaseClient,
  isSupabaseConfigured,
  getSupabaseUrl,
  type SupabaseClientConfig,
  type SupabaseClient,
  type Session,
  type AuthUser,
  
  // Orders API
  getCustomerOrders,
  getOrder,
  getAllOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getCustomerOrderRequests,
  getPendingOrderRequests,
  createOrderRequest,
  updateOrderRequest,
  updateRequestPricingStatus,
  approveOrderRequest,
  rejectOrderRequest,
  getOrderSummaryWithDues,
  calculateOrderTotals,
  toOrdersTableFormat,
  
  // Customers API
  getCustomer,
  getCustomerByUserId,
  getAllCustomers,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSummary,
  getAllCustomerSummaries,
  getCustomerStats,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  formatCustomerName,
  getCustomerInitials,
  
  // Notifications API
  sendNotification,
  sendBulkNotification,
  sendOrderUpdateNotification,
  sendPaymentNotification,
  sendQuoteNotification,
  sendDeliveryNotification,
  sendMessageNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type SendNotificationParams,
  type SendNotificationResult,
} from './api';

// ============================================
// Hooks
// ============================================
export {
  // Realtime Hooks
  useRealtimeNotifications,
  useRealtimeOrders,
  
  // Auth Hook
  useAuth,
} from './hooks';

// ============================================
// Utilities
// ============================================
export {
  // Formatters
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatRelativeTime,
  formatPhone,
  formatFileSize,
  truncateText,
  
  // Validators
  isValidEmail,
  isValidPhone,
  isNotEmpty,
  isPositiveNumber,
  isNonNegative,
  isValidUUID,
  validateOrderForm,
  validateCustomerForm,
  type ValidationResult,
  
  // Constants
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
  
  // Error Handling
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
} from './utils';

// ============================================
// Components
// ============================================
export {
  // Status Badges
  StatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  type StatusBadgeProps,
  
  // Loading States
  LoadingSpinner,
  LoadingOverlay,
  PageLoader,
  ButtonSpinner,
  type LoadingSpinnerProps,
  
  // Error Display
  ErrorDisplay,
  InlineError,
  EmptyState,
  type ErrorDisplayProps,
  
  // Dialogs
  ConfirmDialog,
  useConfirmDialog,
  type ConfirmDialogProps,
} from './components';
