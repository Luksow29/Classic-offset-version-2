# 🚀 Customer Portal Online Payment System - Complete Plan

**Date Created:** 25 September 2025  
**Project:** Classic Offset - Customer Portal Payment Integration  
**Status:** Planning Phase  

---

## 📊 Project Overview

This document contains the comprehensive plan for implementing online payment system in the customer portal app, with full synchronization to the admin app's payment management system.

### **Objectives:**
- ✅ Enable customers to pay invoices/orders online
- ✅ Real-time sync with admin payment system
- ✅ Support multiple payment methods (UPI, Cards, Net Banking)
- ✅ Maintain payment history and receipts
- ✅ Match admin app's UI/UX design language

---

## 🏗️ System Architecture

### **Payment Flow Architecture:**
```
Customer Portal → Create Payment Order → Razorpay Gateway → Payment Processing → Webhook → Database Update → Admin Sync
```

### **Database Integration:**
- **Customer Portal:** New payment transaction tables
- **Admin App:** Existing payments table (sync target)
- **Real-time Sync:** Triggers and webhooks for data consistency

---

## 💾 Database Schema Design

### **1. Customer Payment Transactions Table**
```sql
-- Primary table for customer-initiated payments
CREATE TABLE customer_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  
  -- Razorpay specific fields
  razorpay_order_id TEXT UNIQUE NOT NULL, -- rzp_order_xxxxx
  razorpay_payment_id TEXT UNIQUE, -- rzp_pay_xxxxx (filled after payment)
  razorpay_signature TEXT, -- webhook signature verification
  
  -- Payment details
  amount NUMERIC NOT NULL, -- Amount in rupees (not paise)
  currency TEXT DEFAULT 'INR',
  status TEXT CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'cancelled')) DEFAULT 'created',
  
  -- Gateway response data
  gateway_response JSONB DEFAULT '{}',
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  
  -- Webhook processing
  webhook_processed BOOLEAN DEFAULT false,
  webhook_processed_at TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_customer_payment_transactions_customer_id ON customer_payment_transactions(customer_id);
CREATE INDEX idx_customer_payment_transactions_order_id ON customer_payment_transactions(order_id);
CREATE INDEX idx_customer_payment_transactions_razorpay_order_id ON customer_payment_transactions(razorpay_order_id);
CREATE INDEX idx_customer_payment_transactions_status ON customer_payment_transactions(status);
```

