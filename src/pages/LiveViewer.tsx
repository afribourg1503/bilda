import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Target, 
  MessageCircle, 
  Send, 
  Radio, 
  Heart,
  Share2,
  Bell,
  Eye,
  TrendingUp,
  Zap,
  Crown,
  Shield,
  Flag,
  MoreHorizontal,
  Smile,
  Gift,
  Star,
  Settings,
  BarChart3,
  Check,
  Plus,
  Command,
  Gavel,
  Bot,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Square
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLiveSessionByUser, getProfileByUserId, getProjectById, incrementLiveViewers, decrementLiveViewers, addLiveComment, getLiveComments } from '@/lib/database';
import { 
  getStreamSettings, 
  saveStreamSettings, 
  getChatCommands, 
  executeCommand, 
  getModerationActions,
  timeoutUser,
  banUser,
  warnUser,
  getStreamAnalytics,
  incrementChatMessages,
  incrementCommandsUsed,
  updatePeakViewers,
  followUser,
  unfollowUser,
  checkFollowStatus,
  getUserChannelPoints,
  redeemChannelPoints
} from '@/lib/liveFeatures';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { supabase } from '@/lib/supabase';
import EnhancedLiveChat from '@/components/EnhancedLiveChat';
import ChannelPoints from '@/components/ChannelPoints';
import StreamerDashboard from '@/components/StreamerDashboard';
import ChatModeration from '@/components/ChatModeration';
import ChatCommands from '@/components/ChatCommands';
import StreamSettings from '@/components/StreamSettings';
import StreamNotifications from '@/components/StreamNotifications';
import EnhancedChat from '@/components/EnhancedChat';
import StreamAnalytics from '@/components/StreamAnalytics';

interface LiveSession {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  note?: string;
  mood?: number;
  viewers_count: number;
  stream_url?: string; // Added for video stream
  is_muted?: boolean; // Added for video stream
  is_video_enabled?: boolean; // Added for video stream
}

interface LiveComment {
  id: string;
  live_session_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    handle: string;
    name: string;
    avatar_url: string;
  };
}

