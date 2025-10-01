# OrderChat System Troubleshooting Guide

## Problem: "Failed to create new chat thread"

### Most Common Causes & Solutions:

## 1. 🔥 **Database Tables Don't Exist** (Most Likely Issue)
**Symptoms:** 
- Red "Debug DB" button shows "TABLES_NOT_EXIST" error
- Console shows: `relation "order_chat_threads" does not exist`

**Solution:**
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `step9_create_chat_system_simplified.sql`
4. Click "Run" to execute the SQL
5. Verify tables were created in Database → Tables

---

## 2. 🔐 **User Not Logged In**
**Symptoms:**
- Red "Debug DB" button shows "NOT_AUTHENTICATED" error
- No user session found

**Solution:**
1. Make sure you're logged into the customer portal
2. Check the authentication state in browser developer tools
3. If not logged in, use the sign-in functionality

---

## 3. 🛡️ **RLS Policies Too Restrictive**
**Symptoms:**
- Red "Debug DB" button shows "PERMISSION_DENIED" error
- Tables exist but queries fail

**Solution:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Find `order_chat_threads` and `order_chat_messages` tables
3. Temporarily disable RLS to test:
   ```sql
   ALTER TABLE public.order_chat_threads DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.order_chat_messages DISABLE ROW LEVEL SECURITY;
   ```
4. Test chat functionality
5. If working, the issue is RLS policies - use the simplified version

---

## 4. 🔗 **Foreign Key Constraint Issues**
**Symptoms:**
- Can create threads but fails with FK constraint errors
- Error mentions `orders` table

**Solution:**
1. Make sure the `orders` table exists and has data
2. Use a valid `order_id` when testing
3. If needed, temporarily remove FK constraints in the simplified SQL

---

## Testing Steps:

### Step 1: Test Database Connection
1. Go to any order in the customer portal
2. Click the red "Debug DB" button
3. Check the alert message:
   - ✅ "SUCCESS" = All working correctly
   - ❌ "TABLES_NOT_EXIST" = Run the SQL script
   - ❌ "NOT_AUTHENTICATED" = Log in first
   - ❌ "PERMISSION_DENIED" = Check RLS policies

### Step 2: Test Chat Creation
1. After fixing any database issues
2. Click "Chat About Order" button
3. Click "Start New Chat"
4. Fill in subject and message
5. Click "Start Chat"
6. Check browser console for detailed error messages

### Step 3: Verify Real-time Updates
1. Create a chat thread successfully
2. Send a message
3. Check if it appears in the chat interface
4. Verify message count updates

---

## Files to Execute in Order:

1. **First:** `step9_create_chat_system_simplified.sql` - Core chat tables
2. **Second:** `step10_setup_chat_storage_and_admin.sql` - Storage and admin features (optional)

---

## Quick Fix Commands (Execute in Supabase SQL Editor):

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'order_chat_%';

-- Check current user
SELECT auth.uid(), auth.email();

-- Test basic select (should work if tables exist and RLS allows)
SELECT COUNT(*) FROM public.order_chat_threads;
```

---

## Remove Debug Button (After Fix):
Once everything is working, remove the debug button by deleting these lines from `OrderChat.tsx`:
- Import: `import { testDatabaseConnection } from '@/lib/chatDebug';`
- Debug function: `const handleDebugTest = ...`
- Debug button: `<Button variant="destructive"...Debug DB</Button>`
- Change container from `flex gap-2` back to original class
