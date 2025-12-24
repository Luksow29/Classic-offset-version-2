-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  created_by JSONB, -- Stores {id, name, role} snapshot
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Create team_chat_messages table
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_role TEXT
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Allow authenticated read access to chat_rooms"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to chat_rooms"
  ON public.chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to chat_rooms"
  ON public.chat_rooms FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for team_chat_messages
CREATE POLICY "Allow authenticated read access to team_chat_messages"
  ON public.team_chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to team_chat_messages"
  ON public.team_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create admin_notifications table (replaces Firestore 'notifications' collection)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  link_to TEXT,
  related_id TEXT,
  triggered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- RLS for admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read admin_notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert admin_notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update admin_notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (true);

-- Create activity_logs table (replaces Firestore 'activity_logs' collection)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read activity_logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert activity_logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create realtime publication
alter publication supabase_realtime add table chat_rooms;
alter publication supabase_realtime add table team_chat_messages;
alter publication supabase_realtime add table admin_notifications;
alter publication supabase_realtime add table activity_logs;
