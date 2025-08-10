/**
 * Manual cleanup utility for live sessions
 * Can be called from browser console for immediate cleanup
 */

import { stopLiveSession, cleanupStaleLiveSessions, getLiveSessions } from '@/lib/database';

// Cleanup current user's live session
export const cleanupMyLiveSession = async (userId: string) => {
  console.log(`🧹 Cleaning up live session for user: ${userId}`);
  try {
    const { error } = await stopLiveSession(userId);
    if (error) {
      console.error('❌ Error:', error);
      return false;
    }
    console.log('✅ Your live session has been cleaned up');
    return true;
  } catch (e) {
    console.error('❌ Cleanup failed:', e);
    return false;
  }
};

// Cleanup all stale sessions
export const cleanupAllStale = async () => {
  console.log('🧹 Cleaning up all stale live sessions...');
  try {
    const { error } = await cleanupStaleLiveSessions();
    if (error) {
      console.error('❌ Error:', error);
      return false;
    }
    console.log('✅ All stale sessions cleaned up');
    return true;
  } catch (e) {
    console.error('❌ Cleanup failed:', e);
    return false;
  }
};

// Show current live sessions
export const showLive = async () => {
  console.log('📊 Current live sessions:');
  try {
    const { data, error } = await getLiveSessions();
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No live sessions found');
      return;
    }
    
    console.log(`Found ${data.length} live sessions:`);
    data.forEach((session: any, index: number) => {
      const startTime = new Date(session.started_at);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);
      console.log(`${index + 1}. User ${session.user_id} - Project ${session.project_id} - ${elapsed}m ago`);
    });
  } catch (e) {
    console.error('❌ Error:', e);
  }
};

// Get current user's live session
export const getMyLiveSession = async (userId: string) => {
  console.log(`🔍 Checking live session for user: ${userId}`);
  try {
    const { getLiveSessionByUser } = await import('@/lib/database');
    const { data, error } = await getLiveSessionByUser(userId);
    if (error) {
      console.error('❌ Error:', error);
      return null;
    }
    
    if (data) {
      const startTime = new Date(data.started_at);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);
      console.log(`✅ Found live session: ${elapsed}m ago`);
      console.log('Session data:', data);
      return data;
    } else {
      console.log('ℹ️  No live session found');
      return null;
    }
  } catch (e) {
    console.error('❌ Error:', e);
    return null;
  }
};

// Clean up all live sessions for a specific user (more aggressive)
export const cleanupAllUserSessions = async (userId: string) => {
  console.log(`🗑️ Cleaning up ALL live sessions for user: ${userId}`);
  try {
    const { error } = await stopLiveSession(userId);
    if (error) {
      console.error('❌ Error:', error);
      return false;
    }
    console.log('✅ All user live sessions cleaned up');
    return true;
  } catch (e) {
    console.error('❌ Cleanup failed:', e);
    return false;
  }
};

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).cleanupLive = {
    mine: cleanupMyLiveSession,
    stale: cleanupAllStale,
    show: showLive,
    check: getMyLiveSession,
    cleanupUser: cleanupAllUserSessions
  };
  console.log('🧹 Live cleanup tools available as window.cleanupLive');
  console.log('📝 Usage: window.cleanupLive.check("your-user-id")');
  console.log('🔧 Force restore: window.forceCheckLiveSession()');
}