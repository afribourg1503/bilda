import { supabase } from './supabase';
import type { Database } from './supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

type Session = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

type Challenge = Database['public']['Tables']['challenges']['Row'];
type ChallengeParticipant = Database['public']['Tables']['challenge_participants']['Row'];
type SessionKudos = Database['public']['Tables']['session_kudos']['Row'];
type SessionComment = Database['public']['Tables']['session_comments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Follow = Database['public']['Tables']['follows']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type LiveSession = Database['public']['Tables']['live_sessions']['Row'];
type LiveSessionInsert = Database['public']['Tables']['live_sessions']['Insert'];

// Project functions
export const createProject = async (project: ProjectInsert) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  
  return { data, error };
};

export const getProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const updateProject = async (id: string, updates: ProjectUpdate) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const deleteProject = async (id: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  return { error };
};

// Session functions
export const createSession = async (session: SessionInsert) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();
  
  return { data, error };
};

export const getSessions = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      projects (
        id,
        name,
        emoji,
        color
      )
    `)
    .eq('user_id', userId)
    .is('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

export const getSessionStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('duration, mood, created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
  
  return { data, error };
};

export const updateSession = async (id: string, updates: SessionUpdate) => {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const deleteSession = async (id: string) => {
  const { error } = await supabase
    .from('sessions')
    .update({ is_deleted: true })
    .eq('id', id);
  
  return { error };
};

export const switchSessionProject = async (sessionId: string, projectId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .update({ project_id: projectId })
    .eq('id', sessionId)
    .select()
    .single();
  return { data, error };
};

export const saveSessionMetrics = async (
  sessionId: string,
  metrics: {
    commits?: number;
    additions?: number;
    deletions?: number;
    filesChanged?: number;
    repos?: string[];
  }
) => {
  const { data, error } = await supabase
    .from('sessions')
    .update({ metrics })
    .eq('id', sessionId)
    .select()
    .single();
  return { data, error };
};

// Real-time subscriptions
export const subscribeToSessions = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('sessions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToProjects = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('projects')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

// Live sessions
export const startLiveSession = async (live: LiveSessionInsert) => {
  const { data, error } = await supabase
    .from('live_sessions')
    .insert(live)
    .select()
    .single();
  
  // Notify followers when someone goes live
  if (data && !error) {
    try {
      // Get followers of the user going live
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', live.user_id);
      
      if (followers && followers.length > 0) {
        // Get user profile for notification
        const { data: profile } = await getProfileByUserId(live.user_id);
        const displayName = profile?.handle || profile?.name || 'Someone you follow';
        
        // Create notifications for all followers
        const notifications = followers.map(follower => ({
          user_id: follower.follower_id,
          type: 'live_session',
          actor_id: live.user_id,
          entity_type: 'live_session',
          entity_id: data.id,
          data: {
            title: `${displayName} is now live!`,
            message: 'Tap to watch their live building session'
          }
        }));
        
        await supabase.from('notifications').insert(notifications);
      }
    } catch (notificationError) {
      console.error('Failed to create live session notifications:', notificationError);
      // Don't fail the main operation if notification fails
    }
  }
  
  return { data, error };
};

export const stopLiveSession = async (userId: string) => {
  const { error } = await supabase
    .from('live_sessions')
    .delete()
    .eq('user_id', userId);
  return { error };
};

// Clean up stale live sessions (older than 1 hour - more aggressive)
export const cleanupStaleLiveSessions = async () => {
  const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
  
  // First, get the sessions we're about to delete for logging
  const { data: staleSessions } = await supabase
    .from('live_sessions')
    .select('*')
    .lt('started_at', oneHourAgo);
  
  console.log(`🧹 Cleaning up ${staleSessions?.length || 0} stale live sessions older than 1 hour`);
  
  const { error } = await supabase
    .from('live_sessions')
    .delete()
    .lt('started_at', oneHourAgo);
    
  return { error, deletedCount: staleSessions?.length || 0 };
};

// Force stop a specific live session
export const forceStopLiveSession = async (liveSessionId: string) => {
  const { error } = await supabase
    .from('live_sessions')
    .delete()
    .eq('id', liveSessionId);
  return { error };
};

export const getLiveSessions = async () => {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .order('started_at', { ascending: false });
  return { data, error };
};

export const subscribeToLiveSessions = (callback: (payload: any) => void) => {
  return supabase
    .channel('live_sessions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, callback)
    .subscribe();
};

export const getLiveSessionByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return { data, error };
};

export const incrementLiveViewers = async (liveSessionId: string) => {
  const { error } = await supabase.rpc('increment_live_viewers', {
    session_id: liveSessionId
  });
  return { error };
};

export const decrementLiveViewers = async (liveSessionId: string) => {
  const { error } = await supabase.rpc('decrement_live_viewers', {
    session_id: liveSessionId
  });
  return { error };
};

// Live comments for live sessions
export const addLiveComment = async (comment: {
  live_session_id: string;
  user_id: string;
  message: string;
}) => {
  const { data, error } = await supabase
    .from('live_comments')
    .insert(comment)
    .select()
    .single();
  return { data, error };
};

export const getLiveComments = async (liveSessionId: string) => {
  const { data, error } = await supabase
    .from('live_comments')
    .select(`
      *,
      profiles!user_id ( handle, name, avatar_url )
    `)
    .eq('live_session_id', liveSessionId)
    .order('created_at', { ascending: true });
  return { data, error };
};

// Challenge functions
export const getChallenges = async () => {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      challenge_participants (
        id,
        user_id,
        progress,
        score,
        joined_at
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getChallenge = async (challengeId: string) => {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      challenge_participants (
        id,
        user_id,
        progress,
        score,
        joined_at,
        profiles!user_id ( handle, name, avatar_url )
      )
    `)
    .eq('id', challengeId)
    .single();
  
  return { data, error };
};

