-- Create the order-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Use distinct policy names to avoid conflicts with other buckets
-- Policy to allow authenticated users to upload files to order-files
DROP POLICY IF EXISTS "order_files_insert_auth" ON storage.objects;
CREATE POLICY "order_files_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');

-- Policy to allow authenticated users to view files in order-files
DROP POLICY IF EXISTS "order_files_select_auth" ON storage.objects;
CREATE POLICY "order_files_select_auth"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-files');

-- Policy to allow public access to order-files
DROP POLICY IF EXISTS "order_files_select_public" ON storage.objects;
CREATE POLICY "order_files_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-files');

-- Policy to allow authenticated users to delete files in order-files
DROP POLICY IF EXISTS "order_files_delete_auth" ON storage.objects;
CREATE POLICY "order_files_delete_auth"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-files');
