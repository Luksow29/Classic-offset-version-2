// TypeScript interfaces for the OrderChat system

export interface ChatThread {
  id: string;
  order_id: number;
  customer_id: string;
  subject: string;
  status: 'active' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin' | 'system';
  message_type: 'text' | 'file' | 'image' | 'system';
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatThreadWithDetails extends ChatThread {
  order: {
    id: number;
    order_type: string;
    customer_name: string;
    created_at: string;
    total_amount: number;
  };
  messages?: ChatMessage[];
  unread_count?: number;
}

export interface SendMessagePayload {
  thread_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'image';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

export interface CreateThreadPayload {
  order_id: number;
  subject: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  initial_message: string;
}
