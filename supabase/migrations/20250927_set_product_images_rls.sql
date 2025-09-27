-- Set up Row Level Security (RLS) for the 'product_images' bucket.

-- 1. Enable RLS on the 'objects' table in the 'storage' schema.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows public read access to all images in the 'product_images' bucket.
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product_images' );

-- 3. Create a policy that allows authenticated users with an 'admin' role to upload images.
--    This policy assumes you have a 'users' table with a 'role' column.
CREATE POLICY "Allow admin to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product_images' AND
  auth.role() = 'admin'
);

-- 4. Create a policy that allows authenticated users with an 'admin' role to update images.
CREATE POLICY "Allow admin to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product_images' AND
  auth.role() = 'admin'
);

-- 5. Create a policy that allows authenticated users with an 'admin' role to delete images.
CREATE POLICY "Allow admin to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product_images' AND
  auth.role() = 'admin'
);
