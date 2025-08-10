import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getLiveSessions, subscribeToLiveSessions, getProfileByUserId, getProjectById, cleanupStaleLiveSessions } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Radio, 
  Users, 
  Clock, 
  Eye, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  Heart,
  Share2,
  Bell,
  Crown,
  Star,
  Gift,
  Target
} from 'lucide-react';

interface LiveItem {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  viewers_count: number;
  profile?: {
    handle: string;
    name: string;
    avatar_url: string;
  };
  project?: {
    name: string;
    emoji: string;
  };
}

const LiveNow: React.FC = () => {
  const { user } = useAuth();
  const [live, setLive] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [followingStreamers, setFollowingStreamers] = useState<Set<string>>(new Set());

  const run = async () => {
    try {
      console.log('LiveNow: Fetching live sessions...');
      
      // Clean up stale sessions first
      await cleanupStaleLiveSessions();
      
      const { data, error } = await getLiveSessions();
      
      if (error) {
        console.error('LiveNow: Error fetching live sessions:', error);
        setLoading(false);
        return;
      }
      
      console.log('LiveNow: Raw live sessions data:', data);
      
      if (data && data.length > 0) {
        // Enrich with profile and project data
        const enrichedData = await Promise.all(
          data.map(async (session: any) => {
            const [profileResult, projectResult] = await Promise.all([
              getProfileByUserId(session.user_id),
              getProjectById(session.project_id)
            ]);
            
            console.log(`LiveNow: Enriched session ${session.id}:`, {
              session,
              profile: profileResult.data,
              project: projectResult.data
            });
            
            return {
              ...session,
              profile: profileResult.data,
              project: projectResult.data
            };
          })
        );
        setLive(enrichedData);
        console.log('LiveNow: Final enriched data:', enrichedData);
      } else {
        console.log('LiveNow: No live sessions found');
        setLive([]);
      }
    } catch (error) {
      console.error('LiveNow: Error in run function:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
    
    // Set up real-time subscription
    const ch = subscribeToLiveSessions((payload) => {
      console.log('LiveNow: Live sessions updated:', payload);
      // Force immediate re-fetch when live sessions change
      run();
    });
    
    // Also set up a polling mechanism as backup
    const interval = setInterval(run, 10000); // Check every 10 seconds
    
    return () => { 
      try { ch.unsubscribe(); } catch {} 
      clearInterval(interval);
    };
  }, [user?.id]); // Re-run when user changes

  // Add a manual refresh function
  const handleRefresh = () => {
    setLastRefresh(new Date());
    run();
  };

  const getElapsedTime = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleFollow = (streamerId: string) => {
    setFollowingStreamers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(streamerId)) {
        newSet.delete(streamerId);
        toast.success('Unfollowed streamer');
      } else {
        newSet.add(streamerId);
        toast.success('Following streamer!');
      }
      return newSet;
    });
  };

  const handleShare = (streamerName: string, projectName: string) => {
    if (navigator.share) {
      navigator.share({
        title: `${streamerName} is live!`,
        text: `Watch ${streamerName} build ${projectName} live!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleNotify = (streamerName: string) => {
    toast.success(`You'll be notified when ${streamerName} goes live!`);
  };

  // Always show the component, but with different states
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-gray-900 flex items-center">
              <Radio className="h-5 w-5 mr-2 text-red-600 animate-pulse" />
              Live Now
            </h4>
            <div className="animate-spin">
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="text-center py-8">
            <div className="animate-pulse flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Loading live streams...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!live.length) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-gray-900 flex items-center">
              <Radio className="h-5 w-5 mr-2 text-gray-400" />
              Live Now
            </h4>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center py-8">
            <Radio className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 font-medium">No one is live right now</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to go live!</p>
            <Button 
              className="mt-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Streaming
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900 flex items-center">
            <Radio className="h-5 w-5 mr-2 text-red-600 animate-pulse" />
            Live Now
            <Badge variant="destructive" className="ml-2 animate-pulse">
              {live.length} live
            </Badge>
          </h4>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800 hover:bg-red-100"
            title="Refresh live sessions"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {live.map((l) => {
            const isOwnSession = user?.id === l.user_id;
            const isFollowing = followingStreamers.has(l.user_id);
            
            const handleClick = (e: React.MouseEvent) => {
              if (isOwnSession) {
                e.preventDefault();
                toast.info("You're already live! You can see your live session right here on the dashboard.");
                return;
              }
            };

            return (
              <div key={l.id} className="relative">
                <Link to={`/live/${l.user_id}`} className="block" onClick={handleClick}>
                  <div className="bg-white border-2 border-red-200 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-red-500 ring-opacity-50 group-hover:ring-red-600 transition-all">
                            <AvatarImage src={l.profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold">
                              {l.profile?.handle?.charAt(0)?.toUpperCase() || l.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {isFollowing && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                              <Heart className="h-3 w-3 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="destructive" className="animate-pulse bg-red-600 text-white px-2 py-1 text-xs">
                              <Radio className="h-3 w-3 mr-1" />
                              LIVE
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {isOwnSession ? 'You' : (l.profile?.handle || l.profile?.name || 'Anonymous')}
                            </span>
                            {isOwnSession && (
                              <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                You
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              {l.project?.emoji} {l.project?.name || 'Unknown Project'}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {getElapsedTime(l.started_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {l.viewers_count} watching
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Trending
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-sm font-medium text-red-600 flex items-center">
                          {isOwnSession ? 'Live' : 'Watch'}
                          <Eye className="h-4 w-4 ml-1" />
                        </span>
                        
                        {/* Action buttons - only show on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollow(l.user_id);
                            }}
                          >
                            <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current text-red-500' : 'text-gray-500'}`} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare(l.profile?.name || 'Builder', l.project?.name || 'project');
                            }}
                          >
                            <Share2 className="h-4 w-4 text-gray-500" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNotify(l.profile?.name || 'Builder');
                            }}
                          >
                            <Bell className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        
        {/* Quick Actions Footer */}
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <Gift className="h-4 w-4 mr-1" />
                Gift
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <Star className="h-4 w-4 mr-1" />
                Tip
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveNow;