export const joinChallenge = async (challengeId: string, userId: string) => {
  const { data, error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      progress: 0,
      score: 0
    })
    .select()
    .single();
  
  return { data, error };
};

export const leaveChallenge = async (challengeId: string, userId: string) => {
  const { error } = await supabase
    .from('challenge_participants')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);
  
  return { error };
};

export const getUserChallenges = async (userId: string) => {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges (
        id,
        name,
        description,
        emoji,
        color,
        duration,
        goal
      )
    `)
    .eq('user_id', userId);
  
  return { data, error };
};

export const updateChallengeProgress = async (challengeId: string, userId: string, progress: number, score?: number) => {
  const updateData: any = { progress };
  if (score !== undefined) {
    updateData.score = score;
  }

  const { data, error } = await supabase
    .from('challenge_participants')
    .update(updateData)
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .select()
    .single();
  
  return { data, error };
};

// Session kudos functions
export const addSessionKudos = async (sessionId: string, userId: string) => {
  const { data, error } = await supabase
    .from('session_kudos')
    .insert({
      session_id: sessionId,
      user_id: userId
    })
    .select()
    .single();
  
  // Create notification for session owner (if not self-kudos)
  if (data && !error) {
    try {
      // Get session details to find the owner
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id, note')
        .eq('id', sessionId)
        .single();
      
      // Only send notification if someone else liked the session
      if (session && session.user_id !== userId) {
        await createNotification({
          user_id: session.user_id,
          type: 'kudos',
          actor_id: userId,
          entity_type: 'session',
          entity_id: sessionId,
          data: {
            title: 'Your session got kudos!',
            message: session.note ? `Someone liked your session: "${session.note.substring(0, 50)}${session.note.length > 50 ? '...' : ''}"` : 'Someone liked your session'
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to create kudos notification:', notificationError);
      // Don't fail the main operation if notification fails
    }
  }
  
  return { data, error };
};

export const removeSessionKudos = async (sessionId: string, userId: string) => {
  const { error } = await supabase
    .from('session_kudos')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);
  
  return { error };
};

// Pagination helpers for feeds
export const getGlobalFeed = async (limit = 20, cursor?: string) => {
  // Use a more explicit approach with RPC or manual join
  let query = supabase
    .from('sessions')
    .select(`
      *,
      projects ( id, name, emoji, color, is_public )
    `)
    .is('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: sessions, error } = await query;
  
  if (error || !sessions) {
    return { data: sessions, error };
  }

  // Manually fetch profile data for each session
  const userIds = [...new Set(sessions.map(s => s.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, handle, name, avatar_url')
    .in('user_id', userIds);

  // Create a lookup map for profiles
  const profileMap = new Map();
  profiles?.forEach(profile => {
    profileMap.set(profile.user_id, profile);
  });

  // Attach profile data to sessions
  const enrichedSessions = sessions.map(session => ({
    ...session,
    profiles: profileMap.get(session.user_id) || null
  }));

  return { data: enrichedSessions, error: null };
};

export const getFollowingFeed = async (userId: string, limit = 20, cursor?: string) => {
  // Fetch following ids first
  const { data: followingRows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (followsError) return { data: null, error: followsError } as const;
  const followingIds = (followingRows || []).map((r: any) => r.following_id);
  if (followingIds.length === 0) return { data: [], error: null } as const;

  let query = supabase
    .from('sessions')
    .select(`
      *,
      projects ( id, name, emoji, color, is_public )
    `)
    .in('user_id', followingIds)
    .is('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  const { data: sessions, error } = await query;
  
  if (error || !sessions) {
    return { data: sessions, error };
  }

  // Manually fetch profile data for each session
  const userIds = [...new Set(sessions.map(s => s.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, handle, name, avatar_url')
    .in('user_id', userIds);

  // Create a lookup map for profiles
  const profileMap = new Map();
  profiles?.forEach(profile => {
    profileMap.set(profile.user_id, profile);
  });

  // Attach profile data to sessions
  const enrichedSessions = sessions.map(session => ({
    ...session,
    profiles: profileMap.get(session.user_id) || null
  }));

  return { data: enrichedSessions, error: null };
};

// Project and sessions by project
export const getProjectById = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  return { data, error };
};

export const getSessionsByProjectPaginated = async (
  projectId: string,
  limit = 20,
  cursor?: string
) => {
  let query = supabase
    .from('sessions')
    .select('*')
    .eq('project_id', projectId)
    .is('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt('created_at', cursor);
  const { data, error } = await query;
  return { data, error };
};

// Profiles
export const upsertProfile = async (profile: ProfileInsert | ProfileUpdate) => {
  try {
    // Add timeout protection to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 8000)
    );
    
    const profilePromise = supabase
      .from('profiles')
      .upsert(profile as any)
      .select()
      .single();
    
    const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
    return { data, error };
  } catch (error) {
    console.error('upsertProfile error:', error);
    return { data: null, error: error as any };
  }
};

export const getProfileByUserId = async (userId: string) => {
  try {
    // Add timeout protection to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 8000)
    );
    
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
    return { data, error };
  } catch (error) {
    console.error('getProfileByUserId error:', error);
    return { data: null, error: error as any };
  }
};

export const getProfileByHandle = async (handle: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('handle', handle)
    .single();
  return { data, error };
};

// Follows
export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single();
  
  // Create notification for the user being followed
  if (data && !error) {
    try {
      await createNotification({
        user_id: followingId,
        type: 'follow',
        actor_id: followerId,
        entity_type: 'user',
        entity_id: followerId,
        data: {
          title: 'You have a new follower!',
          message: 'Someone started following your building journey'
        }
      });
    } catch (notificationError) {
      console.error('Failed to create follow notification:', notificationError);
      // Don't fail the main operation if notification fails
    }
  }
  
  return { data, error };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return { error };
};

export const getFollowersCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);
  return { count: count ?? 0, error } as const;
};

export const getFollowingCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  return { count: count ?? 0, error } as const;
};

export const isFollowingUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .limit(1);
  return { isFollowing: Array.isArray(data) && data.length > 0, error } as const;
};

// Notifications
export const listNotifications = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

export const markNotificationsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  return { error };
};

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();
};

export const createNotification = async (notification: NotificationInsert) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  return { data, error };
};

export const getSessionKudos = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('session_kudos')
    .select('*')
    .eq('session_id', sessionId);
  
  return { data, error };
};

export const getSessionKudosCount = async (sessionId: string) => {
  const { count, error } = await supabase
    .from('session_kudos')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);
  return { count: count ?? 0, error } as const;
};

export const hasUserKudosForSession = async (sessionId: string, userId: string) => {
  const { data, error } = await supabase
    .from('session_kudos')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .limit(1);
  return { hasKudos: Array.isArray(data) && data.length > 0, error } as const;
};

// Session comments functions
export const addSessionComment = async (sessionId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('session_comments')
    .insert({
      session_id: sessionId,
      user_id: userId,
      content
    })
    .select()
    .single();
  
  // Create notification for session owner (if not self-comment)
  if (data && !error) {
    try {
      // Get session details to find the owner
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id, note')
        .eq('id', sessionId)
        .single();
      
      // Only send notification if someone else commented on the session
      if (session && session.user_id !== userId) {
        await createNotification({
          user_id: session.user_id,
          type: 'comment',
          actor_id: userId,
          entity_type: 'session',
          entity_id: sessionId,
          data: {
            title: 'New comment on your session!',
            message: session.note ? `Someone commented on your session: "${session.note.substring(0, 50)}${session.note.length > 50 ? '...' : ''}"` : 'Someone commented on your session'
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to create comment notification:', notificationError);
      // Don't fail the main operation if notification fails
    }
  }
  
  return { data, error };
};

export const getSessionComments = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('session_comments')
    .select(`
      *,
      profiles!user_id (
        handle,
        name,
        avatar_url
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  return { data, error };
};

export const getSessionCommentsCount = async (sessionId: string) => {
  const { count, error } = await supabase
    .from('session_comments')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);
  return { count: count ?? 0, error } as const;
};

