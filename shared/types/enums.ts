// shared/types/enums.ts
// Centralized enum definitions for both Main App and Customer Portal

/**
 * Order status values used across the application
 * These match the database constraints
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DESIGN: 'design',
  PRINTING: 'printing',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Legacy status values (for backwards compatibility)
export const LEGACY_ORDER_STATUS = {
  Pending: 'Pending',
  Design: 'Design',
  Printing: 'Printing',
  Delivered: 'Delivered',
} as const;

export type LegacyOrderStatus = typeof LEGACY_ORDER_STATUS[keyof typeof LEGACY_ORDER_STATUS];

// All possible status values
export type AnyOrderStatus = OrderStatus | LegacyOrderStatus;

/**
 * Order request pricing status
 */
export const PRICING_STATUS = {
  PENDING: 'pending',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  APPROVED: 'approved',
} as const;

export type PricingStatus = typeof PRICING_STATUS[keyof typeof PRICING_STATUS];

/**
 * Order request status
 */
export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

/**
 * Payment status values
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

/**
 * Payment method values
 */
export const PAYMENT_METHOD = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  OTHER: 'other',
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

/**
 * Notification types
 */
export const NOTIFICATION_TYPE = {
  ORDER_UPDATE: 'order_update',
  PAYMENT_RECEIVED: 'payment_received',
  QUOTE_READY: 'quote_ready',
  DELIVERY_UPDATE: 'delivery_update',
  MESSAGE: 'message',
  SYSTEM_ALERT: 'system_alert',
  SUPPORT_MESSAGE: 'support_message',
  ORDER_CHAT_MESSAGE: 'order_chat_message',
  ORDER_REQUEST: 'order_request',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

/**
 * Support ticket status
 */
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING: 'waiting_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

/**
 * Support ticket priority
 */
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];

/**
 * User/Staff roles
 */
export const USER_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  DESIGNER: 'designer',
  VIEWER: 'viewer',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

/**
 * Customer types
 */
export const CUSTOMER_TYPE = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  WHOLESALE: 'wholesale',
  RETAIL: 'retail',
} as const;

export type CustomerType = typeof CUSTOMER_TYPE[keyof typeof CUSTOMER_TYPE];

/**
 * Communication preferences
 */
export const COMMUNICATION_PREFERENCE = {
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  PHONE: 'phone',
  ALL: 'all',
} as const;

export type CommunicationPreference = typeof COMMUNICATION_PREFERENCE[keyof typeof COMMUNICATION_PREFERENCE];

/**
 * Service charge types
 */
export const SERVICE_CHARGE_TYPE = {
  NONE: 'none',
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  CUSTOM: 'custom',
} as const;

export type ServiceChargeType = typeof SERVICE_CHARGE_TYPE[keyof typeof SERVICE_CHARGE_TYPE];

/**
 * Order timeline event types
 */
export const TIMELINE_EVENT_TYPE = {
  ORDER_CREATED: 'order_created',
  STATUS_UPDATE: 'status_update',
  CHAT_MESSAGE: 'chat_message',
  PAYMENT_RECORDED: 'payment_recorded',
} as const;

export type TimelineEventType = typeof TIMELINE_EVENT_TYPE[keyof typeof TIMELINE_EVENT_TYPE];

/**
 * Actor types for timeline events
 */
export const ACTOR_TYPE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SYSTEM: 'system',
  UNKNOWN: 'unknown',
} as const;

export type ActorType = typeof ACTOR_TYPE[keyof typeof ACTOR_TYPE];

/**
 * Sort order
 */
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

/**
 * Sort fields for orders
 */
export const ORDER_SORT_FIELD = {
  ORDER_ID: 'order_id',
  CUSTOMER_NAME: 'customer_name',
  DATE: 'date',
  DELIVERY_DATE: 'delivery_date',
  TOTAL_AMOUNT: 'total_amount',
  STATUS: 'status',
} as const;

export type OrderSortField = typeof ORDER_SORT_FIELD[keyof typeof ORDER_SORT_FIELD];

// Helper to check if status is valid
export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return Object.values(ORDER_STATUS).includes(status as OrderStatus);
};

// Helper to normalize legacy status to new status
export const normalizeOrderStatus = (status: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    'Pending': ORDER_STATUS.PENDING,
    'pending': ORDER_STATUS.PENDING,
    'Design': ORDER_STATUS.DESIGN,
    'design': ORDER_STATUS.DESIGN,
    'Printing': ORDER_STATUS.PRINTING,
    'printing': ORDER_STATUS.PRINTING,
    'in_progress': ORDER_STATUS.IN_PROGRESS,
    'Delivered': ORDER_STATUS.DELIVERED,
    'delivered': ORDER_STATUS.DELIVERED,
    'completed': ORDER_STATUS.COMPLETED,
    'confirmed': ORDER_STATUS.CONFIRMED,
    'cancelled': ORDER_STATUS.CANCELLED,
  };
  return statusMap[status] || ORDER_STATUS.PENDING;
};
