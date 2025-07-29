#!/usr/bin/env node

/**
 * Minimal Database Sync Tool
 * Only syncs basic columns that definitely exist in both databases
 */

import { createClient } from '@supabase/supabase-js';

// Remote Supabase configuration
const REMOTE_CONFIG = {
  url: 'https://ytnsjmbhgwcuwmnflncl.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bnNqbWJoZ3djdXdtbmZsbmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzUyNzEsImV4cCI6MjA2MzE1MTI3MX0.dOHH5M5D4jBIYOP0nEHlTd34kwUeKgfu5YUICUkDjeU'
};

// Local Supabase configuration  
const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54331',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
};

// Default user ID for local development
const DEFAULT_USER_ID = '11111111-1111-1111-1111-111111111111';

async function minimalSync() {
  console.log('🎯 Starting minimal database sync...');
  
  const remoteSupabase = createClient(REMOTE_CONFIG.url, REMOTE_CONFIG.key);
  const localSupabase = createClient(LOCAL_CONFIG.url, LOCAL_CONFIG.key);
  
  let syncReport = {
    successful: [],
    failed: [],
    totalRecords: 0
  };

  try {
    // Sync customers with minimal columns
    console.log('\n📋 Syncing customers (minimal)...');
    try {
      const { data: remoteCustomers, error: customerError } = await remoteSupabase
        .from('customers')
        .select('id, name, phone, created_at, user_id');
        
      if (!customerError && remoteCustomers?.length > 0) {
        // Clear existing customers
        await localSupabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare customers with only basic columns
        const processedCustomers = remoteCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          created_at: customer.created_at,
          user_id: customer.user_id || DEFAULT_USER_ID
        }));
        
        const { error: insertError } = await localSupabase
          .from('customers')
          .insert(processedCustomers);
          
        if (!insertError) {
          console.log(`✅ Synced customers: ${processedCustomers.length} records`);
          syncReport.successful.push({ table: 'customers', records: processedCustomers.length });
          syncReport.totalRecords += processedCustomers.length;
        } else {
          console.log(`❌ Customer sync failed: ${insertError.message}`);
          syncReport.failed.push({ table: 'customers', reason: insertError.message });
        }
      } else {
        console.log(`📭 No customers found on remote`);
        syncReport.successful.push({ table: 'customers', records: 0 });
      }
    } catch (e) {
      console.log(`❌ Customer sync error: ${e.message}`);
      syncReport.failed.push({ table: 'customers', reason: e.message });
    }
    
    // Sync orders with minimal columns
    console.log('\n📋 Syncing orders (minimal)...');
    try {
      const { data: remoteOrders, error: orderError } = await remoteSupabase
        .from('orders')
        .select('id, date, order_type, quantity, delivery_date, notes, created_at, user_id');
        
      if (!orderError && remoteOrders?.length > 0) {
        // Clear existing orders
        await localSupabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare orders with only basic columns
        const processedOrders = remoteOrders.map(order => ({
          id: order.id,
          date: order.date,
          order_type: order.order_type,
          quantity: order.quantity,
          delivery_date: order.delivery_date,
          notes: order.notes,
          created_at: order.created_at,
          user_id: order.user_id || DEFAULT_USER_ID
        }));
        
        const { error: insertError } = await localSupabase
          .from('orders')
          .insert(processedOrders);
          
        if (!insertError) {
          console.log(`✅ Synced orders: ${processedOrders.length} records`);
          syncReport.successful.push({ table: 'orders', records: processedOrders.length });
          syncReport.totalRecords += processedOrders.length;
        } else {
          console.log(`❌ Order sync failed: ${insertError.message}`);
          syncReport.failed.push({ table: 'orders', reason: insertError.message });
        }
      } else {
        console.log(`📭 No orders found on remote`);
        syncReport.successful.push({ table: 'orders', records: 0 });
      }
    } catch (e) {
      console.log(`❌ Order sync error: ${e.message}`);
      syncReport.failed.push({ table: 'orders', reason: e.message });
    }
    
    // Sync payments with minimal columns
    console.log('\n📋 Syncing payments (minimal)...');
    try {
      const { data: remotePayments, error: paymentError } = await remoteSupabase
        .from('payments')
        .select('id, total_amount, due_date, status, created_at, created_by');
        
      if (!paymentError && remotePayments?.length > 0) {
        // Clear existing payments
        await localSupabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare payments with only basic columns
        const processedPayments = remotePayments.map(payment => ({
          id: payment.id,
          total_amount: payment.total_amount,
          due_date: payment.due_date,
          status: payment.status,
          created_at: payment.created_at,
          created_by: payment.created_by || DEFAULT_USER_ID
        }));
        
        const { error: insertError } = await localSupabase
          .from('payments')
          .insert(processedPayments);
          
        if (!insertError) {
          console.log(`✅ Synced payments: ${processedPayments.length} records`);
          syncReport.successful.push({ table: 'payments', records: processedPayments.length });
          syncReport.totalRecords += processedPayments.length;
        } else {
          console.log(`❌ Payment sync failed: ${insertError.message}`);
          syncReport.failed.push({ table: 'payments', reason: insertError.message });
        }
      } else {
        console.log(`📭 No payments found on remote`);
        syncReport.successful.push({ table: 'payments', records: 0 });
      }
    } catch (e) {
      console.log(`❌ Payment sync error: ${e.message}`);
      syncReport.failed.push({ table: 'payments', reason: e.message });
    }
    
    // Generate final report
    console.log('\n🎉 Minimal Sync Report:');
    console.log('======================');
    console.log(`✅ Successful tables: ${syncReport.successful.length}`);
    console.log(`❌ Failed tables: ${syncReport.failed.length}`);
    console.log(`📊 Total records synced: ${syncReport.totalRecords}`);
    
    if (syncReport.successful.length > 0) {
      console.log('\n✅ Successfully synced:');
      syncReport.successful.forEach(item => {
        console.log(`   - ${item.table}: ${item.records} records`);
      });
    }
    
    if (syncReport.failed.length > 0) {
      console.log('\n❌ Failed to sync:');
      syncReport.failed.forEach(item => {
        console.log(`   - ${item.table}: ${item.reason}`);
      });
    }
    
    console.log('\n🎯 Minimal sync completed!');
    console.log('📝 Note: Only basic columns were synced');
    console.log('🌐 Remote: https://ytnsjmbhgwcuwmnflncl.supabase.co');
    console.log('🏠 Local:  http://127.0.0.1:54331');
    console.log('🔧 Local Studio: http://127.0.0.1:55323');
    console.log('\n🚀 Next: Start your app with "npm run dev:local"');
    
  } catch (error) {
    console.error('❌ Minimal sync failed:', error.message);
    process.exit(1);
  }
}

minimalSync();
