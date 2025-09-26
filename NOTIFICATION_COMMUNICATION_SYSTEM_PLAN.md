# 🔔 Real-time Notifications & Communication System - Implementation Plan

**Date Created:** 26 September 2025  
**Project:** Classic Offset - Customer Portal & Admin App Sync  
**Feature:** Unified Notification & Communication Hub  
**Priority:** High - Next Implementation Phase  

---

## 🎯 Feature Overview

### **Core Objective:**
Create a comprehensive real-time communication system that synchronizes notifications and messages between customer portal and admin app, providing seamless, instant updates and direct communication channels.

### **Key Benefits:**
- ⚡ **Real-time Updates** - Instant notifications for order status, payments, quotes
- 💬 **Direct Communication** - In-app messaging between customers and admin
- 📱 **Multi-channel Notifications** - Browser push, email, SMS integration
- 🔄 **Complete Sync** - Admin and customer apps fully synchronized
- 📊 **Better Tracking** - All communications logged and trackable

---

## 🏗️ System Architecture

### **Database Schema Design:**

#### **1. Notifications Table**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('order_update', 'payment_received', 'quote_ready', 'delivery_update', 'message', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_type TEXT CHECK (recipient_type IN ('customer', 'admin', 'both')) NOT NULL,
  recipient_id UUID, -- NULL for all admins
  sender_id UUID,
  sender_type TEXT CHECK (sender_type IN ('customer', 'admin', 'system')),
  order_id BIGINT REFERENCES orders(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  -- Action buttons data
  actions JSONB DEFAULT '[]', -- [{action: 'view_order', label: 'View Order', url: '/orders/123'}]
  -- Delivery tracking
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'push', 'sms']
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_order_id ON notifications(order_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, read) WHERE read = false;
```

#### **2. Order Messages Table**
```sql
CREATE TABLE order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('customer', 'admin')) NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'voice', 'system')) DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  read_by_recipient BOOLEAN DEFAULT false,
  reply_to_message_id UUID REFERENCES order_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  -- Message metadata
  metadata JSONB DEFAULT '{}' -- {edited: true, forwarded: true, etc.}
);

-- Indexes
CREATE INDEX idx_order_messages_order_id ON order_messages(order_id, created_at DESC);
CREATE INDEX idx_order_messages_unread ON order_messages(order_id, read_by_recipient) WHERE read_by_recipient = false;
CREATE INDEX idx_order_messages_sender ON order_messages(sender_id, sender_type);
```

#### **3. Push Subscriptions Table**
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'admin')) NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  browser_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id, user_type, is_active);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active, last_used);
```

#### **4. Notification Preferences Table**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('customer', 'admin')) NOT NULL,
  notification_type TEXT NOT NULL,
  channels TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'push', 'sms']
  enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, user_type, notification_type)
);

-- Indexes
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id, user_type);
```

---

### **Real-time Functionality:**

#### **1. Auto-Notification Triggers**
```sql
-- Trigger: Order Status Change Notifications
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_message TEXT;
  admin_message TEXT;
  priority_level TEXT;
