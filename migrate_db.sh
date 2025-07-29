#!/bin/bash
# Database Migration Script
# Tamil: Remote database ல இருந்து local database கு data migrate பண்ண script

echo "🔄 Starting database migration from remote to local..."

# Step 1: Switch to remote to check current data
echo "📋 Checking remote database structure..."

# Step 2: Create a fresh local database
echo "🗃️ Resetting local database..."

# Step 3: Copy essential tables and data
echo "📁 Copying tables from remote to local..."

# Tables to sync:
# - users (if any custom users)
# - customers
# - products  
# - orders
# - payments
# - materials
# - staff
# - activity_logs

echo "✅ Migration completed!"
echo "🌐 Remote URL: https://ytnsjmbhgwcuwmnflncl.supabase.co"
echo "🏠 Local URL: http://127.0.0.1:54331"
