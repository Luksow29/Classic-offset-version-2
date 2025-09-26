# 🔧 Razorpay Integration - Technical Implementation Guide

**Date:** 25 September 2025  
**Project:** Classic Offset Customer Portal  
**Integration:** Razorpay Payment Gateway  

---

## 🚀 Quick Start Guide

### **Step 1: Razorpay Account Setup**
1. Visit [https://razorpay.com](https://razorpay.com)
2. Create business account
3. Complete KYC verification
4. Get API credentials from Dashboard

### **Step 2: Test Credentials**
```bash
# Test Mode
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=[YOUR_TEST_SECRET]
RAZORPAY_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]

# Live Mode (Production)
RAZORPAY_KEY_ID=rzp_live_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=[YOUR_LIVE_SECRET]
RAZORPAY_WEBHOOK_SECRET=whsec_[YOUR_LIVE_WEBHOOK_SECRET]
```

---

## 📦 Dependencies & Installation

### **Customer Portal Dependencies**
```bash
cd customer-portal/print-portal-pal
npm install razorpay-web @types/razorpay
```

### **Supabase Edge Function Dependencies**
```typescript
// In edge function imports
import Razorpay from 'https://esm.sh/razorpay@2.9.2';
```

---

## 💾 Database Implementation Scripts

### **Script 1: Create Payment Tables**
```sql
-- File: create_payment_tables.sql
-- Execute this in Supabase SQL Editor

-- Customer Payment Transactions Table
CREATE TABLE IF NOT EXISTS customer_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  order_id BIGINT REFERENCES orders(id) NOT NULL,
  
  -- Razorpay specific fields
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  
  -- Payment details
  amount NUMERIC NOT NULL,
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

-- Customer Payment Methods Table (Optional)
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  method_type TEXT CHECK (method_type IN ('card', 'upi', 'netbanking', 'wallet', 'emi')) NOT NULL,
  method_details JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_customer_id 
ON customer_payment_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_order_id 
ON customer_payment_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_razorpay_order_id 
ON customer_payment_transactions(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_customer_payment_transactions_status 
ON customer_payment_transactions(status);

-- Helper Function for Order Updates
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

-- Enable RLS (Row Level Security)
ALTER TABLE customer_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_payment_transactions
CREATE POLICY "Users can view own payment transactions" ON customer_payment_transactions
FOR SELECT USING (auth.uid()::text = customer_id::text);

CREATE POLICY "Users can insert own payment transactions" ON customer_payment_transactions
FOR INSERT WITH CHECK (auth.uid()::text = customer_id::text);

-- RLS Policies for customer_payment_methods
CREATE POLICY "Users can manage own payment methods" ON customer_payment_methods
FOR ALL USING (auth.uid()::text = customer_id::text);
```

---

## 🔧 Supabase Edge Functions

### **Function 1: Create Razorpay Order**
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, amount, customerId }: CreateOrderRequest = await req.json();
    
    // Validate input
    if (!orderId || !amount || !customerId) {
      throw new Error('Missing required fields: orderId, amount, customerId');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get customer and order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email
        )
      `)
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or unauthorized');
    }

    // Validate order amount
    if (amount > order.balance_amount) {
      throw new Error('Payment amount cannot exceed balance amount');
    }

    // Create Razorpay order
    const razorpayOrderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${orderId}_${Date.now()}`,
      notes: {
        order_id: orderId.toString(),
        customer_id: customerId,
        customer_name: order.customers?.name || 'Unknown'
      }
    };

    // Make API call to Razorpay
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
      console.error('Razorpay API Error:', razorpayOrder);
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
      console.error('Database Insert Error:', insertError);
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
          customer_name: order.customers?.name || 'Customer',
          customer_email: order.customers?.email || '',
          customer_phone: order.customers?.phone || '',
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

