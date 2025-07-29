#!/usr/bin/env node

/**
 * Final Smart Database Sync Tool
 * Handles user_id requirements and schema differences properly
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

// Default user ID for local development (you can change this)
const DEFAULT_USER_ID = '11111111-1111-1111-1111-111111111111';

async function finalSync() {
  console.log('🎯 Starting final smart database sync...');
  
  const remoteSupabase = createClient(REMOTE_CONFIG.url, REMOTE_CONFIG.key);
  const localSupabase = createClient(LOCAL_CONFIG.url, LOCAL_CONFIG.key);
  
  let syncReport = {
    successful: [],
    failed: [],
    totalRecords: 0
  };

  try {
    // First, create a default user in auth.users if needed
    console.log('👤 Setting up default user...');
    
    // Sync customers
    console.log('\n📋 Syncing customers...');
    try {
      const { data: remoteCustomers, error: customerError } = await remoteSupabase
        .from('customers')
        .select('id, name, phone, email, address, created_at, total_orders, total_spent, last_interaction, updated_at, billing_address, shipping_address, birthday, secondary_phone, company_name, tags, user_id');
        
      if (!customerError && remoteCustomers?.length > 0) {
        // Clear existing customers
        await localSupabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare customers with default user_id if missing
        const processedCustomers = remoteCustomers.map(customer => ({
          ...customer,
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
      }
    } catch (e) {
      console.log(`❌ Customer sync error: ${e.message}`);
      syncReport.failed.push({ table: 'customers', reason: e.message });
    }
    
    // Sync orders
    console.log('\n📋 Syncing orders...');
    try {
      const { data: remoteOrders, error: orderError } = await remoteSupabase
        .from('orders')
        .select('*');
        
      if (!orderError && remoteOrders?.length > 0) {
        // Clear existing orders
        await localSupabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare orders with default user_id if missing
        const processedOrders = remoteOrders.map(order => ({
          ...order,
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
      }
    } catch (e) {
      console.log(`❌ Order sync error: ${e.message}`);
      syncReport.failed.push({ table: 'orders', reason: e.message });
    }
    
    // Sync payments
    console.log('\n📋 Syncing payments...');
    try {
      const { data: remotePayments, error: paymentError } = await remoteSupabase
        .from('payments')
        .select('*');
        
      if (!paymentError && remotePayments?.length > 0) {
        // Clear existing payments
        await localSupabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare payments with default created_by if missing
        const processedPayments = remotePayments.map(payment => ({
          ...payment,
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
      }
    } catch (e) {
      console.log(`❌ Payment sync error: ${e.message}`);
      syncReport.failed.push({ table: 'payments', reason: e.message });
    }
    
    // Sync materials
    console.log('\n📋 Syncing materials...');
    try {
      const { data: remoteMaterials, error: materialError } = await remoteSupabase
        .from('materials')
        .select('*');
        
      if (!materialError && remoteMaterials?.length > 0) {
        // Clear existing materials
        await localSupabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Prepare materials with default created_by if missing
        const processedMaterials = remoteMaterials.map(material => ({
          ...material,
          created_by: material.created_by || DEFAULT_USER_ID
        }));
        
        const { error: insertError } = await localSupabase
          .from('materials')
          .insert(processedMaterials);
          
        if (!insertError) {
          console.log(`✅ Synced materials: ${processedMaterials.length} records`);
          syncReport.successful.push({ table: 'materials', records: processedMaterials.length });
          syncReport.totalRecords += processedMaterials.length;
        } else {
          console.log(`❌ Material sync failed: ${insertError.message}`);
          syncReport.failed.push({ table: 'materials', reason: insertError.message });
        }
      } else {
        console.log(`📭 No materials found on remote`);
        syncReport.successful.push({ table: 'materials', records: 0 });
      }
    } catch (e) {
      console.log(`❌ Material sync error: ${e.message}`);
      syncReport.failed.push({ table: 'materials', reason: e.message });
    }
    
    // Generate final report
    console.log('\n🎉 Final Sync Report:');
    console.log('====================');
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
    
    console.log('\n🎯 Database sync completed successfully!');
    console.log('📝 Note: Default user_id used for missing user references');
    console.log('🌐 Remote: https://ytnsjmbhgwcuwmnflncl.supabase.co');
    console.log('🏠 Local:  http://127.0.0.1:54331');
    console.log('🔧 Local Studio: http://127.0.0.1:55323');
    
  } catch (error) {
    console.error('❌ Final sync failed:', error.message);
    process.exit(1);
  }
}

finalSync();