BEGIN
  -- Define messages based on status
  CASE NEW.status
    WHEN 'In Progress' THEN
      customer_message := 'Great news! Your order is now being processed by our team.';
      admin_message := 'Order #' || NEW.id || ' status updated to In Progress';
      priority_level := 'medium';
    WHEN 'Completed' THEN
      customer_message := 'Excellent! Your order is complete and ready for pickup/delivery.';
      admin_message := 'Order #' || NEW.id || ' has been completed';
      priority_level := 'high';
    WHEN 'Delivered' THEN
      customer_message := 'Your order has been delivered successfully. Thank you for choosing Classic Offset!';
      admin_message := 'Order #' || NEW.id || ' has been delivered';
      priority_level := 'high';
    WHEN 'Cancelled' THEN
      customer_message := 'Your order has been cancelled. Please contact us if you have any questions.';
      admin_message := 'Order #' || NEW.id || ' has been cancelled';
      priority_level := 'high';
    ELSE
      customer_message := 'Your order status has been updated to: ' || NEW.status;
      admin_message := 'Order #' || NEW.id || ' status updated to ' || NEW.status;
      priority_level := 'medium';
  END CASE;

  -- Send notification to customer
  INSERT INTO notifications (
    type, title, message, recipient_type, recipient_id, sender_type,
    order_id, priority, data, actions, delivery_channels
  ) VALUES (
    'order_update',
    'Order Status Updated',
    customer_message,
    'customer',
    NEW.customer_id,
    'system',
    NEW.id,
    priority_level,
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'updated_by', NEW.updated_by,
      'order_total', NEW.total_amount
    ),
    jsonb_build_array(
      jsonb_build_object('action', 'view_order', 'label', 'View Order', 'url', '/orders/' || NEW.id),
      jsonb_build_object('action', 'contact_support', 'label', 'Contact Support', 'url', '/support')
    ),
    ARRAY['in_app', 'email', 'push']
  );

  -- Send notification to admin (all admins)
  INSERT INTO notifications (
    type, title, message, recipient_type, sender_type,
    order_id, priority, data, actions, delivery_channels
  ) VALUES (
    'order_update',
    'Order Status Updated',
    admin_message,
    'admin',
    'system',
    NEW.id,
    CASE WHEN NEW.status IN ('Completed', 'Delivered') THEN 'medium' ELSE 'low' END,
    jsonb_build_object(
      'customer_name', NEW.customer_name,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'order_total', NEW.total_amount
    ),
    jsonb_build_array(
      jsonb_build_object('action', 'view_order', 'label', 'View Order', 'url', '/admin/orders/' || NEW.id)
    ),
    ARRAY['in_app']
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_notify_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_change();
```

#### **2. Payment Notification Trigger**
```sql
-- Trigger: Payment Received Notifications
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  order_info RECORD;
  payment_method_display TEXT;
BEGIN
  -- Get order information
  SELECT * INTO order_info FROM orders WHERE id = NEW.order_id;
  
  -- Format payment method for display
  payment_method_display := CASE 
    WHEN NEW.payment_method = 'Razorpay' THEN 'Online Payment'
    ELSE NEW.payment_method
  END;

  -- Notify customer about payment confirmation
  INSERT INTO notifications (
    type, title, message, recipient_type, recipient_id, sender_type,
    order_id, priority, data, actions, delivery_channels
  ) VALUES (
    'payment_received',
    'Payment Confirmed ✅',
    'Your payment of ₹' || NEW.amount_paid::text || ' has been received and confirmed. Thank you!',
    'customer',
    NEW.customer_id,
    'system',
    NEW.order_id,
    'high',
    jsonb_build_object(
      'amount', NEW.amount_paid,
      'payment_method', payment_method_display,
      'payment_id', NEW.id,
      'remaining_balance', order_info.balance_amount - NEW.amount_paid
    ),
    jsonb_build_array(
      jsonb_build_object('action', 'view_invoice', 'label', 'View Invoice', 'url', '/invoices/' || NEW.order_id),
      jsonb_build_object('action', 'download_receipt', 'label', 'Download Receipt', 'url', '/receipts/' || NEW.id)
    ),
    ARRAY['in_app', 'email', 'push']
  );

  -- Notify admin about new payment
  INSERT INTO notifications (
    type, title, message, recipient_type, sender_type,
    order_id, priority, data, actions, delivery_channels
  ) VALUES (
    'payment_received',
    '💰 Payment Received',
    'Payment of ₹' || NEW.amount_paid::text || ' received for Order #' || NEW.order_id::text || ' from ' || order_info.customer_name,
    'admin',
    NULL,
    'system',
    NEW.order_id,
    'medium',
    jsonb_build_object(
      'amount', NEW.amount_paid,
      'customer_id', NEW.customer_id,
      'customer_name', order_info.customer_name,
      'payment_method', payment_method_display,
      'remaining_balance', order_info.balance_amount - NEW.amount_paid
    ),
    jsonb_build_array(
      jsonb_build_object('action', 'view_payment', 'label', 'View Payment', 'url', '/admin/payments/' || NEW.id),
      jsonb_build_object('action', 'view_order', 'label', 'View Order', 'url', '/admin/orders/' || NEW.order_id)
    ),
    ARRAY['in_app']
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_notify_payment_received
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();
```

#### **3. New Order Request Notification**
```sql
-- Trigger: New Order Request Notifications
CREATE OR REPLACE FUNCTION notify_new_order_request()
RETURNS TRIGGER AS $$
DECLARE
  request_data_obj JSONB;
  customer_info RECORD;
BEGIN
  -- Get customer information
  SELECT * INTO customer_info FROM customers WHERE id = NEW.customer_id;
  
  -- Parse request data
  request_data_obj := NEW.request_data;

  -- Notify customer about request submission
  INSERT INTO notifications (
    type, title, message, recipient_type, recipient_id, sender_type,
    order_id, priority, data, actions, delivery_channels
  ) VALUES (
    'order_update',
    'Order Request Submitted ✅',
    'Your order request has been submitted successfully. Our team will review and respond within 24 hours.',
    'customer',
    NEW.customer_id,
    'system',
    NULL,
    'medium',
    jsonb_build_object(
      'request_id', NEW.id,
      'order_type', request_data_obj->>'orderType',
      'quantity', request_data_obj->>'quantity',
      'estimated_total', request_data_obj->>'totalAmount'
    ),
    jsonb_build_array(
      jsonb_build_object('action', 'view_request', 'label', 'View Request', 'url', '/requests/' || NEW.id),
      jsonb_build_object('action', 'contact_support', 'label', 'Contact Support', 'url', '/support')
    ),
    ARRAY['in_app', 'email']
  );

  -- Notify admin about new request (high priority)
  INSERT INTO notifications (
    type, title, message, recipient_type, sender_type,
    priority, data, actions, delivery_channels
  ) VALUES (
    'order_update',
    '🆕 New Order Request',
    'New order request from ' || customer_info.name || ' - ' || (request_data_obj->>'orderType') || ' (Qty: ' || (request_data_obj->>'quantity') || ')',
    'admin',
    NULL,
    'system',
    'high',
    jsonb_build_object(
      'request_id', NEW.id,
      'customer_id', NEW.customer_id,
      'customer_name', customer_info.name,
      'customer_phone', customer_info.phone,
      'order_type', request_data_obj->>'orderType',
      'quantity', request_data_obj->>'quantity',
      'delivery_date', request_data_obj->>'deliveryDate',
      'estimated_total', request_data_obj->>'totalAmount'
    ),
    jsonb_build_array(
      jsonb_build_object('action', 'review_request', 'label', 'Review Request', 'url', '/admin/requests/' || NEW.id),
      jsonb_build_object('action', 'quick_approve', 'label', 'Quick Approve', 'url', '/admin/requests/' || NEW.id || '/approve'),
      jsonb_build_object('action', 'contact_customer', 'label', 'Contact Customer', 'url', '/admin/customers/' || NEW.customer_id)
    ),
    ARRAY['in_app', 'push']
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_notify_new_order_request
  AFTER INSERT ON order_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order_request();
```

---

## 🎨 Frontend Components Architecture

### **Customer Portal Components:**

#### **1. Notification System**
```typescript
// File: customer-portal/print-portal-pal/src/components/notifications/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  order_id?: number;
  actions?: Array<{
    action: string;
    label: string;
    url: string;
  }>;
  data?: any;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_type', 'customer')
        .eq('recipient_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const userId = supabase.auth.getUser().then(({ data }) => data.user?.id);
    
    const subscription = supabase
      .channel('customer-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        }, 
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.priority === 'urgent' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-96">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-6 px-2"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              // Handle action click
                              window.location.href = action.url;
                            }}
                          >
                            {action.label}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
```

#### **2. In-App Messaging Component**
```typescript
// File: customer-portal/print-portal-pal/src/components/messaging/OrderChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'admin';
  sender_id: string;
  message_type: 'text' | 'file' | 'voice' | 'system';
  file_url?: string;
  file_name?: string;
  read_by_recipient: boolean;
  created_at: string;
  reply_to_message_id?: string;
}

interface OrderChatProps {
  orderId: number;
  customerId: string;
}

export const OrderChat: React.FC<OrderChatProps> = ({ orderId, customerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`order-messages-${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'order_messages',
          filter: `order_id=eq.${orderId}`
        }, 
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark message as read if it's from admin
          if (newMessage.sender_type === 'admin') {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: orderId,
          sender_id: customerId,
          sender_type: 'customer',
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent to the admin team.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('order_messages')
        .update({ 
          read_by_recipient: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Chat with Admin - Order #{orderId}</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Online</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p>No messages yet.</p>
                <p className="text-sm">Start a conversation with the admin team.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="bg-muted px-2 py-1 rounded-full text-xs text-muted-foreground">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start gap-3 max-w-[70%] ${message.sender_type === 'customer' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.sender_type === 'customer' ? 'C' : 'A'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg p-3 ${
                          message.sender_type === 'customer' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 ${
                            message.sender_type === 'customer' ? 'flex-row-reverse' : ''
                          }`}>
                            <span className={`text-xs ${
                              message.sender_type === 'customer' 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.created_at)}
                            </span>
                            {message.sender_type === 'customer' && (
                              <span className={`text-xs ${
                                message.read_by_recipient 
                                  ? 'text-primary-foreground/70' 
                                  : 'text-primary-foreground/50'
                              }`}>
                                {message.read_by_recipient ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sending}
            />
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderChat;
```

---

## 📱 Push Notifications Setup

### **Service Worker for Push Notifications:**
```javascript
// File: customer-portal/print-portal-pal/public/sw.js
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.message,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: data.type || 'notification',
      data: {
        orderId: data.order_id,
        notificationId: data.id,
        url: data.url || '/'
      },
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        }
      ],
      requireInteraction: data.priority === 'urgent',
      silent: data.priority === 'low'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  // Optional: Track notification dismissals
});
```

### **Push Notification Hook:**
```typescript
// File: customer-portal/print-portal-pal/src/hooks/usePushNotifications.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // Get from Firebase or web-push

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSupport();
    checkSubscription();
  }, []);

  const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
  };

  const checkSubscription = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications to receive updates.",
          variant: "destructive",
        });
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        user_type: 'customer',
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        browser_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for order updates.",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Remove from database
          const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);

          if (error) throw error;
        }
      }

      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore.",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable push notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribeToPush,
    unsubscribeFromPush
  };
};
```

---

## 🎯 Implementation Roadmap

### **Database Setup Tasks:**
- [ ] Create notifications table with indexes
- [ ] Create order_messages table with indexes  
- [ ] Create push_subscriptions table
- [ ] Create notification_preferences table
- [ ] Implement auto-notification triggers
- [ ] Set up RLS policies for security

### **Backend Integration Tasks:**
- [ ] Create Supabase Edge Function for push notifications
- [ ] Set up real-time subscriptions
- [ ] Implement notification delivery system
- [ ] Create notification management APIs
- [ ] Add email notification backup system

### **Customer Portal Tasks:**
- [ ] Implement NotificationCenter component
- [ ] Create OrderChat messaging component
- [ ] Add push notification support
- [ ] Integrate with existing pages
- [ ] Add notification preferences page

### **Admin App Integration Tasks:**
- [ ] Add admin notification dashboard
- [ ] Implement quick action buttons
- [ ] Create admin messaging interface
- [ ] Add notification management features
- [ ] Integrate with existing admin workflows

### **Testing & Deployment:**
- [ ] Test real-time notifications
- [ ] Test push notifications across browsers
- [ ] Test message delivery and read receipts
- [ ] Performance testing with high message volume
- [ ] Security testing and validation

---

**📄 Implementation Plan Status:** Ready for Development  
**🎯 Priority Level:** High - Critical for customer experience  
**⏱️ Estimated Timeline:** 4 weeks for complete implementation  
**👥 Team Readiness:** Development team ready to begin  

---

*This comprehensive notification and communication system will transform the customer experience by providing real-time updates and direct communication channels between customers and admin team.*