### **Function 2: Razorpay Webhook Handler**
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
  try {
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
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    if (!signature) {
      console.error('Missing Razorpay signature');
      return new Response('Missing signature', { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Missing webhook secret');
      return new Response('Server configuration error', { status: 500 });
    }

    const isValidSignature = await verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event);

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle payment captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      console.log('Processing payment.captured for order:', payment.order_id);
      
      // Update payment transaction status
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
        console.error('Failed to update transaction:', updateError);
        throw new Error(`Failed to update transaction: ${updateError.message}`);
      }

      if (!transaction) {
        console.error('Transaction not found for order:', payment.order_id);
        throw new Error('Transaction not found');
      }

      console.log('Transaction updated successfully:', transaction.id);

      // Create entry in admin payments table for sync
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
          notes: `Online payment via Razorpay - Payment ID: ${payment.id}`,
          created_by: transaction.customer_id, // Customer initiated
        });

      if (paymentInsertError) {
        console.error('Failed to create admin payment record:', paymentInsertError);
        // Don't throw error here, as the customer payment is still valid
      } else {
        console.log('Admin payment record created successfully');
      }

      // Update order balance amounts
      const { error: orderUpdateError } = await supabaseClient.rpc(
        'update_order_payment_amounts',
        {
          order_id: transaction.order_id,
          payment_amount: transaction.amount
        }
      );

      if (orderUpdateError) {
        console.error('Failed to update order amounts:', orderUpdateError);
        // Don't throw error here, can be updated manually if needed
      } else {
        console.log('Order amounts updated successfully');
      }
    }

    // Handle payment failed event
    else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      console.log('Processing payment.failed for order:', payment.order_id);
      
      const { error: updateError } = await supabaseClient
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

      if (updateError) {
        console.error('Failed to update failed payment:', updateError);
      } else {
        console.log('Failed payment updated successfully');
      }
    }

    else {
      console.log('Unhandled webhook event:', event.event);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(`Webhook processing failed: ${error.message}`, { status: 500 });
  }
});
```

---

## 🎨 Frontend Components

### **Hook: useRazorpayPayment**
**File:** `customer-portal/print-portal-pal/src/hooks/useRazorpayPayment.ts`

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentDetails {
  orderId: number;
  amount: number;
  customerId: string;
}

interface PaymentResult {
  success: boolean;
  payment_id?: string;
  order_id?: string;
  signature?: string;
}

export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (paymentDetails: PaymentDetails): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      // Validate input
      if (!paymentDetails.orderId || !paymentDetails.amount || !paymentDetails.customerId) {
        throw new Error('Missing required payment details');
      }

      if (paymentDetails.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Call Supabase Edge Function to create Razorpay order
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: paymentDetails
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create payment order');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      // Load Razorpay script dynamically if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay script'));
          document.body.appendChild(script);
        });
      }

      // Configure Razorpay options
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: 'Classic Offset',
        description: `Payment for Order #${paymentDetails.orderId}`,
        image: '/logo.png', // Add your logo here
        prefill: {
          name: data.order_details.customer_name,
          email: data.order_details.customer_email,
          contact: data.order_details.customer_phone,
        },
        theme: {
          color: '#3B82F6' // Customize to match your brand
        },
        handler: (response: any) => {
          // Payment successful
          return {
            success: true,
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
          };
        },
        modal: {
          ondismiss: () => {
            throw new Error('Payment cancelled by user');
          }
        }
      };

      // Open Razorpay checkout
      return new Promise((resolve, reject) => {
        const razorpay = new (window as any).Razorpay({
          ...options,
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
        });
        
        razorpay.open();
      });

    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    initiatePayment, 
    loading, 
    error,
    clearError: () => setError(null)
  };
};
```

### **Component: PaymentButton**
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
  className?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  orderId,
  amount,
  customerId,
  customerName,
  onPaymentSuccess,
  disabled = false,
  className = ""
}) => {
  const { initiatePayment, loading } = useRazorpayPayment();
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      console.log('Initiating payment for:', { orderId, amount, customerId });
      
      const result = await initiatePayment({
        orderId,
        amount,
        customerId
      });

      console.log('Payment result:', result);

      if (result.success) {
        toast({
          title: "Payment Successful! 🎉",
          description: `Payment of ₹${amount.toLocaleString()} completed successfully.`,
          variant: "default",
        });
        
        // Call success callback if provided
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isDisabled = disabled || loading || amount <= 0;

  return (
    <Button
      onClick={handlePayment}
      disabled={isDisabled}
      className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing Payment...
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

export default PaymentButton;
```

---

## 🧪 Testing Guide

### **Test Card Details for Razorpay Test Mode:**
```bash
# Successful Payment
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date (e.g., 12/25)
Name: Any name

# Failed Payment
Card Number: 4000 0000 0000 0002
CVV: 123
Expiry: Any future date

# UPI Testing
Success UPI ID: success@razorpay
Failure UPI ID: failure@razorpay
```

### **Testing Checklist:**
- [ ] Create payment order (Edge Function)
- [ ] Razorpay checkout opens correctly
- [ ] Successful payment processing
- [ ] Failed payment handling
- [ ] Webhook signature verification
- [ ] Database updates (transaction & order)
- [ ] Admin payments table sync
- [ ] Error handling and user feedback

---

## 🚀 Deployment Steps

### **1. Deploy Edge Functions:**
```bash
# Navigate to project root
cd /path/to/project

# Deploy create order function
supabase functions deploy create-razorpay-order

# Deploy webhook function
supabase functions deploy razorpay-webhook
```

### **2. Set Environment Variables:**
```bash
# Set in Supabase Dashboard > Settings > Edge Functions
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **3. Configure Webhook URL:**
```bash
# In Razorpay Dashboard > Settings > Webhooks
# Add webhook URL:
https://your-project-id.supabase.co/functions/v1/razorpay-webhook

# Select events:
- payment.captured
- payment.failed
```

### **4. Test Integration:**
```bash
# Test create order endpoint
curl -X POST \
  'https://your-project-id.supabase.co/functions/v1/create-razorpay-order' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "orderId": 1,
    "amount": 100,
    "customerId": "customer-uuid"
  }'
```

---

## 📞 Troubleshooting

### **Common Issues:**

#### **1. "Order not found" Error**
- Check if customer_id matches the authenticated user
- Verify order exists and has balance_amount > 0

#### **2. Webhook Signature Verification Failed**
- Ensure webhook secret is correctly set
- Check webhook URL is accessible
- Verify HTTPS is used for webhook endpoint

#### **3. Payment Button Not Working**
- Check if Razorpay script is loaded
- Verify API keys are correctly configured
- Check browser console for JavaScript errors

#### **4. Database Connection Issues**
- Verify Supabase credentials in edge functions
- Check RLS policies allow required operations
- Ensure tables exist with correct schema

---

## 🔒 Security Checklist

- [ ] Never expose Razorpay Key Secret in frontend
- [ ] Always verify webhook signatures
- [ ] Use HTTPS for all endpoints
- [ ] Implement proper error handling
- [ ] Validate all user inputs server-side
- [ ] Set up proper RLS policies
- [ ] Monitor payment transactions
- [ ] Implement rate limiting
- [ ] Regular security audits

---

**📄 Status:** Ready for Implementation  
**🎯 Next:** Execute database setup and deploy edge functions  
**⚡ Quick Start:** Begin with database script execution  

---

*This technical guide provides all necessary code and configuration for Razorpay integration. Follow the steps sequentially for successful implementation.*
