/**
 * Utility to manually clean up live sessions
 * Usage: import { runLiveCleanup } from '@/utils/cleanup-live'
 */

import { cleanupStaleLiveSessions, stopLiveSession } from '@/lib/database';

export const runLiveCleanup = async () => {
  console.log('🧹 Starting live session cleanup...');
  
  try {
    const { error } = await cleanupStaleLiveSessions();
    
    if (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Live session cleanup completed successfully');
    return { success: true };
  } catch (e) {
    console.error('❌ Cleanup error:', e);
    return { success: false, error: e };
  }
};

export const forceStopUserLive = async (userId: string) => {
  console.log(`🛑 Force stopping live session for user: ${userId}`);
  
  try {
    const { error } = await stopLiveSession(userId);
    
    if (error) {
      console.error('❌ Force stop failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Force stopped live session');
    return { success: true };
  } catch (e) {
    console.error('❌ Force stop error:', e);
    return { success: false, error: e };
  }
};