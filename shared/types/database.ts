// shared/types/database.ts
// Unified database types for both Main App and Customer Portal
// These match the Supabase database schema exactly

import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  NotificationType,
  TicketStatus,
  TicketPriority,
  UserRole,
  CustomerType,
  CommunicationPreference,
  ServiceChargeType,
  PricingStatus,
  RequestStatus,
  TimelineEventType,
  ActorType,
} from './enums';

// ============================================
// JSON type for Supabase compatibility
// ============================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// CORE ENTITIES
// ============================================

/**
 * Customer entity - represents a customer in the system
 * Used by both admin and customer portal
 */
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  joined_date: string | null;
  created_at: string;
  total_orders: number | null;
  total_spent: number | null;
  last_interaction: string | null;
  updated_at: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  birthday: string | null;
  secondary_phone: string | null;
  company_name: string | null;
  tags: string[] | null;
  user_id: string | null; // Links to Supabase Auth user
  customer_type: CustomerType | string | null;
  communication_preference: CommunicationPreference | string | null;
  notes: string | null;
  last_interaction_date: string | null;
  follow_up_date: string | null;
  customer_since: string | null;
  total_lifetime_value: number | null;
  loyalty_points: number | null;
  loyalty_tier_id: string | null;
  referral_code: string | null;
  total_points_earned: number | null;
  total_points_spent: number | null;
  tier_upgraded_at: string | null;
  customer_code: string | null;
}

/**
 * Order entity - represents a print order
 */
export interface Order {
  id: number;
  date: string;
  customer_name: string;
  order_type: string;
  quantity: number;
  design_needed: boolean;
  delivery_date: string | null;
  amount_received: number | null;
  payment_method: PaymentMethod | string | null;
  notes: string | null;
  created_at: string | null;
  rate: number | null;
  total_amount: number;
  balance_amount: number | null;
  product_id: number | null;
  customer_id: string | null;
  user_id: string | null;
  customer_phone: string | null;
  is_deleted: boolean | null;
  deleted_at: string | null;
  designer_id: string | null;
  updated_at: string | null;
  status?: OrderStatus | string;
  // Service charge fields
  subtotal: number | null;
  service_charge_type: ServiceChargeType | string | null;
  service_charge_value: number | null;
  service_charge_amount: number | null;
  service_charge_description: string | null;
}

/**
 * Order request - customer-initiated order requests
 */
export interface OrderRequest {
  id: number;
  customer_id: string;
  created_at: string;
  status: RequestStatus | string;
  request_data: Json;
  pricing_status: PricingStatus | string;
  service_charges: Json | null;
  admin_total_amount: number | null;
  quote_sent_at: string | null;
  quote_response_at: string | null;
  rejection_reason: string | null;
  updated_at: string | null;
}

/**
 * Payment entity
 */
export interface Payment {
  id: string;
  customer_id: string | null;
  order_id: number | null;
  total_amount: number;
  amount_paid: number;
  due_date: string | null;
  status: PaymentStatus | string | null;
  created_at: string | null;
  payment_date: string | null;
  created_by: string | null;
  notes: string | null;
  payment_method: PaymentMethod | string | null;
  updated_at: string | null;
}

/**
 * User/Staff entity (for admin app)
 */
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | string | null;
  created_at: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
}

/**
 * Employee entity
 */
export interface Employee {
  id: string;
  name: string;
  job_role: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean | null;
  app_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Material/Inventory entity
 */
export interface Material {
  id: string;
  material_name: string;
  description: string | null;
  category_id: string | null;
  supplier_id: string | null;
  unit_of_measurement: string;
  current_quantity: number | null;
  minimum_stock_level: number | null;
  cost_per_unit: number | null;
  storage_location: string | null;
  purchase_date: string | null;
  last_purchase_date: string | null;
  version: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  last_restocked: string | null;
  supplier: string | null;
  reorder_point: number | null;
  current_stock: number | null;
  unit: string | null;
  price_per_unit: number | null;
  category: string | null;
}

/**
 * Product entity
 */
export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  base_price: number | null;
  unit: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
  min_quantity: number | null;
  max_quantity: number | null;
}

// ============================================
// NOTIFICATION ENTITIES
// ============================================

/**
 * Notification entity
 */
export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link_to: string | null;
  metadata: Json | null;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  orders_enabled: boolean;
  payments_enabled: boolean;
  system_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Push subscription
 */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: Json;
  created_at: string;
  updated_at: string | null;
}

// ============================================
// SUPPORT & CHAT ENTITIES
// ============================================

/**
 * Support ticket
 */
export interface SupportTicket {
  id: string;
  customer_id: string;
  subject: string;
  description: string | null;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  assigned_to: string | null;
}

/**
 * Support message
 */
export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin' | 'system';
  message: string;
  created_at: string;
  is_read: boolean;
  attachments: Json | null;
}

/**
 * Order chat thread
 */
export interface OrderChatThread {
  id: string;
  order_id: number;
  customer_id: string;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
  is_active: boolean;
}

/**
 * Order chat message
 */
export interface OrderChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin';
  message: string;
  created_at: string;
  is_read: boolean;
  attachments: Json | null;
}

// ============================================
// TIMELINE ENTITIES
// ============================================

/**
 * Order timeline event
 */
export interface OrderTimelineEvent {
  event_id: string;
  order_id: number;
  event_type: TimelineEventType | string;
  actor_type: ActorType | string;
  actor_id: string | null;
  actor_name: string | null;
  occurred_at: string;
  title: string;
  message: string | null;
  metadata: Json | null;
}

// ============================================
// VIEW TYPES (Database Views)
// ============================================

/**
 * Customer summary view
 */
export interface CustomerSummary {
  id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  joined_date: string | null;
  total_orders: number | null;
  total_paid: number | null;
  balance_due: number | null;
  last_order_date: string | null;
  customer_code: string | null;
}

/**
 * All order summary view
 */
export interface AllOrderSummary {
  order_id: number | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number | null;
  order_date: string | null;
  amount_paid: number | null;
  balance_due: number | null;
  status: string | null;
  order_type: string | null;
  delivery_date: string | null;
}

/**
 * Orders table display type
 */
export interface OrdersTableOrder {
  order_id: number;
  customer_name: string;
  order_type: string;
  quantity: number;
  date: string;
  delivery_date: string;
  status: string;
  customer_phone?: string;
  total_amount?: number;
  amount_received?: number;
  balance_amount?: number;
  is_deleted?: boolean;
}

/**
 * Support tickets summary view
 */
export interface SupportTicketSummary extends SupportTicket {
  total_messages: number;
  last_message: string | null;
  last_message_at: string | null;
  unread_customer_count: number;
  unread_admin_count: number;
  customer_name: string | null;
}

// ============================================
// INSERT/UPDATE TYPES
// ============================================

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'created_at'>>;

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'> & {
  id?: number;
  created_at?: string;
  updated_at?: string;
};

export type OrderUpdate = Partial<Omit<Order, 'id' | 'created_at'>>;

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PaymentUpdate = Partial<Omit<Payment, 'id' | 'created_at'>>;

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'> & {
  id?: number;
  created_at?: string;
};

export type OrderRequestInsert = Omit<OrderRequest, 'id' | 'created_at' | 'updated_at'> & {
  id?: number;
  created_at?: string;
  updated_at?: string;
};

export type OrderRequestUpdate = Partial<Omit<OrderRequest, 'id' | 'created_at'>>;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
