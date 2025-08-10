-- Bilda Additional Tables Setup
-- Run this after the simple setup to add challenges, kudos, and comments

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏆',
  color TEXT NOT NULL DEFAULT 'bg-orange-500',
  duration INTEGER NOT NULL, -- in days
  goal TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- 0-100
  score INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- Create session_kudos table for likes/hearts
CREATE TABLE public.session_kudos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Create session_comments table
CREATE TABLE public.session_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on additional tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_comments ENABLE ROW LEVEL SECURITY;

-- Challenges policies  
CREATE POLICY "Anyone can view challenges" ON public.challenges
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage challenges" ON public.challenges
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@bilda.dev'
  ));

-- Challenge participants policies
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Session kudos policies
CREATE POLICY "Anyone can view session kudos" ON public.session_kudos
  FOR SELECT USING (true);

CREATE POLICY "Users can add kudos" ON public.session_kudos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own kudos" ON public.session_kudos
  FOR DELETE USING (auth.uid() = user_id);

-- Session comments policies
CREATE POLICY "Anyone can view session comments" ON public.session_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can add comments" ON public.session_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.session_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.session_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for additional tables
CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX idx_session_kudos_session_id ON public.session_kudos(session_id);
CREATE INDEX idx_session_comments_session_id ON public.session_comments(session_id);

-- Insert sample challenges
INSERT INTO public.challenges (name, description, emoji, color, duration, goal) VALUES
('7-Day Build Streak', 'Build something every day for 7 days straight', '🔥', 'bg-orange-500', 7, '7 sessions in 7 days'),
('100 Hours Milestone', 'Log 100 hours of building time', '⏰', 'bg-blue-500', 30, '100 hours total'),
('Consistent Builder', 'Complete at least 20 sessions this week', '🎯', 'bg-green-500', 7, '20 sessions this week'),
('Early Bird', 'Build before 9 AM for 5 days', '🌅', 'bg-yellow-500', 5, '5 early morning sessions');

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 

-- Live sessions (for streaming active sessions)
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  mood INTEGER,
  viewers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live sessions" ON public.live_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can start their live session" ON public.live_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can stop their live session" ON public.live_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_live_sessions_user_id ON public.live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_started_at ON public.live_sessions(started_at DESC);

-- =============================================
-- Social graph, notifications, and visibility
-- =============================================

-- Public profiles for users
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  links JSONB,
  auto_share_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles are public read" ON public.profiles;
CREATE POLICY "profiles are public read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user can manage own profile" ON public.profiles;
CREATE POLICY "user can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

-- Follow relationships
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read follows" ON public.follows;
CREATE POLICY "read follows" ON public.follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "write own follows" ON public.follows;
CREATE POLICY "write own follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "unfollow self" ON public.follows;
CREATE POLICY "unfollow self" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- like, comment, follow, mention
  actor_id UUID REFERENCES auth.users(id),
  entity_type TEXT,
  entity_id UUID,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own notifications" ON public.notifications;
CREATE POLICY "read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Allow server-side/edge function inserts; for client-side, scope via RPC if needed
DROP POLICY IF EXISTS "insert notifications" ON public.notifications;
CREATE POLICY "insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ---------------------------------------------
-- Visibility for public projects/sessions
-- ---------------------------------------------

-- Allow public read of projects marked public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Anyone can view public projects'
  ) THEN
    CREATE POLICY "Anyone can view public projects" ON public.projects
      FOR SELECT USING (is_public = true OR auth.uid() = user_id);
  END IF;
END $$;

-- Sessions: add soft-delete and metrics for enrichment
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS metrics JSONB;

-- Allow viewing sessions if owned or the parent project is public and session not deleted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'View own or public project sessions'
  ) THEN
    CREATE POLICY "View own or public project sessions" ON public.sessions
      FOR SELECT USING (
        is_deleted = false AND (
          auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true
          )
        )
      );
  END IF;
END $$;

-- Ensure existing update/delete policies do not expose deleted content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Update own sessions'
  ) THEN
    CREATE POLICY "Update own sessions" ON public.sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Delete own sessions'
  ) THEN
    CREATE POLICY "Delete own sessions" ON public.sessions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_not_deleted ON public.sessions(is_deleted) WHERE is_deleted = false;

-- Triggers for updated_at on new tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------
-- Trust & safety (minimal scaffolding)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- session, comment, project, ship
  entity_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert own reports" ON public.reports;
CREATE POLICY "insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "read reports (admins via backend)" ON public.reports;
CREATE POLICY "read reports (admins via backend)" ON public.reports
  FOR SELECT USING (false);