const LiveViewer: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [streamerProfile, setStreamerProfile] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [messages, setMessages] = useState<LiveComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [channelPoints, setChannelPoints] = useState(0);
  const [isViewerCounted, setIsViewerCounted] = useState(false);
  const [streamConfig, setStreamConfig] = useState<any>(null);
  const [chatCommands, setChatCommands] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [chatConnected, setChatConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isStreamer, setIsStreamer] = useState(false);
  const [chatInputFocused, setChatInputFocused] = useState(false);
  const [showStreamerDashboard, setShowStreamerDashboard] = useState(false);
  const [showStreamSettings, setShowStreamSettings] = useState(false);
  const [showChatModeration, setShowChatModeration] = useState(false);
  const [showChatCommands, setShowChatCommands] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userId) return;
      
      try {
        // Get live session
        const { data: session, error: sessionError } = await getLiveSessionByUser(userId);
        if (sessionError || !session) {
          toast.error('Live session not found');
          navigate('/dashboard');
          return;
        }

        setLiveSession(session);
        setViewers(session.viewers_count || 0);
        setIsStreamer(user?.id === userId);

        // Get streamer profile
        const { data: profile } = await getProfileByUserId(userId);
        setStreamerProfile(profile);

        // Get project details
        try {
          const { data: projectData } = await getProjectById(session.project_id);
          setProject(projectData);
        } catch (error) {
          console.log('Project details not available yet (table not created)');
          setProject(null);
        }

        // Increment viewer count (but not if it's the streamer viewing their own session)
        if (user?.id !== userId && !isViewerCounted) {
          try {
            await incrementLiveViewers(session.id);
            setIsViewerCounted(true);
          } catch (error) {
            console.log('Viewer count increment not available yet (function not implemented)');
            setIsViewerCounted(true); // Still mark as counted to prevent retries
          }
        }

        // Load comments
        try {
          const { data: commentsData } = await getLiveComments(session.id);
          setComments(commentsData || []);
        } catch (error) {
          console.log('Live comments not available yet (table not created)');
          setComments([]);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        // Set defaults to prevent loading states
        setProject(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [userId, user?.id, navigate]);

  // Handle viewer count decrement when leaving
  useEffect(() => {
    return () => {
      if (liveSession?.id && user?.id !== userId && isViewerCounted) {
        try {
          decrementLiveViewers(liveSession.id).catch(console.error);
        } catch (error) {
          console.log('Viewer count decrement not available yet (function not implemented)');
        }
      }
    };
  }, [liveSession?.id, user?.id, userId, isViewerCounted]);

  // Real-time viewer count subscription
  useEffect(() => {
    if (!liveSession?.id) return;
    
    const channel = supabase.channel(`live_viewers_${liveSession.id}`);
    
    channel.on('broadcast', { event: 'viewer_count_update' }, async (payload) => {
      try {
        const updatedSession = payload.payload;
        setLiveSession(updatedSession);
        
        // Update peak viewers in analytics
        if (updatedSession.viewers_count > 0) {
          try {
            await updatePeakViewers(liveSession.id, updatedSession.viewers_count);
          } catch (error) {
            console.log('Peak viewers analytics not available yet (table not created)');
            // Continue without analytics - don't block the viewer count update
          }
        }
      } catch (error) {
        console.error('Error handling viewer count update:', error);
      }
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSession?.id]);

  // Real-time chat subscription
  useEffect(() => {
    if (!liveSession?.id) return;
    
    const channel = supabase.channel(`live_chat_${liveSession.id}`);
    
    channel.on('broadcast', { event: 'new_comment' }, (payload) => {
      const newComment = payload.payload;
      setComments(prev => [...prev, newComment]);
    });
    
    channel.on('broadcast', { event: 'new_message' }, (payload) => {
      const newMessage = payload.payload;
      setMessages(prev => [...prev, newMessage]);
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSession?.id]);

  // Load streamer data when user is streamer
  useEffect(() => {
    if (!isStreamer || !user?.id) return;
    
    const loadStreamerData = async () => {
      try {
        // Note: These tables don't exist in minimal setup yet
        // Load stream settings
        try {
          const { data: settings } = await getStreamSettings(user.id);
          if (settings) {
            setStreamConfig(settings);
          }
        } catch (error) {
          console.log('Stream settings not available yet (table not created)');
          setStreamConfig(null);
        }

        // Load chat commands
        try {
          const { data: commands } = await getChatCommands(user.id);
          if (commands) {
            setChatCommands(commands);
          }
        } catch (error) {
          console.log('Chat commands not available yet (table not created)');
          setChatCommands([]);
        }
      } catch (error) {
        console.error('Error loading streamer data:', error);
        // Set defaults to prevent loading states
        setStreamConfig(null);
        setChatCommands([]);
      }
    };
    
    loadStreamerData();
  }, [isStreamer, user?.id]);

  // Check follow status when user and streamer profile are loaded
  useEffect(() => {
    if (!user?.id || !streamerProfile?.user_id) return;
    
    const checkFollow = async () => {
      try {
        const { data: isFollowingUser } = await checkFollowStatus(user.id, streamerProfile.user_id);
        setIsFollowing(isFollowingUser);
      } catch (error) {
        console.error('Error checking follow status:', error);
        setIsFollowing(false);
      }
    };
    
    checkFollow();
  }, [user?.id, streamerProfile?.user_id]);

  // Load channel points for viewer
  useEffect(() => {
    if (!user?.id || !streamerProfile?.user_id) return;
    
    const loadChannelPoints = async () => {
      try {
        const { data: points } = await getUserChannelPoints(user.id, streamerProfile.user_id);
        setChannelPoints(points || 0);
      } catch (error) {
        console.log('Channel points not available yet (table not created)');
        setChannelPoints(1000); // Default value
      }
    };
    
    loadChannelPoints();
  }, [user?.id, streamerProfile?.user_id]);

  // Handle comment submission
  const handleSendComment = useCallback(async (comment: string) => {
    if (!user?.id || !liveSession?.id || !comment.trim()) return;
    
    try {
      // Increment chat message analytics
      try {
        await incrementChatMessages(liveSession.id);
      } catch (error) {
        console.log('Chat analytics not available yet (table not created)');
        // Continue without analytics - don't block the message
      }
      
      // Comment will be added via real-time subscription
      setNewComment('');
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error('Failed to send comment');
    }
  }, [user?.id, liveSession?.id]);

  // Handle message submission
  const handleSendMessage = useCallback(async (message: string) => {
    if (!user?.id || !liveSession?.id || !message.trim()) return;
    
    try {
      // Increment chat message analytics
      try {
        await incrementChatMessages(liveSession.id);
      } catch (error) {
        console.log('Chat analytics not available yet (table not created)');
        // Continue without analytics - don't block the message
      }
      
      // Message will be added via real-time subscription
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [user?.id, liveSession?.id]);

  // Handle follow/unfollow
  const handleFollow = useCallback(async () => {
    if (!user?.id || !streamerProfile?.user_id) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(user.id, streamerProfile.user_id);
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        await followUser(user.id, streamerProfile.user_id);
        setIsFollowing(true);
        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to follow/unfollow');
    }
  }, [user?.id, streamerProfile?.user_id, isFollowing]);

  // Load project details and comments when liveSession changes
  useEffect(() => {
    if (!liveSession?.id) return;
    
    const loadAdditionalData = async () => {
      try {
        // Get project details
        try {
          const { data: projectData } = await getProjectById(liveSession.project_id);
          setProject(projectData);
        } catch (error) {
          console.log('Project details not available yet (table not created)');
          setProject(null);
        }

        // Load comments
        try {
          const { data: commentsData } = await getLiveComments(liveSession.id);
          setComments(commentsData || []);
        } catch (error) {
          console.log('Live comments not available yet (table not created)');
          setComments([]);
        }
      } catch (error) {
        console.error('Error loading additional data:', error);
        setProject(null);
        setComments([]);
      }
    };
    
    loadAdditionalData();
  }, [liveSession?.id]);

  // Handle viewer count decrement when leaving
  useEffect(() => {
    return () => {
      if (liveSession?.id && user?.id !== userId && isViewerCounted) {
        try {
          decrementLiveViewers(liveSession.id).catch(console.error);
        } catch (error) {
          console.log('Viewer count decrement not available yet (function not implemented)');
        }
      }
    };
  }, [liveSession?.id, user?.id, userId, isViewerCounted]);

  // Real-time viewer count subscription
  useEffect(() => {
    if (!liveSession?.id) return;
    
    const channel = supabase.channel(`live_viewers_${liveSession.id}`);
    
    channel.on('broadcast', { event: 'viewer_count_update' }, async (payload) => {
      try {
        const updatedSession = payload.payload;
        setLiveSession(updatedSession);
        
        // Update peak viewers in analytics
        if (updatedSession.viewers_count > 0) {
          try {
            await updatePeakViewers(liveSession.id, updatedSession.viewers_count);
          } catch (error) {
            console.log('Peak viewers analytics not available yet (table not created)');
            // Continue without analytics - don't block the viewer count update
          }
        }
      } catch (error) {
        console.error('Error handling viewer count update:', error);
      }
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSession?.id]);

  // Real-time chat subscription
  useEffect(() => {
    if (!liveSession?.id) return;
    
    const channel = supabase.channel(`live_chat_${liveSession.id}`);
    
    channel.on('broadcast', { event: 'new_comment' }, (payload) => {
      const newComment = payload.payload;
      setComments(prev => [...prev, newComment]);
    });
    
    channel.on('broadcast', { event: 'new_message' }, (payload) => {
      const newMessage = payload.payload;
      setMessages(prev => [...prev, newMessage]);
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSession?.id]);

  // Early return if still loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading stream...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Early return if essential data is not loaded
  if (!liveSession || !streamerProfile) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading stream...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Early return if user is not authenticated
  if (!user) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-300 mb-4">Please log in to view this stream</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Transform comments to match EnhancedLiveChat format
  const transformedComments = comments.map(comment => ({
    id: comment.id,
    user_id: comment.user_id,
    username: comment.profiles?.handle || 'Anonymous',
    avatar_url: comment.profiles?.avatar_url,
    message: comment.message,
    created_at: comment.created_at,
    user_role: (comment.user_id === streamerProfile?.user_id ? 'streamer' : 'viewer') as 'streamer' | 'viewer' | 'moderator' | 'vip',
    badges: comment.user_id === streamerProfile?.user_id ? ['streamer'] : [],
    isHighlighted: false
  }));

  // Handle moderation action
  const handleModerationAction = async (userId: string, action: 'timeout' | 'ban' | 'warning', duration?: number, reason?: string) => {
    if (!liveSession?.id || !user?.id) return;
    
    try {
      let result;
      
      switch (action) {
        case 'timeout':
          result = await timeoutUser(liveSession.id, user.id, userId, duration || 300, reason);
          break;
        case 'ban':
          result = await banUser(liveSession.id, user.id, userId, reason);
          break;
        case 'warning':
          result = await warnUser(liveSession.id, user.id, userId, reason);
          break;
        default:
          throw new Error(`Unknown moderation action: ${action}`);
      }
      
      if (result?.error) throw result.error;
      
      toast.success(`${action} applied to user successfully`);
    } catch (error) {
      console.error('Error applying moderation action:', error);
      toast.error(`Failed to apply ${action}`);
    }
  };

  // Handle command execution
  const handleCommandExecuted = async (command: string, response: string) => {
    if (!liveSession?.id || !user?.id) return;

    try {
      // Add command response to chat
      const commandMessage = {
        id: Date.now().toString(),
        user_id: 'bot',
        username: 'Bot',
        avatar_url: '',
        message: response.replace('@{username}', user?.email?.split('@')[0] || 'Viewer'),
        created_at: new Date().toISOString(),
        user_role: 'bot' as any,
        badges: ['bot'],
        isHighlighted: true
      };

      setComments(prev => [...prev, commandMessage as any]);
      await incrementCommandsUsed(liveSession.id);

      toast.success(`Command executed: ${command}`);
    } catch (error) {
      console.error('Error executing command:', error);
      toast.error('Failed to execute command');
    }
  };

  // Handle stream settings save
  const handleSaveStreamSettings = async (settings: any) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await saveStreamSettings(user.id, settings);
      if (error) throw error;
      
      setStreamConfig(data);
      toast.success('Stream settings saved successfully!');
    } catch (error) {
      console.error('Error saving stream settings:', error);
      toast.error('Failed to save stream settings');
    }
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${streamerProfile?.name || 'Builder'} is live!`,
        text: `Watch ${streamerProfile?.name || 'this builder'} build ${project?.name || 'their project'} live!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Get elapsed time
  const getElapsedTime = () => {
    if (!liveSession) return '0:00';
    const start = new Date(liveSession.started_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality
  };

  // Handle toggle video
  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // TODO: Implement actual video toggle functionality
  };

  // Handle end stream
  const handleEndStream = async () => {
    if (!liveSession?.id || !user?.id) return;
    
    try {
      // TODO: Implement actual stream ending
      toast.success('Stream ended successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Live Session Area */}
          <div className="col-span-8">
            {/* Header */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="mb-4 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 ring-4 ring-red-500 ring-opacity-50">
                    <AvatarImage src={streamerProfile?.avatar_url} />
                    <AvatarFallback className="text-xl font-bold">
                      {streamerProfile?.name?.charAt(0) || streamerProfile?.handle?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {streamerProfile?.name || streamerProfile?.handle || 'Unknown User'}
                    </h1>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                      <Badge variant="destructive" className="animate-pulse bg-red-600 text-white px-3 py-1">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                      <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                        <Clock className="h-4 w-4 mr-1" />
                        {getElapsedTime()}
                      </span>
                      <span className="flex items-center bg-blue-100 px-2 py-1 rounded text-blue-700">
                        <Users className="h-4 w-4 mr-1" />
                        {viewers} watching
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                                  <div className="flex items-center space-x-3">
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      className={isFollowing ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Notify
                    </Button>
                    {isStreamer && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setShowStreamerDashboard(!showStreamerDashboard)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowStreamSettings(!showStreamSettings)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowChatModeration(!showChatModeration)}
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Moderation
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowChatCommands(!showChatCommands)}
                        >
                          <Command className="h-4 w-4 mr-2" />
                          Commands
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNotifications(!showNotifications)}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Notifications
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAnalytics(!showAnalytics)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      </>
                    )}
                  </div>
              </div>
            </div>

            {/* Live Stream Content */}
            <Card className="mb-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Building: {project?.name || 'Unknown Project'}</span>
                  {project?.emoji && <span className="text-lg">{project.emoji}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {liveSession.note ? (
                  <div className="bg-white p-4 rounded-lg border border-red-200 mb-6">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-red-600" />
                      Session Note:
                    </h4>
                    <p className="text-gray-700">{liveSession.note}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic mb-6">No session note provided.</p>
                )}
                
                {/* Live Activity Stream */}
                <div className="bg-white border-2 border-dashed border-red-300 rounded-lg p-8 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-purple-400 opacity-10 rounded-lg"></div>
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Target className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Live Building Session</h3>
                      <p className="text-gray-600 mb-4">
                        {streamerProfile?.name || 'This builder'} is currently working on {project?.name || 'their project'}
                      </p>
                      
                      {/* Live Stats */}
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{viewers}</div>
                          <div className="text-xs text-gray-500">Viewers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{getElapsedTime()}</div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-xs text-gray-500">Commits</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-sm text-gray-400">
                        <div className="flex items-center justify-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>Future: Screen sharing, code commits, and real-time updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streamer Dashboard (Overlay) */}
            {isStreamer && showStreamerDashboard && (
              <StreamerDashboard
                isVisible={showStreamerDashboard}
                onClose={() => setShowStreamerDashboard(false)}
                currentViewers={viewers}
                streamStartTime={liveSession?.started_at ? new Date(liveSession.started_at) : null}
                onStreamSettings={() => setShowStreamSettings(true)}
                liveSessionId={liveSession?.id}
              />
            )}

            {/* Chat Moderation (Overlay) */}
            {isStreamer && showChatModeration && (
              <ChatModeration
                isStreamer={isStreamer}
                liveSessionId={liveSession?.id || ''}
                onModerateUser={handleModerationAction}
                onUpdateChatSettings={(settings) => {
                  // TODO: Implement chat settings update
                  console.log('Chat settings updated:', settings);
                }}
                currentSettings={{
                  slowMode: false,
                  slowModeInterval: 5,
                  followersOnly: false,
                  followersOnlyDuration: 0,
                  subscribersOnly: false,
                  subscribersOnlyDuration: 0,
                  emoteOnly: false,
                  emoteOnlyDuration: 0,
                  chatEnabled: true,
                  autoModLevel: 'low',
                  blockLinks: false,
                  blockCaps: false,
                  maxMessageLength: 500
                }}
              />
            )}

            {/* Chat Commands (Overlay) */}
            {isStreamer && showChatCommands && (
              <ChatCommands
                isStreamer={isStreamer}
                liveSessionId={liveSession?.id || ''}
                onCommandExecuted={handleCommandExecuted}
                commands={chatCommands}
              />
            )}

            {/* Stream Settings (Overlay) */}
            {isStreamer && showStreamSettings && (
              <StreamSettings
                isVisible={showStreamSettings}
                onClose={() => setShowStreamSettings(false)}
                onSaveSettings={handleSaveStreamSettings}
                currentSettings={streamConfig}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Streamer Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {streamerProfile?.name || streamerProfile?.handle || 'Streamer'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {streamerProfile?.bio || 'No bio available'}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Followers</span>
                    <span className="font-semibold">
                      {streamerProfile?.followers_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Following</span>
                    <span className="font-semibold">
                      {streamerProfile?.following_count || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Info */}
            {project && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {project.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created</span>
                      <span>
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Updated</span>
                      <span>
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Channel Points */}
            <ChannelPoints
              streamerId={streamerProfile?.user_id || ''}
              viewerId={user?.id || ''}
              isStreamer={isStreamer}
              currentPoints={channelPoints}
              onRedeemReward={async (rewardId) => {
                try {
                  // TODO: Get reward cost from the reward object
                  const cost = 100; // Default cost, should come from reward object
                  const { data, error } = await redeemChannelPoints(user?.id || '', streamerProfile?.user_id || '', rewardId, cost);
                  
                  if (error) throw error;
                  
                  // Update local points (this would be updated via real-time subscription in a real app)
                  setChannelPoints(prev => Math.max(0, prev - cost));
                  toast.success('Reward redeemed successfully!');
                } catch (error) {
                  console.error('Error redeeming reward:', error);
                  toast.error('Failed to redeem reward');
                }
              }}
            />

            {/* Enhanced Live Chat */}
            <EnhancedLiveChat
              liveSessionId={liveSession?.id || ''}
              streamerId={streamerProfile?.user_id || ''}
              isStreamer={isStreamer}
              onSendMessage={handleSendMessage}
              messages={transformedComments}
              isConnected={chatConnected}
            />

            {/* Chat Commands for Viewers */}
            {!isStreamer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Command className="h-5 w-5" />
                    <span>Chat Commands</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Command Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type a command (e.g., !hello)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const command = e.currentTarget.value.trim();
                            if (command.startsWith('!')) {
                              handleCommandExecuted(command, 'Command executed!');
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder*="command"]') as HTMLInputElement;
                          const command = input?.value.trim();
                          if (command && command.startsWith('!')) {
                            handleCommandExecuted(command, 'Command executed!');
                            input.value = '';
                          }
                        }}
                      >
                        Execute
                      </Button>
                    </div>
                    
                    {/* Available Commands */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">!hello</span>
                        <span className="text-gray-600">Say hello</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">!project</span>
                        <span className="text-gray-600">Project info</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">!schedule</span>
                        <span className="text-gray-600">Stream schedule</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">!help</span>
                        <span className="text-gray-600">Show all commands</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stream Notifications (Overlay) */}
            {isStreamer && showNotifications && (
              <StreamNotifications
                isStreamer={isStreamer}
                liveSessionId={liveSession?.id || ''}
                onClose={() => setShowNotifications(false)}
              />
            )}

            {/* Stream Analytics (Overlay) */}
            {isStreamer && showAnalytics && (
              <StreamAnalytics
                isVisible={showAnalytics}
                onClose={() => setShowAnalytics(false)}
                liveSessionId={liveSession?.id || ''}
                currentViewers={viewers}
                streamStartTime={liveSession?.started_at ? new Date(liveSession.started_at) : null}
              />
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default LiveViewer;