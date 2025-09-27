CREATE POLICY "Public read access for product images" ON storage.objects FOR SELECT USING (bucket_id = 'product_images');