-- =============================================
-- Live session enhancements
-- =============================================

-- Live comments for live sessions
CREATE TABLE IF NOT EXISTS public.live_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live comments" ON public.live_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add live comments" ON public.live_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_live_comments_session_id ON public.live_comments(live_session_id);
CREATE INDEX IF NOT EXISTS idx_live_comments_created_at ON public.live_comments(created_at DESC);

-- Functions for viewer count management
CREATE OR REPLACE FUNCTION public.increment_live_viewers(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.live_sessions 
  SET viewers_count = COALESCE(viewers_count, 0) + 1
  WHERE id = session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_live_viewers(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.live_sessions 
  SET viewers_count = GREATEST(COALESCE(viewers_count, 0) - 1, 0)
  WHERE id = session_id;
END;
$$;

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample challenges
INSERT INTO public.challenges (id, name, description, emoji, color, duration, goal, is_active) VALUES
  (gen_random_uuid(), '7-Day Build Streak', 'Build something every day for 7 days straight', '🔥', 'bg-orange-500', 7, '7 sessions in 7 days', true),
  (gen_random_uuid(), '100 Hours Club', 'Log 100 hours of building time this month', '⏰', 'bg-blue-500', 30, '100 hours total', true),
  (gen_random_uuid(), 'Weekend Warrior', 'Complete 5 build sessions over the weekend', '⚡', 'bg-purple-500', 3, '5 sessions in 3 days', true),
  (gen_random_uuid(), 'Morning Builder', 'Start your day with building for 7 days', '🌅', 'bg-yellow-500', 7, '7 morning sessions', true),
  (gen_random_uuid(), 'Ship It Challenge', 'Deploy 3 projects this month', '🚀', 'bg-green-500', 30, '3 deployments', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Channel Points System
-- =============================================

-- Channel Points System Tables
CREATE TABLE IF NOT EXISTS public.channel_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streamer_id)
);

CREATE TABLE IF NOT EXISTS public.channel_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  icon TEXT DEFAULT '🎁',
  is_enabled BOOLEAN DEFAULT true,
  cooldown INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID REFERENCES public.channel_rewards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'denied'))
);

-- Enable RLS on channel points tables
ALTER TABLE public.channel_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Channel points policies
CREATE POLICY "Users can view their own points" ON public.channel_points
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = streamer_id);

CREATE POLICY "Streamers can manage points" ON public.channel_points
  FOR ALL USING (auth.uid() = streamer_id);

-- Channel rewards policies
CREATE POLICY "Anyone can view channel rewards" ON public.channel_rewards
  FOR SELECT USING (true);

CREATE POLICY "Streamers can manage their rewards" ON public.channel_rewards
  FOR ALL USING (auth.uid() = streamer_id);

-- Reward redemptions policies
CREATE POLICY "Users can view their redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = streamer_id);

CREATE POLICY "Users can redeem rewards" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Streamers can manage redemptions" ON public.reward_redemptions
  FOR UPDATE USING (auth.uid() = streamer_id);

-- Create indexes for channel points tables
CREATE INDEX idx_channel_points_user_id ON public.channel_points(user_id);
CREATE INDEX idx_channel_points_streamer_id ON public.channel_points(streamer_id);
CREATE INDEX idx_channel_rewards_streamer_id ON public.channel_rewards(streamer_id);
CREATE INDEX idx_reward_redemptions_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_streamer_id ON public.reward_redemptions(streamer_id);

-- Add triggers for updated_at on channel points tables
CREATE TRIGGER update_channel_points_updated_at BEFORE UPDATE ON public.channel_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_rewards_updated_at BEFORE UPDATE ON public.channel_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample channel rewards (these will be available for all streamers)
INSERT INTO public.channel_rewards (streamer_id, name, description, cost, icon, is_enabled, cooldown) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Highlight Message', 'Highlight your message in chat', 100, '💬', true, 30),
  ('00000000-0000-0000-0000-000000000000', 'Ask Question', 'Ask the streamer a question', 200, '❓', true, 60),
  ('00000000-0000-0000-0000-000000000000', 'Request Feature', 'Request a feature for the project', 500, '🚀', true, 300),
  ('00000000-0000-0000-0000-000000000000', 'Code Review', 'Get your code reviewed by the streamer', 1000, '👨‍💻', true, 600),
  ('00000000-0000-0000-0000-000000000000', 'Pair Programming', 'Pair program with the streamer for 10 minutes', 2000, '👥', true, 1800)
ON CONFLICT DO NOTHING;
