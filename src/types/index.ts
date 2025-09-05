// src/types/index.ts
// Centralized type definitions that match database schema exactly

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  joined_date: string | null; // date
  created_at: string; // timestamptz
  total_orders: number | null;
  total_spent: number | null;
  last_interaction: string | null; // timestamptz
  updated_at: string | null; // timestamptz
  billing_address: string | null;
  shipping_address: string | null;
  birthday: string | null; // date
  secondary_phone: string | null;
  company_name: string | null;
  tags: string[] | null; // text[]
  user_id: string | null; // UUID
  customer_type: string | null; // varchar(20)
  communication_preference: string | null; // varchar(20)
  notes: string | null;
  last_interaction_date: string | null; // timestamptz
  follow_up_date: string | null; // timestamptz
  customer_since: string | null; // timestamptz
  total_lifetime_value: number | null; // numeric(12,2)
  loyalty_points: number | null;
  loyalty_tier_id: string | null; // UUID
  referral_code: string | null; // varchar(20)
  total_points_earned: number | null;
  total_points_spent: number | null;
  tier_upgraded_at: string | null; // timestamptz
}

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

export interface Order {
  id: number; // bigint - matches database primary key
  date: string; // date
  customer_name: string;
  order_type: string;
  quantity: number;
  design_needed: boolean;
  delivery_date: string | null; // date
  amount_received: number | null; // numeric
  payment_method: string | null;
  notes: string | null;
  created_at: string | null; // timestamp
  rate: number | null; // numeric
  total_amount: number; // numeric
  balance_amount: number | null; // numeric
  product_id: number | null; // bigint
  customer_id: string | null; // UUID
  user_id: string | null; // UUID
  customer_phone: string | null;
  is_deleted: boolean | null;
  deleted_at: string | null; // timestamptz
  designer_id: string | null; // UUID
  updated_at: string | null; // timestamptz
}

export interface Material {
  id: string; // UUID
  material_name: string;
  description: string | null;
  category_id: string | null; // UUID
  supplier_id: string | null; // UUID
  unit_of_measurement: string;
  current_quantity: number | null; // numeric(10,2)
  minimum_stock_level: number | null; // numeric(10,2)
  cost_per_unit: number | null; // numeric(10,2)
  storage_location: string | null;
  purchase_date: string | null; // date
  last_purchase_date: string | null; // date
  version: number | null;
  is_active: boolean | null;
  created_at: string | null; // timestamptz
  updated_at: string | null; // timestamptz
  created_by: string | null; // UUID
  updated_by: string | null; // UUID
  last_restocked: string | null; // timestamptz
  supplier: string | null;
  reorder_point: number | null;
  current_stock: number | null;
  unit: string | null; // varchar(20)
  price_per_unit: number | null; // numeric(10,2)
  category: string | null; // varchar(100)
}

export interface Payment {
  id: string; // UUID
  customer_id: string | null; // UUID
  order_id: number | null; // bigint
  total_amount: number; // numeric
  amount_paid: number; // numeric
  due_date: string | null; // date
  status: string | null;
  created_at: string | null; // timestamp
  payment_date: string | null; // date
  created_by: string | null; // UUID
  notes: string | null;
  payment_method: string | null;
  updated_at: string | null; // timestamptz
}

export interface User {
  id: string; // UUID
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null; // timestamptz
  bio: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
}

export interface Employee {
  id: string; // UUID
  name: string;
  job_role: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean | null;
  app_user_id: string | null; // UUID
  created_at: string | null; // timestamptz
  updated_at: string | null; // timestamptz
}

// Database view types
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
}

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