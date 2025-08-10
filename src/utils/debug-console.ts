/**
 * Debug utilities for browser console
 * Usage in browser console:
 * 
 * import('/src/utils/debug-console.js').then(d => {
 *   d.cleanupStaleShows();
 *   d.showLiveSessions();
 * });
 */

import { cleanupStaleLiveSessions, getLiveSessions, stopLiveSession } from '@/lib/database';

export const cleanupStaleShows = async () => {
  console.log('🧹 Running cleanup...');
  const { error } = await cleanupStaleLiveSessions();
  if (error) {
    console.error('❌ Cleanup failed:', error);
  } else {
    console.log('✅ Cleanup completed');
  }
};

export const showLiveSessions = async () => {
  console.log('📊 Current live sessions:');
  const { data, error } = await getLiveSessions();
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`Found ${data?.length || 0} live sessions:`, data);
  }
};

export const stopMyLiveSession = async (userId: string) => {
  console.log(`🛑 Stopping live session for user: ${userId}`);
  const { error } = await stopLiveSession(userId);
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Stopped live session');
  }
};

// Make functions available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).debugLive = {
    cleanup: cleanupStaleShows,
    show: showLiveSessions,
    stop: stopMyLiveSession
  };
  console.log('🐛 Live debug tools available as window.debugLive');
}