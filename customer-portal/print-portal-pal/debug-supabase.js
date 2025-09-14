// Quick debug script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ytnsjmbhgwcuwmnflncl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bnNqbWJoZ3djdXdtbmZsbmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzUyNzEsImV4cCI6MjA2MzE1MTI3MX0.dOHH5M5D4jBIYOP0nEHlTd34kwUeKgfu5YUICUkDjeU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.error('Database connection error:', error);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Check auth session
    const { data: session } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    // Test 3: Check if customers table is accessible
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')
      .limit(5);
    
    if (customerError) {
      console.error('Customers table error:', customerError);
    } else {
      console.log('✅ Customers table accessible, found', customers?.length, 'records');
    }
    
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testConnection();