// User sessions pagination (cursor by created_at)
export const getSessionsPaginated = async (
  userId: string,
  limit = 20,
  cursor?: string
) => {
  let query = supabase
    .from('sessions')
    .select(`
      *,
      projects (
        id,
        name,
        emoji,
        color
      )
    `)
    .eq('user_id', userId)
    .is('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt('created_at', cursor);
  const { data: sessions, error } = await query;
  
  if (error || !sessions) {
    return { data: sessions, error };
  }

  // For user's own sessions, we can fetch their profile once
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, handle, name, avatar_url')
    .eq('user_id', userId)
    .single();

  // Attach profile data to sessions
  const enrichedSessions = sessions.map(session => ({
    ...session,
    profiles: profile || null
  }));

  return { data: enrichedSessions, error: null };
};

export const deleteSessionComment = async (commentId: string, userId: string) => {
  const { error } = await supabase
    .from('session_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  
  return { error };
}; 

// Search
export const searchProfiles = async (q: string, limit = 20) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`handle.ilike.%${q}%,name.ilike.%${q}%`)
    .limit(limit);
  return { data, error };
};

export const searchProjects = async (q: string, limit = 20) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .eq('is_public', true)
    .limit(limit);
  return { data, error };
};

// Report functions
export const createReport = async (report: ReportInsert) => {
  const { data, error } = await supabase
    .from('reports')
    .insert(report)
    .select()
    .single();
  return { data, error };
};

