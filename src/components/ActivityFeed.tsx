import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Github, 
  Timer,
  Flame,
  TrendingUp,
  Code,
  Palette,
  FileText,
  Send,
  MoreHorizontal,
  Zap,
  Trophy,
  Star,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Save,
  X,
  Flag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSessions, getSessionsPaginated, getFollowingFeed, getGlobalFeed, subscribeToSessions, addSessionKudos, removeSessionKudos, getSessionKudosCount, hasUserKudosForSession, addSessionComment, getSessionComments, getSessionCommentsCount, updateSession, deleteSession, createReport } from '@/lib/database';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Comment {
  id: string;
  user: {
    id: string;
    handle: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  user: {
    id: string;
    handle: string;
    avatar_url: string;
    isFollowing?: boolean;
  };
  project: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  duration: number;
  note?: string;
  mood: number;
  metrics: {
    commits?: number;
    lines_added?: number;
    lines_removed?: number;
    files_changed?: number;
    github_connected?: boolean;
  };
  kudos: number;
  comments: Comment[];
  created_at: string;
  isLiked: boolean;
  showComments: boolean;
  newComment: string;
  isEditing?: boolean;
  editNote?: string;
}

interface ActivityFeedProps {
  scope?: 'mine' | 'following' | 'global';
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ scope = 'mine' }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mapDbToFeed = (s: any): Session => ({
      id: s.id,
      user: {
        id: s.user_id,
        handle: s.profiles?.handle || 'unknown',
        avatar_url: s.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user_id}`,
      },
      project: {
        id: s.projects?.id ?? s.project_id,
        name: s.projects?.name ?? 'Project',
        emoji: s.projects?.emoji ?? '🚀',
        color: s.projects?.color ?? 'bg-purple-500',
      },
      duration: s.duration ?? 0,
      note: s.note ?? undefined,
      mood: s.mood ?? 3,
      metrics: s.metrics || {},
      kudos: 0,
      comments: [],
      created_at: s.created_at,
      isLiked: false,
      showComments: false,
      newComment: '',
    });

    const run = async (reset = true) => {
      if (!user && scope !== 'global') return;
      setIsLoading(true);
      setLoadError(null);
      try {
        let data: any[] | null = null;
        let error: any = null;
        if (scope === 'mine') {
          const res = await getSessionsPaginated(user!.id, 20);
          data = (res.data as any[]) ?? null; error = res.error;
        } else if (scope === 'following') {
          const res = await getFollowingFeed(user!.id, 20);
          data = (res.data as any[]) ?? null; error = res.error;
        } else {
          const res = await getGlobalFeed(20);
          data = (res.data as any[]) ?? null; error = res.error;
        }
        if (error) setLoadError(error.message ?? 'Failed to load activity');
        if (data) {
          const base = data.map(mapDbToFeed);
          if (reset) setSessions(base); else setSessions(prev => [...prev, ...base]);
          // set cursor for pagination
          const last = data[data.length - 1];
          setCursor(last?.created_at);
          setHasMore((data?.length ?? 0) >= 20);
          // hydrate engagement counts and like state
          const enriched = await Promise.all(base.map(async (sess) => {
            try {
              const [{ count: kudosCount }, { count: commentsCount }, { hasKudos }] = await Promise.all([
                getSessionKudosCount(sess.id),
                getSessionCommentsCount(sess.id),
                user ? hasUserKudosForSession(sess.id, user.id) : Promise.resolve({ hasKudos: false })
              ] as any);
              return { ...sess, kudos: kudosCount ?? 0, comments: new Array(commentsCount ?? 0).fill(null), isLiked: !!hasKudos } as Session;
            } catch {
              return sess;
            }
          }));
          setSessions(enriched);
        }
      } catch (e: any) {
        setLoadError(e?.message ?? 'Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };
    run(true);
    const ch = scope === 'mine' && user ? subscribeToSessions(user.id, () => run(true)) : null;
    return () => { try { ch?.unsubscribe(); } catch {} };
  }, [user, scope]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (async () => {
            if (!cursor) return;
            setIsLoading(true);
            try {
              let res;
              if (scope === 'mine' && user) res = await getSessionsPaginated(user.id, 20, cursor);
              else if (scope === 'following' && user) res = await getFollowingFeed(user.id, 20, cursor);
              else res = await getGlobalFeed(20, cursor);
              const data = (res.data as any[]) ?? [];
              const last = data[data.length - 1];
              setCursor(last?.created_at);
              setHasMore(data.length >= 20);
              if (data.length) {
                const mapped = data.map((s: any) => ({
                  id: s.id,
                  user: { 
                    id: s.user_id, 
                    handle: s.profiles?.handle || 'unknown', 
                    avatar_url: s.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user_id}` 
                  },
                  project: { id: s.projects?.id ?? s.project_id, name: s.projects?.name ?? 'Project', emoji: s.projects?.emoji ?? '🚀', color: s.projects?.color ?? 'bg-purple-500' },
                  duration: s.duration ?? 0,
                  note: s.note ?? undefined,
                  mood: s.mood ?? 3,
                  metrics: s.metrics || {},
                  kudos: 0,
                  comments: [],
                  created_at: s.created_at,
                  isLiked: false,
                  showComments: false,
                  newComment: '',
                }));
                setSessions(prev => [...prev, ...mapped]);
              }
            } finally {
              setIsLoading(false);
            }
          })();
        }
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, hasMore, scope, user]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return <Flame className="h-4 w-4 text-orange-500" />;
    if (mood >= 3) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <Timer className="h-4 w-4 text-gray-500" />;
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'commits': return <Code className="h-4 w-4 text-green-600" />;
      case 'lines_added': return <Code className="h-4 w-4 text-green-600" />;
      case 'lines_removed': return <Code className="h-4 w-4 text-red-600" />;
      case 'files_changed': return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <Code className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleLike = async (sessionId: string) => {
    if (!user) return;
    const current = sessions.find(s => s.id === sessionId);
    if (!current) return;
    const optimistic = sessions.map(session => session.id === sessionId ? { ...session, isLiked: !session.isLiked, kudos: session.isLiked ? Math.max(0, session.kudos - 1) : session.kudos + 1 } : session);
    setSessions(optimistic);
    try {
      if (current.isLiked) {
        await removeSessionKudos(sessionId, user.id);
      } else {
        await addSessionKudos(sessionId, user.id);
      }
    } catch {
      // rollback on failure
      setSessions(sessions);
    }
  };

  const handleComment = (sessionId: string) => {
    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, showComments: !session.showComments };
      }
      return session;
    }));
  };

  const handleAddComment = async (sessionId: string) => {
    if (!user) return;
    const target = sessions.find(s => s.id === sessionId);
    if (!target || !target.newComment.trim()) return;
    const content = target.newComment.trim();
    // optimistic update: increase comment count placeholder
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, comments: [...s.comments, { id: 'temp', user: { id: user.id, handle: 'you', avatar_url: user.user_metadata?.avatar_url || 'https://github.com/github.png' }, content, created_at: new Date().toISOString() } as any], newComment: '' } : s));
    try {
      await addSessionComment(sessionId, user.id, content);
    } catch {
      // ignore for now; could rollback
    }
  };

  const handleShare = (sessionId: string) => {
    // TODO: Implement share functionality
    console.log('Sharing session:', sessionId);
  };

  const handleFollow = (userId: string) => {
    setSessions(sessions.map(session => {
      if (session.user.id === userId) {
        return {
          ...session,
          user: {
            ...session.user,
            isFollowing: !session.user.isFollowing
          }
        };
      }
      return session;
    }));
  };

  const handleEditSession = (sessionId: string) => {
    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          isEditing: true,
          editNote: session.note || ''
        };
      }
      return session;
    }));
  };

  const handleCancelEdit = (sessionId: string) => {
    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          isEditing: false,
          editNote: undefined
        };
      }
      return session;
    }));
  };

  const handleSaveEdit = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.isEditing) return;

    try {
      const updates = { note: session.editNote || null };
      await updateSession(sessionId, updates);
      
      setSessions(sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            note: session.editNote || undefined,
            isEditing: false,
            editNote: undefined
          };
        }
        return s;
      }));
    } catch (error) {
      console.error('Failed to update session:', error);
      // Could show error toast here
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
      // Could show error toast here
    }
  };

  const handleReportSession = async (sessionId: string, reason: string) => {
    if (!user) return;
    
    try {
      await createReport({
        reporter_id: user.id,
        entity_type: 'session',
        entity_id: sessionId,
        reason
      });
      
      console.log('Session reported successfully');
      // The AlertDialog should close automatically after clicking
    } catch (error) {
      console.error('Failed to report session:', error);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="text-sm text-gray-600">Loading activity...</div>
      )}
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load activity</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      {/* Social Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600">See what your fellow builders are up to</p>
        </div>
        <Link to="/community">
          <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50">
            <Zap className="h-4 w-4 mr-2" />
            Follow More Builders
          </Button>
        </Link>
      </div>

      {sessions.map((session) => (
        <Card key={session.id} className="overflow-hidden bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user.avatar_url} />
                  <AvatarFallback>{session.user.handle.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      to={`/profile/${session.user.handle}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      @{session.user.handle}
                    </Link>
                    <Badge className={`${session.project.color} text-white`}>
                      {session.project.emoji} {session.project.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{formatTimeAgo(session.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {session.user.isFollowing !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFollow(session.user.id)}
                    className={`flex items-center space-x-1 ${
                      session.user.isFollowing 
                        ? 'text-gray-600 hover:text-gray-800' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {session.user.isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        <span className="hidden sm:inline">Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Follow</span>
                      </>
                    )}
                  </Button>
                )}
                
                {/* Edit/Delete options for own sessions */}
                {(scope === 'mine' || session.user.id === user?.id) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditSession(session.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit note
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete session
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this session? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSession(session.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Show more options for other users' sessions */}
                {scope !== 'mine' && session.user.id !== user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Flag className="h-4 w-4 mr-2" />
                            Report session
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Report Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Help us keep the community safe by reporting inappropriate content.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2 my-4">
                            <p className="text-sm font-medium">Why are you reporting this session?</p>
                            <div className="space-y-2">
                              {['Spam or inappropriate content', 'Harassment', 'Copyright violation', 'Other'].map((reason) => (
                                <button
                                  key={reason}
                                  onClick={() => handleReportSession(session.id, reason)}
                                  className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Session Details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{formatDuration(session.duration)}</span>
                </div>
                {getMoodIcon(session.mood)}
                <span className="text-sm text-gray-600">{session.mood}/5</span>
              </div>
              <div className="flex items-center space-x-2">
                {session.metrics.commits && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    {getMetricIcon('commits')}
                    <span>{session.metrics.commits} commits</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            {session.isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={session.editNote || ''}
                  onChange={(e) => setSessions(sessions.map(s => 
                    s.id === session.id ? { ...s, editNote: e.target.value } : s
                  ))}
                  placeholder="Add a note about this session..."
                  className="min-h-[80px]"
                />
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSaveEdit(session.id)}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleCancelEdit(session.id)}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              session.note && (
                <p className="text-gray-700 leading-relaxed">{session.note}</p>
              )
            )}

            {/* Metrics */}
            <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
              {session.metrics.github_connected && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Github className="h-3 w-3" />
                  <span>GitHub</span>
                </div>
              )}
              {session.metrics.commits && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  {getMetricIcon('commits')}
                  <span>{session.metrics.commits} commits</span>
                </div>
              )}
              {session.metrics.lines_added && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  {getMetricIcon('lines_added')}
                  <span>+{session.metrics.lines_added}</span>
                </div>
              )}
              {session.metrics.lines_removed && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Code className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">-{session.metrics.lines_removed}</span>
                </div>
              )}
              {session.metrics.files_changed && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  {getMetricIcon('files_changed')}
                  <span>{session.metrics.files_changed} files</span>
                </div>
              )}
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(session.id)}
                  className={`flex items-center space-x-1 ${
                    session.isLiked ? 'text-red-500' : 'text-gray-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${session.isLiked ? 'fill-current' : ''}`} />
                  <span>{session.kudos}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleComment(session.id)}
                  className="flex items-center space-x-1 text-gray-600 bg-transparent hover:bg-gray-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{session.comments.length}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(session.id)}
                  className="text-gray-600 bg-transparent hover:bg-gray-100"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Great session!</span>
              </div>
            </div>

            {/* Comments Section */}
            {session.showComments && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {session.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {comment.user.handle.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">@{comment.user.handle}</span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
                
                {/* Add Comment */}
                <div className="flex items-center space-x-2 pt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://github.com/github.png" />
                    <AvatarFallback className="text-xs">Y</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center space-x-2">
                    <Input
                      placeholder="Add a comment..."
                      value={session.newComment}
                      onChange={(e) => setSessions(sessions.map(s => 
                        s.id === session.id ? { ...s, newComment: e.target.value } : s
                      ))}
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(session.id)}
                      disabled={!session.newComment.trim()}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <div ref={sentinelRef} />
      {isLoading && (
        <div className="text-sm text-gray-600 py-2">Loading...</div>
      )}
      {!hasMore && sessions.length > 0 && (
        <div className="text-xs text-gray-500 py-2 text-center">End of feed</div>
      )}
    </div>
  );
};

export default ActivityFeed; 