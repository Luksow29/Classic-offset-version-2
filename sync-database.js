#!/usr/bin/env node

/**
 * Automated Database Sync Tool
 * Syncs remote Supabase data to local Supabase instance
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

// Tables to sync (in order of dependencies)
const TABLES_TO_SYNC = [
  'customers',
  'products', 
  'materials',
  'staff',
  'orders',
  'order_items',
  'payments',
  'activity_logs'
];

async function syncDatabase() {
  console.log('🔄 Starting automated database sync...');
  
  // Create clients
  const remoteSupabase = createClient(REMOTE_CONFIG.url, REMOTE_CONFIG.key);
  const localSupabase = createClient(LOCAL_CONFIG.url, LOCAL_CONFIG.key);
  
  let syncReport = {
    successful: [],
    failed: [],
    totalRecords: 0
  };

  try {
    for (const tableName of TABLES_TO_SYNC) {
      console.log(`📋 Syncing table: ${tableName}`);
      
      try {
        // Fetch data from remote
        const { data: remoteData, error: remoteError } = await remoteSupabase
          .from(tableName)
          .select('*');
          
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
        
        // Clear existing data in local table
        const { error: deleteError } = await localSupabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
          
        if (deleteError) {
          console.log(`⚠️  Warning: Could not clear ${tableName} in local:`, deleteError.message);
        }
        
        // Insert data into local
        const { error: insertError } = await localSupabase
          .from(tableName)
          .insert(remoteData);
          
        if (insertError) {
          console.log(`❌ Failed to sync ${tableName}:`, insertError.message);
          syncReport.failed.push({ table: tableName, reason: `Local insert error: ${insertError.message}` });
        } else {
          console.log(`✅ Successfully synced ${tableName}: ${remoteData.length} records`);
          syncReport.successful.push({ table: tableName, records: remoteData.length });
          syncReport.totalRecords += remoteData.length;
        }
        
      } catch (tableError) {
        console.log(`❌ Error syncing ${tableName}:`, tableError.message);
        syncReport.failed.push({ table: tableName, reason: tableError.message });
      }
    }
    
    // Generate sync report
    console.log('\n📊 Sync Report:');
    console.log('================');
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
    
    console.log('\n🎉 Database sync completed!');
    console.log('🌐 Remote: https://ytnsjmbhgwcuwmnflncl.supabase.co');
    console.log('🏠 Local:  http://127.0.0.1:54331');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run the sync
syncDatabase();
