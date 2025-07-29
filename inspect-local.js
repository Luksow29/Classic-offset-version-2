#!/usr/bin/env node

/**
 * Local Schema Inspector
 * Check what columns actually exist in local database
 */

import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54331',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
};

async function inspectLocalSchema() {
  console.log('🔍 Inspecting LOCAL database schema...');
  
  const localSupabase = createClient(LOCAL_CONFIG.url, LOCAL_CONFIG.key);
  
  // Get table info using information_schema
  const { data: tables, error } = await localSupabase
    .rpc('exec_sql', { 
      sql: `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name IN ('customers', 'products', 'orders', 'payments', 'materials')
        ORDER BY table_name, ordinal_position;
      `
    });
    
  if (error) {
    console.log('RPC not available, trying alternative approach...');
    
    // Alternative: Try to insert empty record to see available columns
    const testTables = ['customers', 'products', 'orders', 'payments', 'materials'];
    
    for (const tableName of testTables) {
      console.log(`\n📋 Table: ${tableName}`);
      try {
        // Try inserting minimal data to see what columns are required/available
        const { error: insertError } = await localSupabase
          .from(tableName)
          .insert({});
          
        if (insertError) {
          console.log(`   Error details: ${insertError.message}`);
          
          // Parse error message to extract column info
          if (insertError.message.includes('null value in column')) {
            const match = insertError.message.match(/null value in column "([^"]+)"/);
            if (match) {
              console.log(`   Required column: ${match[1]}`);
            }
          }
        }
      } catch (e) {
        console.log(`   ${tableName}: ${e.message}`);
      }
    }
    
  } else {
    console.log('Schema information:', tables);
  }
}

inspectLocalSchema();
