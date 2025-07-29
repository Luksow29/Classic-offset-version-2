#!/usr/bin/env node

/**
 * Smart Database Sync Tool
 * Intelligently syncs data between remote and local with schema differences
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

// Schema mapping - maps remote columns to local columns
const SCHEMA_MAPPING = {
  customers: {
    common: ['id', 'name', 'phone', 'email', 'created_at'],
    remote_only: ['address', 'joined_date', 'total_orders', 'total_spent', 'last_interaction', 'updated_at', 'billing_address', 'shipping_address', 'birthday', 'secondary_phone', 'company_name', 'tags', 'user_id']
  },
  products: {
    common: ['id', 'name', 'unit_price', 'description', 'created_at'],
    remote_only: ['category']
  },
  orders: {
    common: ['id', 'date', 'customer_name', 'order_type', 'quantity', 'delivery_date', 'payment_method', 'notes', 'created_at'],
    remote_only: ['design_needed', 'amount_received', 'rate', 'total_amount', 'balance_amount', 'product_id', 'customer_id', 'user_id', 'customer_phone', 'is_deleted', 'deleted_at', 'designer_id', 'updated_at']
  },
  payments: {
    common: ['id', 'customer_id', 'order_id', 'total_amount', 'due_date', 'status', 'created_at'],
    remote_only: ['amount_paid', 'payment_date', 'created_by', 'notes', 'payment_method', 'updated_at']
  },
  materials: {
    common: ['id', 'name', 'created_at'],
    remote_only: []
  }
};

async function smartSync() {
  console.log('🧠 Starting smart database sync...');
  
  const remoteSupabase = createClient(REMOTE_CONFIG.url, REMOTE_CONFIG.key);
  const localSupabase = createClient(LOCAL_CONFIG.url, LOCAL_CONFIG.key);
  
  let syncReport = {
    successful: [],
    failed: [],
    totalRecords: 0
  };

  try {
    for (const [tableName, schema] of Object.entries(SCHEMA_MAPPING)) {
      console.log(`📋 Syncing table: ${tableName}`);
      
      try {
        // Fetch data from remote using only common columns
        const columnsToSelect = schema.common.join(', ');
        console.log(`   📝 Selecting columns: ${columnsToSelect}`);
        
        const { data: remoteData, error: remoteError } = await remoteSupabase
          .from(tableName)
          .select(columnsToSelect);
          
        if (remoteError) {
          console.log(`⚠️  Warning: Could not fetch ${tableName} from remote:`, remoteError.message);
          syncReport.failed.push({ table: tableName, reason: `Remote fetch error: ${remoteError.message}` });
          continue;
        }
        
        if (!remoteData || remoteData.length === 0) {
          console.log(`📭 Table ${tableName} is empty on remote`);
          syncReport.successful.push({ table: tableName, records: 0 });
          continue;
        }
        
        // Clear existing data in local table (if any)
        try {
          const { error: deleteError } = await localSupabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
            
          if (deleteError && !deleteError.message.includes('no rows')) {
            console.log(`⚠️  Warning: Could not clear ${tableName}:`, deleteError.message);
          }
        } catch (deleteErr) {
          // Ignore delete errors for empty tables
        }
        
        // Insert data into local using only compatible columns
        const compatibleData = remoteData.map(row => {
          const compatibleRow = {};
          schema.common.forEach(col => {
            if (row[col] !== undefined) {
              compatibleRow[col] = row[col];
            }
          });
          return compatibleRow;
        });
        
        if (compatibleData.length > 0) {
          const { error: insertError } = await localSupabase
            .from(tableName)
            .insert(compatibleData);
            
          if (insertError) {
            console.log(`❌ Failed to sync ${tableName}:`, insertError.message);
            syncReport.failed.push({ table: tableName, reason: `Local insert error: ${insertError.message}` });
          } else {
            console.log(`✅ Successfully synced ${tableName}: ${compatibleData.length} records`);
            syncReport.successful.push({ table: tableName, records: compatibleData.length });
            syncReport.totalRecords += compatibleData.length;
          }
        }
        
      } catch (tableError) {
        console.log(`❌ Error syncing ${tableName}:`, tableError.message);
        syncReport.failed.push({ table: tableName, reason: tableError.message });
      }
    }
    
    // Generate detailed sync report
    console.log('\n📊 Smart Sync Report:');
    console.log('=====================');
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
    
    console.log('\n🎉 Smart database sync completed!');
    console.log('📝 Note: Only compatible columns were synced');
    console.log('🌐 Remote: https://ytnsjmbhgwcuwmnflncl.supabase.co');
    console.log('🏠 Local:  http://127.0.0.1:54331');
    console.log('🔧 Local Studio: http://127.0.0.1:55323');
    
  } catch (error) {
    console.error('❌ Smart sync failed:', error.message);
    process.exit(1);
  }
}

smartSync();
