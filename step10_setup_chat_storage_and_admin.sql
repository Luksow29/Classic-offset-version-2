-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for chat files
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view chat files" ON storage.objects
FOR SELECT TO public 
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE TO authenticated 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for chat notifications to admin users
-- Note: This assumes you have a way to identify admin users
-- You might need to adjust this based on your user role system

-- Allow admins to see all chat threads
CREATE POLICY "Admins can view all chat threads" ON public.order_chat_threads
FOR SELECT TO authenticated
USING (
  -- Replace this condition with your admin user identification logic
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE id = auth.uid() 
    -- Add your admin identification logic here
  )
);

-- Allow admins to update chat thread status
CREATE POLICY "Admins can update chat threads" ON public.order_chat_threads
FOR UPDATE TO authenticated
USING (
  -- Replace this condition with your admin user identification logic
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
    -- Add your admin identification logic here
  )
);

-- Allow admins to view all chat messages
CREATE POLICY "Admins can view all chat messages" ON public.order_chat_messages
FOR SELECT TO authenticated
USING (
  -- Replace this condition with your admin user identification logic
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
    -- Add your admin identification logic here
  )
);

-- Allow admins to insert messages
CREATE POLICY "Admins can send messages" ON public.order_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'admin' AND
  -- Replace this condition with your admin user identification logic
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
    -- Add your admin identification logic here
  )
);
