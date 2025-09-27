// Quick test script to verify admin Supabase connection
// Run this in the browser console of your admin app

// Test 1: Check if supabase client is available
console.log('Testing Supabase connection...');
console.log('Supabase client available:', typeof window.supabase !== 'undefined');

// Test 2: Try to select from order_chat_messages
async function testSelect() {
  try {
    const { data, error } = await supabase
      .from('order_chat_messages')
      .select('*')
      .limit(1);
    
    console.log('SELECT test - data:', data);
    console.log('SELECT test - error:', error);
  } catch (err) {
    console.error('SELECT test failed:', err);
  }
}

// Test 3: Try to insert a test message
async function testInsert() {
  try {
    const testData = {
      thread_id: 'test-thread-id',
      sender_id: 'admin-user-id',
      sender_type: 'admin',
      message_type: 'text',
      content: 'Test message from admin'
    };
    
    console.log('Attempting to insert:', testData);
    
    const { data, error } = await supabase
      .from('order_chat_messages')
      .insert(testData)
      .select();
    
    console.log('INSERT test - data:', data);
    console.log('INSERT test - error:', error);
  } catch (err) {
    console.error('INSERT test failed:', err);
  }
}

console.log('Run testSelect() and testInsert() to test Supabase connection');