### **2. Customer Payment Methods Table (Optional)**
```sql
-- Store customer preferred payment methods
CREATE TABLE customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  method_type TEXT CHECK (method_type IN ('card', 'upi', 'netbanking', 'wallet', 'emi')) NOT NULL,
  method_details JSONB DEFAULT '{}', -- Store encrypted details
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Admin Sync Helper Function**
```sql
-- Function to update order payment amounts
CREATE OR REPLACE FUNCTION update_order_payment_amounts(
  order_id BIGINT,
  payment_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders 
  SET 
    amount_received = COALESCE(amount_received, 0) + payment_amount,
    balance_amount = total_amount - (COALESCE(amount_received, 0) + payment_amount)
  WHERE id = order_id;
END;
$$;
```

---

## 🔧 Razorpay Gateway Integration

### **Setup & Configuration**
```bash
# Environment Variables
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
VITE_RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
VITE_RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# NPM Dependencies
npm install razorpay-web @types/razorpay
```

### **Supabase Edge Functions Required:**

#### **1. Create Razorpay Order Function**
**File:** `supabase/functions/create-razorpay-order/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrderRequest {
  orderId: number;
  amount: number;
  customerId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, amount, customerId }: CreateOrderRequest = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get customer and order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, customers(name, phone, email)')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Create Razorpay order
    const razorpayOrderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${orderId}_${Date.now()}`,
      notes: {
        order_id: orderId.toString(),
        customer_id: customerId,
      }
    };

    const auth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`);
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayOrderData),
    });

    const razorpayOrder = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      throw new Error(`Razorpay API error: ${razorpayOrder.error?.description || 'Unknown error'}`);
    }

    // Store transaction in database
    const { error: insertError } = await supabaseClient
      .from('customer_payment_transactions')
      .insert({
        customer_id: customerId,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        amount: amount,
        status: 'created',
        gateway_response: razorpayOrder,
      });

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    // Return order details for frontend
    return new Response(
      JSON.stringify({
        success: true,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: Deno.env.get('RAZORPAY_KEY_ID'),
        order_details: {
          id: order.id,
          customer_name: order.customers.name,
          customer_email: order.customers.email,
          customer_phone: order.customers.phone,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Create order error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

#### **2. Webhook Handler Function**
**File:** `supabase/functions/razorpay-webhook/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// Verify Razorpay webhook signature
async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return signature === expectedHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(
      body,
      signature || '',
      Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || ''
    );

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      // Update payment transaction
      const { data: transaction, error: updateError } = await supabaseClient
        .from('customer_payment_transactions')
        .update({
          razorpay_payment_id: payment.id,
          status: 'paid',
          paid_at: new Date().toISOString(),
          gateway_response: payment,
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', payment.order_id)
        .select('*')
        .single();

      if (updateError) {
        throw new Error(`Failed to update transaction: ${updateError.message}`);
      }

      // Create entry in admin payments table
      const { error: paymentInsertError } = await supabaseClient
        .from('payments')
        .insert({
          customer_id: transaction.customer_id,
          order_id: transaction.order_id,
          total_amount: transaction.amount,
          amount_paid: transaction.amount,
          payment_date: new Date().toISOString().split('T')[0],
          status: 'Paid',
          payment_method: 'Razorpay',
          notes: `Online payment via Razorpay - ${payment.id}`,
          created_by: transaction.customer_id, // Customer initiated
        });

      if (paymentInsertError) {
        console.error('Failed to create admin payment record:', paymentInsertError);
      }

      // Update order balance
      const { error: orderUpdateError } = await supabaseClient.rpc(
        'update_order_payment_amounts',
        {
          order_id: transaction.order_id,
          payment_amount: transaction.amount
        }
      );

      if (orderUpdateError) {
        console.error('Failed to update order amounts:', orderUpdateError);
      }
    }

    else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      
      await supabaseClient
        .from('customer_payment_transactions')
        .update({
          razorpay_payment_id: payment.id,
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: payment.error_description || 'Payment failed',
          gateway_response: payment,
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', payment.order_id);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook processing failed: ${error.message}`, { status: 500 });
  }
});
```

---

## 🎨 Frontend React Components

### **1. Payment Hook**
**File:** `customer-portal/print-portal-pal/src/hooks/useRazorpayPayment.ts`
```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentDetails {
  orderId: number;
  amount: number;
  customerId: string;
}

