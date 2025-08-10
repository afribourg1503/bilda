-- Bilda Live Features Database Setup
-- Run these commands in your Supabase SQL editor to add live streaming features

-- Create stream_settings table for streamer configuration
CREATE TABLE IF NOT EXISTS public.stream_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Live Building Session',
  description TEXT DEFAULT 'Join me as I build something amazing live!',
  category TEXT DEFAULT 'Programming',
  tags TEXT[] DEFAULT ARRAY['coding', 'building', 'live', 'programming'],
  language TEXT DEFAULT 'en',
  mature_content BOOLEAN DEFAULT false,
  resolution TEXT DEFAULT '1080p',
  frame_rate INTEGER DEFAULT 60,
  bitrate INTEGER DEFAULT 6000,
  audio_bitrate INTEGER DEFAULT 128,
  audio_channels INTEGER DEFAULT 2,
  audio_sample_rate INTEGER DEFAULT 48000,
  chat_enabled BOOLEAN DEFAULT true,
  slow_mode BOOLEAN DEFAULT false,
  slow_mode_interval INTEGER DEFAULT 3,
  followers_only BOOLEAN DEFAULT false,
  subscribers_only BOOLEAN DEFAULT false,
  emote_only BOOLEAN DEFAULT false,
  auto_mod_level TEXT DEFAULT 'medium',
  block_links BOOLEAN DEFAULT true,
  block_caps BOOLEAN DEFAULT false,
  max_message_length INTEGER DEFAULT 200,
  notify_followers BOOLEAN DEFAULT true,
  notify_subscribers BOOLEAN DEFAULT true,
  social_media_share BOOLEAN DEFAULT true,
  recording_enabled BOOLEAN DEFAULT true,
  vod_enabled BOOLEAN DEFAULT true,
  clip_enabled BOOLEAN DEFAULT true,
  stream_key TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create chat_commands table for custom commands
CREATE TABLE IF NOT EXISTS public.chat_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command TEXT NOT NULL,
  response TEXT NOT NULL,
  description TEXT DEFAULT 'Custom command',
  is_enabled BOOLEAN DEFAULT true,
  cooldown INTEGER DEFAULT 30, -- in seconds
  user_level TEXT DEFAULT 'everyone', -- everyone, follower, subscriber, moderator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, command)
);

-- Create chat_moderation_actions table for moderation history
CREATE TABLE IF NOT EXISTS public.chat_moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- timeout, ban, delete_message, warn
  reason TEXT,
  duration INTEGER, -- for timeouts, in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bot_settings table for automated bot behavior
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  auto_greet BOOLEAN DEFAULT true,
  auto_thank_followers BOOLEAN DEFAULT true,
  auto_thank_subscribers BOOLEAN DEFAULT true,
  welcome_message TEXT DEFAULT 'Welcome @{username} to the stream! 🎉',
  follower_message TEXT DEFAULT 'Thanks for following @{username}! 🙏',
  subscriber_message TEXT DEFAULT 'Welcome to the family @{username}! 💖',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create command_usage_log table for tracking command usage
