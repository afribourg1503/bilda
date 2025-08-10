-- Bilda Missing Tables Setup
-- This script only creates tables that don't exist yet
-- Run this in your Supabase SQL Editor

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  links JSONB DEFAULT '{}',
  auto_share_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  mood INTEGER DEFAULT 3,
  viewers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.live_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  user_role TEXT DEFAULT 'viewer' CHECK (user_role IN ('streamer', 'viewer', 'moderator', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel_points table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.channel_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streamer_id)
);

-- Create channel_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.channel_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_redemptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID REFERENCES public.channel_rewards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected'))
);

-- Create chat_commands table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command TEXT NOT NULL,
  response TEXT NOT NULL,
  cooldown INTEGER DEFAULT 0,
  user_level TEXT DEFAULT 'viewer' CHECK (user_level IN ('viewer', 'follower', 'subscriber', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(streamer_id, command)
);

-- Create stream_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stream_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  peak_viewers INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  total_follows INTEGER DEFAULT 0,
  avg_watch_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_id ON public.live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_started_at ON public.live_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_comments_session_id ON public.live_comments(live_session_id);
CREATE INDEX IF NOT EXISTS idx_live_comments_created_at ON public.live_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_points_user_id ON public.channel_points(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_points_streamer_id ON public.channel_points(streamer_id);
CREATE INDEX IF NOT EXISTS idx_channel_rewards_streamer_id ON public.channel_rewards(streamer_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_streamer_id ON public.reward_redemptions(streamer_id);
CREATE INDEX IF NOT EXISTS idx_chat_commands_streamer_id ON public.chat_commands(streamer_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_session_id ON public.stream_analytics(live_session_id);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_channel_points_updated_at ON public.channel_points;
CREATE TRIGGER update_channel_points_updated_at BEFORE UPDATE ON public.channel_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_channel_rewards_updated_at ON public.channel_rewards;
CREATE TRIGGER update_channel_rewards_updated_at BEFORE UPDATE ON public.channel_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create or replace the increment_live_viewers function
CREATE OR REPLACE FUNCTION public.increment_live_viewers(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.live_sessions 
  SET viewers_count = viewers_count + 1 
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the decrement_live_viewers function
CREATE OR REPLACE FUNCTION public.decrement_live_viewers(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.live_sessions 
  SET viewers_count = GREATEST(viewers_count - 1, 0) 
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Live sessions policies
DROP POLICY IF EXISTS "Anyone can view live sessions" ON public.live_sessions;
CREATE POLICY "Anyone can view live sessions" ON public.live_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can start their own live session" ON public.live_sessions;
CREATE POLICY "Users can start their own live session" ON public.live_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own live session" ON public.live_sessions;
CREATE POLICY "Users can update their own live session" ON public.live_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Live comments policies
DROP POLICY IF EXISTS "Anyone can view live comments" ON public.live_comments;
CREATE POLICY "Anyone can view live comments" ON public.live_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add live comments" ON public.live_comments;
CREATE POLICY "Users can add live comments" ON public.live_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Channel points policies
DROP POLICY IF EXISTS "Users can view their own channel points" ON public.channel_points;
CREATE POLICY "Users can view their own channel points" ON public.channel_points
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = streamer_id);

DROP POLICY IF EXISTS "Users can update their own channel points" ON public.channel_points;
CREATE POLICY "Users can update their own channel points" ON public.channel_points
  FOR UPDATE USING (auth.uid() = streamer_id);

-- Channel rewards policies
DROP POLICY IF EXISTS "Anyone can view channel rewards" ON public.channel_rewards;
CREATE POLICY "Anyone can view channel rewards" ON public.channel_rewards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Streamers can manage their rewards" ON public.channel_rewards;
CREATE POLICY "Streamers can manage their rewards" ON public.channel_rewards
  FOR ALL USING (auth.uid() = streamer_id);

-- Chat commands policies
DROP POLICY IF EXISTS "Anyone can view chat commands" ON public.chat_commands;
CREATE POLICY "Anyone can view chat commands" ON public.chat_commands
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Streamers can manage their commands" ON public.chat_commands;
CREATE POLICY "Streamers can manage their commands" ON public.chat_commands
  FOR ALL USING (auth.uid() = streamer_id);

-- Stream analytics policies
DROP POLICY IF EXISTS "Streamers can view their analytics" ON public.stream_analytics;
CREATE POLICY "Streamers can view their analytics" ON public.stream_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Streamers can manage their analytics" ON public.stream_analytics;
CREATE POLICY "Streamers can manage their analytics" ON public.stream_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert some sample data for testing (optional)
-- You can comment these out if you don't want sample data
INSERT INTO public.challenges (name, description, emoji, color, duration, goal) VALUES
  ('Build in Public', 'Share your building journey with the community', '🚀', 'bg-blue-500', 30, 'Build and share something amazing'),
  ('Code Every Day', 'Write code every single day for a month', '💻', 'bg-green-500', 30, 'Establish a daily coding habit')
ON CONFLICT DO NOTHING;

-- ✅ All missing tables created successfully!
-- You can verify by checking the Tables section in your Supabase dashboard
