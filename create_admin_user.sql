-- Create an admin user in auth.users table for order chat functionality
-- Run this in your Supabase SQL Editor

-- Check if admin user already exists
SELECT 'CHECKING EXISTING ADMIN USER:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001'
   OR email = 'admin@classicoffset.com';

-- Insert admin user if it doesn't exist
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@classicoffset.com',
    '$2a$10$dummy.hash.for.admin.user.that.wont.login.normally',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User", "role": "admin"}',
    false,
    'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Also add to customers table if needed for relationships
INSERT INTO customers (
    id,
    user_id,
    name,
    email,
    phone,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@classicoffset.com',
    '+1234567890',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin user was created
SELECT 'ADMIN USER CREATED:' as info;
SELECT 
    au.id,
    au.email,
    au.created_at,
    c.name as customer_name
FROM auth.users au
LEFT JOIN customers c ON c.user_id = au.id
WHERE au.id = '00000000-0000-0000-0000-000000000001';