export const isUserInChallenge = async (challengeId: string, userId: string) => {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();
  
  return { data: !!data, error };
};

// Suggested builders function
export const getSuggestedBuilders = async (userId: string, limit = 5) => {
  // Get users that the current user is NOT following
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  
  const followingIds = followingData?.map(f => f.following_id) || [];
  const excludeIds = [userId, ...followingIds]; // Exclude self and already following

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, handle, name, avatar_url, bio')
    .not('user_id', 'in', `(${excludeIds.join(',')})`)
    .not('handle', 'is', null) // Only users with handles (completed profiles)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

// Community functions
export const getCommunityBuilders = async (currentUserId?: string, limit = 20) => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, handle, name, avatar_url, bio, location, created_at')
    .not('handle', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !profiles) return { data: null, error };

  // Get follow status for current user
  let followData: any[] = [];
  if (currentUserId) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);
    followData = follows || [];
  }

  // Get follower/following counts for each profile
  const enrichedProfiles = await Promise.all(
    profiles.map(async (profile) => {
      const [followersResult, followingResult] = await Promise.all([
        getFollowersCount(profile.user_id),
        getFollowingCount(profile.user_id)
      ]);

      // Get user's session stats
      const { data: sessions } = await supabase
        .from('sessions')
        .select('duration, created_at')
        .eq('user_id', profile.user_id)
        .is('is_deleted', false);

      const totalBuildTime = sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
      
      // Calculate current streak (simplified)
      const currentStreak = sessions?.length || 0;

      // Get project count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id);

      return {
        id: profile.user_id,
        handle: profile.handle,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location || '',
        isFollowing: followData.some(f => f.following_id === profile.user_id),
        followers: followersResult.count,
        following: followingResult.count,
        totalBuildTime,
        currentStreak,
        projects: projectCount || 0,
        lastActive: profile.created_at
      };
    })
  );

  return { data: enrichedProfiles, error: null };
};

export const getCommunityProjects = async (limit = 20) => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles!user_id (handle, name, avatar_url)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !projects) return { data: null, error };

  // Get session counts and metrics for each project
  const enrichedProjects = await Promise.all(
    projects.map(async (project) => {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('duration, created_at')
        .eq('project_id', project.id)
        .is('is_deleted', false);

      const totalTime = sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
      const sessionCount = sessions?.length || 0;

      // Calculate activity score (simplified metric)
      const activityScore = sessionCount * 10 + Math.floor(totalTime / 3600);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        emoji: project.emoji,
        color: project.color,
        creator: {
          handle: project.profiles?.handle || 'Unknown',
          name: project.profiles?.name || 'Unknown',
          avatar_url: project.profiles?.avatar_url || 'https://github.com/github.png'
        },
        totalTime,
        sessions: sessionCount,
        activityScore,
        lastActivity: sessions?.[0]?.created_at || project.created_at,
        isPublic: project.is_public
      };
    })
  );

  return { data: enrichedProjects, error: null };
};