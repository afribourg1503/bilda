import { supabase } from './supabase';

// Stream Settings API
export const getStreamSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('stream_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
};

export const saveStreamSettings = async (userId: string, settings: any) => {
  const { data, error } = await supabase
    .from('stream_settings')
    .upsert({
      user_id: userId,
      ...settings
    })
    .select()
    .single();

  return { data, error };
};

// Chat Commands API
export const getChatCommands = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_commands')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .order('command');

  return { data, error };
};

export const addChatCommand = async (userId: string, command: any) => {
  const { data, error } = await supabase
    .from('chat_commands')
    .insert({
      user_id: userId,
      ...command
    })
    .select()
    .single();

  return { data, error };
};

export const updateChatCommand = async (commandId: string, updates: any) => {
  const { data, error } = await supabase
    .from('chat_commands')
    .update(updates)
    .eq('id', commandId)
    .select()
    .single();

  return { data, error };
};

export const deleteChatCommand = async (commandId: string) => {
  const { error } = await supabase
    .from('chat_commands')
    .delete()
    .eq('id', commandId);

  return { error };
};

export const toggleChatCommand = async (commandId: string, isEnabled: boolean) => {
  const { data, error } = await supabase
    .from('chat_commands')
    .update({ is_enabled: isEnabled })
    .eq('id', commandId)
    .select()
    .single();

  return { data, error };
};

// Bot Settings API
export const getBotSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bot_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
};

export const saveBotSettings = async (userId: string, settings: any) => {
  const { data, error } = await supabase
    .from('bot_settings')
    .upsert({
      user_id: userId,
      ...settings
    })
    .select()
    .single();

  return { data, error };
};

// Command Execution API
export const executeCommand = async (liveSessionId: string, userId: string, command: string) => {
  try {
    // First, log the command usage
    const { error: logError } = await supabase
      .from('command_usage_log')
      .insert({
        live_session_id: liveSessionId,
        user_id: userId,
        command: command
      });

    if (logError) {
      console.error('Error logging command usage:', logError);
    }

    // Get the command response
    const { data: commandData, error: commandError } = await supabase
      .from('chat_commands')
      .select('*')
      .eq('command', command)
      .eq('is_enabled', true)
      .single();

    if (commandError || !commandData) {
      return { data: null, error: 'Command not found or disabled' };
    }

    // Check if user can execute this command based on user level
    const canExecute = await checkUserLevelForCommand(userId, liveSessionId, commandData.userLevel);
    
    if (!canExecute) {
      return { data: null, error: 'Insufficient permissions for this command' };
    }

    // Check cooldown
    const cooldownCheck = await checkCommandCooldown(liveSessionId, userId, command);
    if (cooldownCheck.error || !cooldownCheck.data) {
      return { data: null, error: 'Command is on cooldown' };
    }

    return { data: commandData, error: null };
  } catch (error) {
    console.error('Error executing command:', error);
    return { data: null, error: 'Failed to execute command' };
  }
};

export const checkCommandCooldown = async (liveSessionId: string, userId: string, command: string) => {
  const { data, error } = await supabase
    .rpc('can_execute_command', {
      p_user_id: userId,
      p_live_session_id: liveSessionId,
      p_command: command
    });

  return { data, error };
};

// Check if user has the required level to execute a command
export const checkUserLevelForCommand = async (userId: string, liveSessionId: string, requiredLevel: string): Promise<boolean> => {
  try {
    // Get the streamer ID from the live session
    const { data: sessionData } = await supabase
      .from('live_sessions')
      .select('user_id')
      .eq('id', liveSessionId)
      .single();

    if (!sessionData) return false;

    const streamerId = sessionData.user_id;

    // If user is the streamer, they can execute any command
    if (userId === streamerId) return true;

    // Check if required level is 'everyone' - always allowed
    if (requiredLevel === 'everyone') return true;

    // For now, implement basic follower check
    // TODO: Add subscriber and moderator checks
    if (requiredLevel === 'follower') {
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', streamerId)
        .single();

      return !!followData;
    }

    // For subscriber and moderator levels, return false for now
    // TODO: Implement these checks when subscription system is added
    return false;

  } catch (error) {
    console.error('Error checking user level for command:', error);
    return false;
  }
};

