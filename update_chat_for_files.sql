-- Update order_chat_messages table to support file attachments
-- Run this in your Supabase SQL Editor

-- Add file-related columns to order_chat_messages if they don't exist
ALTER TABLE order_chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Create the chat-files storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat files (drop if exists, then create)
-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files');

-- Allow public access to view files
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'chat-files');

-- Allow authenticated users to delete their own files  
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chat-files');

-- Verify the changes
SELECT 'Updated table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_chat_messages'
AND column_name IN ('file_url', 'file_name', 'file_size', 'file_type')
ORDER BY column_name;

-- Check storage bucket
SELECT 'Storage bucket:' as info;
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'chat-files';

-- Storage policies created successfully
SELECT 'Storage setup completed' as info;