export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (paymentDetails: PaymentDetails) => {
    setLoading(true);
    setError(null);

    try {
      // Call Supabase Edge Function to create Razorpay order
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: paymentDetails
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return new Promise((resolve, reject) => {
        script.onload = () => {
          const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            order_id: data.razorpay_order_id,
            name: 'Classic Offset',
            description: `Payment for Order #${paymentDetails.orderId}`,
            image: '/logo.png', // Your logo
            prefill: {
              name: data.order_details.customer_name,
              email: data.order_details.customer_email,
              contact: data.order_details.customer_phone,
            },
            theme: {
              color: '#3B82F6'
            },
            handler: (response: any) => {
              resolve({
                success: true,
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
            },
            modal: {
              ondismiss: () => {
                reject(new Error('Payment cancelled by user'));
              }
            }
          };

          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
        };

        script.onerror = () => {
          reject(new Error('Failed to load Razorpay'));
        };
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading, error };
};
```

### **2. Payment Button Component**
**File:** `customer-portal/print-portal-pal/src/components/customer/PaymentButton.tsx`
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  orderId: number;
  amount: number;
  customerId: string;
  customerName: string;
  onPaymentSuccess?: () => void;
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  orderId,
  amount,
  customerId,
  customerName,
  onPaymentSuccess,
  disabled
}) => {
  const { initiatePayment, loading } = useRazorpayPayment();
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      const result = await initiatePayment({
        orderId,
        amount,
        customerId
      });

      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: `Payment of ₹${amount.toLocaleString()} completed successfully.`,
          variant: "default",
        });
        
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || amount <= 0}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ₹{amount.toLocaleString()}
        </>
      )}
    </Button>
  );
};
```

### **3. Payment History Component**
**File:** `customer-portal/print-portal-pal/src/components/customer/PaymentHistory.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

interface PaymentTransaction {
  id: string;
  order_id: number;
  amount: number;
  status: string;
  razorpay_payment_id: string;
  created_at: string;
  paid_at: string;
  failure_reason?: string;
}

interface PaymentHistoryProps {
  customerId: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ customerId }) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, [customerId]);

  const fetchPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_payment_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-200' },
      failed: { icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
      created: { icon: Clock, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      attempted: { icon: Clock, className: 'bg-blue-100 text-blue-800 border-blue-200' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading payment history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No payment history found.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">Order #{transaction.order_id}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{transaction.amount.toLocaleString()}</p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
                
                {transaction.razorpay_payment_id && (
                  <p className="text-xs text-muted-foreground">
                    Payment ID: {transaction.razorpay_payment_id}
                  </p>
                )}
                
                {transaction.failure_reason && (
                  <p className="text-xs text-red-600 mt-1">
                    Reason: {transaction.failure_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 🔒 Security Best Practices

### **1. API Key Management**
- ✅ Never expose Razorpay Key Secret in frontend code
- ✅ Use environment variables for all sensitive data
- ✅ Separate test and production credentials

### **2. Webhook Security**
- ✅ Always verify webhook signatures
- ✅ Use HTTPS endpoints only
- ✅ Implement idempotency for webhook processing
- ✅ Rate limiting for webhook endpoints

### **3. Data Validation**
- ✅ Validate all payment amounts server-side
- ✅ Implement minimum/maximum payment limits
- ✅ Sanitize all user inputs

### **4. Error Handling**
- ✅ Graceful failure handling
- ✅ User-friendly error messages
- ✅ Comprehensive logging for debugging

---

## 📱 Testing Strategy

### **Test Mode Configuration:**
```bash
# Razorpay Test Credentials
Key ID: rzp_test_1DP5mmOlF5G5ag
Key Secret: [TEST_SECRET]

# Test Card Details
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date
Name: Any name

# Test UPI IDs
Success: success@razorpay
Failure: failure@razorpay
```

### **Webhook Testing:**
```bash
# Use ngrok for local development
ngrok http 54321

# Configure webhook URL in Razorpay Dashboard:
https://your-ngrok-url.ngrok.io/functions/v1/razorpay-webhook
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation (Week 1)**
- ✅ Create database schema
- ✅ Set up Supabase Edge Functions
- ✅ Implement basic payment flow
- ✅ Create payment button component

### **Phase 2: Integration (Week 2)**
- ✅ Complete Razorpay integration
- ✅ Implement webhook processing
- ✅ Add payment history display
- ✅ Test payment flows

### **Phase 3: UI/UX Polish (Week 3)**
- ✅ Match admin app design language
- ✅ Add payment receipts
- ✅ Implement error handling
- ✅ Add loading states and animations

### **Phase 4: Production (Week 4)**
- ✅ Security audit
- ✅ Performance optimization
- ✅ Production deployment
- ✅ Monitor and maintain

---

## 📞 Support & Maintenance

### **Monitoring:**
- Payment success/failure rates
- Gateway response times
- Error tracking and alerting
- Customer feedback collection

### **Maintenance Tasks:**
- Regular security updates
- Gateway API version updates
- Database performance optimization
- Customer support integration

---

## 📋 Checklist for Implementation

### **Database Setup:**
- [ ] Create customer_payment_transactions table
- [ ] Create customer_payment_methods table
- [ ] Set up indexes for performance
- [ ] Create helper functions
- [ ] Test database operations

### **Supabase Functions:**
- [ ] Deploy create-razorpay-order function
- [ ] Deploy razorpay-webhook function
- [ ] Configure environment variables
- [ ] Test function calls
- [ ] Set up error monitoring

### **Frontend Components:**
- [ ] Create useRazorpayPayment hook
- [ ] Implement PaymentButton component
- [ ] Add PaymentHistory component
- [ ] Integrate with existing invoice pages
- [ ] Test user interactions

### **Integration Testing:**
- [ ] End-to-end payment flow testing
- [ ] Webhook processing verification
- [ ] Database sync validation
- [ ] Error scenario testing
- [ ] Mobile responsiveness testing

### **Production Readiness:**
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Error handling comprehensive
- [ ] Documentation updated
- [ ] Team training completed

---

**📄 Document Status:** Complete Plan Ready for Implementation  
**🔄 Next Steps:** Await approval to begin Phase 1 implementation  
**👥 Team:** Development team ready to execute  
**⏱️ Timeline:** 4 weeks estimated for full implementation  

---

*This document serves as the master reference for the Customer Portal Payment System implementation. All development work should refer to this plan for consistency and completeness.*