// Chat Moderation API
export const getModerationActions = async (liveSessionId: string) => {
  const { data, error } = await supabase
    .from('chat_moderation_actions')
    .select(`
      *,
      moderator:moderator_id(id, email),
      target_user:target_user_id(id, email)
    `)
    .eq('live_session_id', liveSessionId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const addModerationAction = async (action: any) => {
  const { data, error } = await supabase
    .from('chat_moderation_actions')
    .insert(action)
    .select()
    .single();

  return { data, error };
};

export const timeoutUser = async (liveSessionId: string, moderatorId: string, targetUserId: string, duration: number, reason?: string) => {
  return addModerationAction({
    live_session_id: liveSessionId,
    moderator_id: moderatorId,
    target_user_id: targetUserId,
    action_type: 'timeout',
    duration: duration,
    reason: reason || 'No reason provided'
  });
};

export const banUser = async (liveSessionId: string, moderatorId: string, targetUserId: string, reason?: string) => {
  return addModerationAction({
    live_session_id: liveSessionId,
    moderator_id: moderatorId,
    target_user_id: targetUserId,
    action_type: 'ban',
    reason: reason || 'No reason provided'
  });
};

export const warnUser = async (liveSessionId: string, moderatorId: string, targetUserId: string, reason?: string) => {
  return addModerationAction({
    live_session_id: liveSessionId,
    moderator_id: moderatorId,
    target_user_id: targetUserId,
    action_type: 'warn',
    reason: reason || 'No reason provided'
  });
};

// Stream Analytics API
export const getStreamAnalytics = async (liveSessionId: string) => {
  const { data, error } = await supabase
    .from('stream_analytics')
    .select('*')
    .eq('live_session_id', liveSessionId)
    .single();

  return { data, error };
};

export const updateStreamAnalytics = async (liveSessionId: string, updates: any) => {
  const { data, error } = await supabase
    .from('stream_analytics')
    .upsert({
      live_session_id: liveSessionId,
      ...updates
    })
    .select()
    .single();

  return { data, error };
};

export const incrementChatMessages = async (liveSessionId: string) => {
  const { data: current } = await getStreamAnalytics(liveSessionId);
  
  if (current) {
    return updateStreamAnalytics(liveSessionId, {
      total_chat_messages: (current.total_chat_messages || 0) + 1
    });
  } else {
    return updateStreamAnalytics(liveSessionId, {
      total_chat_messages: 1
    });
  }
};

export const incrementCommandsUsed = async (liveSessionId: string) => {
  const { data: current } = await getStreamAnalytics(liveSessionId);
  
  if (current) {
    return updateStreamAnalytics(liveSessionId, {
      total_commands_used: (current.total_commands_used || 0) + 1
    });
  } else {
    return updateStreamAnalytics(liveSessionId, {
      total_commands_used: 1
    });
  }
};

export const updatePeakViewers = async (liveSessionId: string, currentViewers: number) => {
  const { data: current } = await getStreamAnalytics(liveSessionId);
  
  if (current && current.peak_viewers && current.peak_viewers >= currentViewers) {
    return { data: current, error: null };
  }
  
  return updateStreamAnalytics(liveSessionId, {
    peak_viewers: currentViewers
  });
};

// Real-time subscriptions
export const subscribeToChatCommands = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`chat_commands_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_commands',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
};

export const subscribeToModerationActions = (liveSessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`moderation_${liveSessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_moderation_actions',
      filter: `live_session_id=eq.${liveSessionId}`
    }, callback)
    .subscribe();
};

export const subscribeToStreamAnalytics = (liveSessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`analytics_${liveSessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'stream_analytics',
      filter: `live_session_id=eq.${liveSessionId}`
    }, callback)
    .subscribe();
};

// Follow functionality
export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId
    })
    .select()
    .single();

  return { data, error };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .select()
    .single();

  return { data, error };
};

export const checkFollowStatus = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return { data: !!data, error };
};

// Channel Points functionality
export const getUserChannelPoints = async (userId: string, streamerId: string) => {
  try {
    // Check if user is following the streamer
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', streamerId)
      .single();

    if (!followData) {
      return { data: 0, error: null }; // Not following, no points
    }

    // For now, calculate points based on follow time and activity
    // In a real implementation, this would be stored in a channel_points table
    const followDate = new Date(followData.created_at || Date.now());
    const now = new Date();
    const daysFollowing = Math.floor((now.getTime() - followDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Base points: 100 per day following, max 1000
    const basePoints = Math.min(daysFollowing * 100, 1000);
    
    // Add bonus points for being active (placeholder)
    const bonusPoints = 200;
    
    return { data: basePoints + bonusPoints, error: null };
  } catch (error) {
    console.error('Error getting channel points:', error);
    return { data: 0, error };
  }
};

export const redeemChannelPoints = async (userId: string, streamerId: string, rewardId: string, cost: number) => {
  try {
    // Get current points
    const { data: currentPoints } = await getUserChannelPoints(userId, streamerId);
    
    if (currentPoints < cost) {
      return { data: null, error: 'Insufficient channel points' };
    }

    // In a real implementation, this would update a channel_points table
    // For now, we'll just return success
    // TODO: Implement actual points deduction and reward logging
    
    return { data: { success: true, remainingPoints: currentPoints - cost }, error: null };
  } catch (error) {
    console.error('Error redeeming channel points:', error);
    return { data: null, error };
  }
};
