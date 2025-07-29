#!/usr/bin/env node

/**
 * Database Schema Inspector
 * Check what tables and columns exist in remote vs local
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

async function inspectDatabases() {
  console.log('🔍 Inspecting database schemas...');
  
  const remoteSupabase = createClient(REMOTE_CONFIG.url, REMOTE_CONFIG.key);
  const localSupabase = createClient(LOCAL_CONFIG.url, LOCAL_CONFIG.key);
  
  console.log('\n🌐 REMOTE DATABASE TABLES:');
  console.log('==========================');
  
  try {
    // Check remote tables by trying to select from common ones
    const commonTables = ['customers', 'products', 'orders', 'payments', 'materials', 'staff'];
    
    for (const table of commonTables) {
      try {
        const { data, error } = await remoteSupabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ ${table}: ${data?.length || 0} records (exists)`);
          if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (e) {
        console.log(`❌ ${table}: Does not exist or no access`);
      }
    }
    
  } catch (error) {
    console.error('Error checking remote:', error.message);
  }
  
  console.log('\n🏠 LOCAL DATABASE TABLES:');
  console.log('=========================');
  
  try {
    const commonTables = ['customers', 'products', 'orders', 'payments', 'materials', 'staff'];
    
    for (const table of commonTables) {
      try {
        const { data, error } = await localSupabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ ${table}: ${data?.length || 0} records (exists)`);
          if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (e) {
        console.log(`❌ ${table}: Does not exist or no access`);
      }
    }
    
  } catch (error) {
    console.error('Error checking local:', error.message);
  }
}

inspectDatabases();