CREATE TABLE IF NOT EXISTS public.command_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_analytics table for tracking stream metrics
CREATE TABLE IF NOT EXISTS public.stream_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  peak_viewers INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_commands_used INTEGER DEFAULT 0,
  total_moderation_actions INTEGER DEFAULT 0,
  average_watch_time INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.stream_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stream_settings_user_id ON public.stream_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_commands_user_id ON public.chat_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_commands_command ON public.chat_commands(command);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_actions_live_session_id ON public.chat_moderation_actions(live_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_actions_target_user_id ON public.chat_moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_settings_user_id ON public.bot_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_command_usage_log_live_session_id ON public.command_usage_log(live_session_id);
CREATE INDEX IF NOT EXISTS idx_command_usage_log_user_id ON public.command_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_live_session_id ON public.stream_analytics(live_session_id);

-- Create RLS policies for stream_settings
CREATE POLICY "Users can view their own stream settings" ON public.stream_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stream settings" ON public.stream_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stream settings" ON public.stream_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stream settings" ON public.stream_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chat_commands
CREATE POLICY "Users can view their own chat commands" ON public.chat_commands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat commands" ON public.chat_commands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat commands" ON public.chat_commands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat commands" ON public.chat_commands
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chat_moderation_actions
CREATE POLICY "Users can view moderation actions in their streams" ON public.chat_moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Moderators can insert moderation actions" ON public.chat_moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for bot_settings
CREATE POLICY "Users can view their own bot settings" ON public.bot_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot settings" ON public.bot_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot settings" ON public.bot_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bot settings" ON public.bot_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for command_usage_log
CREATE POLICY "Users can view command usage in their streams" ON public.command_usage_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert command usage logs" ON public.command_usage_log
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for stream_analytics
CREATE POLICY "Users can view their own stream analytics" ON public.stream_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own stream analytics" ON public.stream_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own stream analytics" ON public.stream_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions 
      WHERE id = live_session_id AND user_id = auth.uid()
    )
  );

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_stream_settings_updated_at BEFORE UPDATE ON public.stream_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_commands_updated_at BEFORE UPDATE ON public.chat_commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON public.bot_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default chat commands for new users
CREATE OR REPLACE FUNCTION insert_default_commands()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_commands (user_id, command, response, description, cooldown, user_level) VALUES
    (NEW.id, '!hello', 'Hello @{username}! Welcome to the stream! 👋', 'Greet viewers', 30, 'everyone'),
    (NEW.id, '!project', 'I''m currently working on my latest project! Check it out in my profile! 🚀', 'Show current project', 60, 'everyone'),
    (NEW.id, '!schedule', 'I stream every Monday, Wednesday, and Friday at 7 PM EST! 📅', 'Show streaming schedule', 600, 'everyone'),
    (NEW.id, '!help', 'Available commands: !hello, !project, !schedule, !help', 'Show available commands', 30, 'everyone');
  
  INSERT INTO public.bot_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to insert default commands when a user is created
CREATE TRIGGER insert_default_commands_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION insert_default_commands();

-- Create function to get user level for command execution
CREATE OR REPLACE FUNCTION get_user_level_for_commands(
  p_user_id UUID,
  p_streamer_id UUID
)
RETURNS TEXT AS $$
DECLARE
  user_level TEXT := 'everyone';
BEGIN
  -- Check if user is the streamer
  IF p_user_id = p_streamer_id THEN
    RETURN 'streamer';
  END IF;
  
  -- TODO: Add logic to check follower/subscriber status
  -- For now, return 'everyone'
  
  RETURN user_level;
END;
$$ language 'plpgsql';

-- Create function to check command cooldown
CREATE OR REPLACE FUNCTION can_execute_command(
  p_user_id UUID,
  p_live_session_id UUID,
  p_command TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  last_usage TIMESTAMP WITH TIME ZONE;
  cooldown_seconds INTEGER;
BEGIN
  -- Get the last usage time
  SELECT executed_at INTO last_usage
  FROM public.command_usage_log
  WHERE user_id = p_user_id 
    AND live_session_id = p_live_session_id 
    AND command = p_command
  ORDER BY executed_at DESC
  LIMIT 1;
  
  -- Get command cooldown
  SELECT cooldown INTO cooldown_seconds
  FROM public.chat_commands
  WHERE command = p_command
  LIMIT 1;
  
  -- If no cooldown set, allow execution
  IF cooldown_seconds IS NULL OR cooldown_seconds = 0 THEN
    RETURN true;
  END IF;
  
  -- If never used or cooldown expired, allow execution
  IF last_usage IS NULL OR 
     EXTRACT(EPOCH FROM (NOW() - last_usage)) >= cooldown_seconds THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ language 'plpgsql';
