import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  UserMinus, 
  Flame, 
  Clock,
  Target,
  TrendingUp,
  Github,
  Globe,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Activity,
  Calendar,
  MapPin,
  Lightbulb
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import FeatureRequests from '@/components/FeatureRequests';
import { getProjectById, getSessionsByProjectPaginated, addSessionKudos, removeSessionKudos, getSessionComments, addSessionComment } from '@/lib/database';

interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  is_public: boolean;
  github_repo?: string;
  website?: string;
  owner: {
    id: string;
    handle: string;
    avatar_url: string;
    name: string;
  };
  followers: number;
  isFollowing: boolean;
  stats: {
    total_sessions: number;
    total_time: number;
    avg_session: number;
    last_session: string;
    total_kudos: number;
  };
}

interface BuildingSession {
  id: string;
  user: {
    id: string;
    handle: string;
    avatar_url: string;
  };
  duration: number;
  note?: string;
  mood: number;
  created_at: string;
  kudos: number;
  isLiked: boolean;
  comments: { id: string; user: { id: string; handle: string; avatar_url: string }; content: string; created_at: string }[];
  showComments?: boolean;
  newComment?: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [recentSessions, setRecentSessions] = useState<BuildingSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get default tab from URL parameter
  const defaultTab = searchParams.get('tab') || 'sessions';

  useEffect(() => {
    const run = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const { data: proj } = await getProjectById(projectId);
        if (proj) {
          setProject({
            id: proj.id,
            name: proj.name,
            emoji: proj.emoji ?? '🚀',
            color: proj.color ?? 'bg-purple-500',
            description: proj.description ?? '',
            is_public: Boolean(proj.is_public),
            github_repo: proj.github_repo ?? undefined,
            website: proj.website ?? undefined,
            owner: {
              id: proj.user_id,
              handle: 'you',
              avatar_url: 'https://github.com/github.png',
              name: 'You'
            },
            followers: 0,
            isFollowing: false,
            stats: {
              total_sessions: 0,
              total_time: 0,
              avg_session: 0,
              last_session: new Date().toISOString(),
              total_kudos: 0
            }
          });
        }
        const { data: sess } = await getSessionsByProjectPaginated(projectId, 20);
        if (sess) {
          setRecentSessions((sess as any[]).map(s => ({
            id: s.id,
            user: { id: s.user_id, handle: 'you', avatar_url: 'https://github.com/github.png' },
            duration: s.duration ?? 0,
            note: s.note ?? undefined,
            mood: s.mood ?? 3,
            created_at: s.created_at,
            kudos: 0,
            isLiked: false,
            comments: [],
            showComments: false,
            newComment: '',
          })));
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [projectId]);

  const handleFollow = () => {
    if (project) {
      setProject({
        ...project,
        isFollowing: !project.isFollowing,
        followers: project.isFollowing ? project.followers - 1 : project.followers + 1
      });
    }
  };

  const handleLike = async (sessionId: string) => {
    const current = recentSessions.find(s => s.id === sessionId);
    if (!current) return;
    setRecentSessions(sessions => sessions.map(session => session.id === sessionId ? {
      ...session,
      isLiked: !session.isLiked,
      kudos: session.isLiked ? Math.max(0, session.kudos - 1) : session.kudos + 1
    } : session));
    try {
      if (!currentUser) return;
      if (current.isLiked) await removeSessionKudos(sessionId, currentUser.id); else await addSessionKudos(sessionId, currentUser.id);
    } catch {}
  };

  const handleToggleComments = async (sessionId: string) => {
    const cur = recentSessions.find(s => s.id === sessionId);
    if (!cur) return;
    // Toggle first
    setRecentSessions(prev => prev.map(s => s.id === sessionId ? { ...s, showComments: !s.showComments } : s));
    if (!cur.showComments) {
      try {
        const { data } = await getSessionComments(sessionId);
        if (data) {
          const mapped = (data as any[]).map(c => ({
            id: c.id,
            user: { id: c.user_id, handle: 'user', avatar_url: 'https://github.com/github.png' },
            content: c.content,
            created_at: c.created_at,
          }));
          setRecentSessions(prev => prev.map(s => s.id === sessionId ? { ...s, comments: mapped } : s));
        }
      } catch {}
    }
  };

  const handleAddComment = async (sessionId: string) => {
    const s = recentSessions.find(x => x.id === sessionId);
    if (!s || !s.newComment?.trim() || !currentUser) return;
    const content = s.newComment.trim();
    // optimistic
    setRecentSessions(prev => prev.map(x => x.id === sessionId ? {
      ...x,
      comments: [...x.comments, { id: 'temp', user: { id: currentUser.id, handle: 'you', avatar_url: currentUser.user_metadata?.avatar_url || 'https://github.com/github.png' }, content, created_at: new Date().toISOString() }],
      newComment: ''
    } : x));
    try {
      await addSessionComment(sessionId, currentUser.id, content);
    } catch {}
  };

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
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!project) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Link to="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${project.color}`}>
                  {project.emoji}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <Link 
                      to={`/profile/${project.owner.handle}`}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.owner.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {project.owner.handle.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{project.owner.handle}</span>
                    </Link>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{project.followers} followers</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {currentUser?.id !== project.owner.id && (
                  <Button
                    variant={project.isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="flex items-center space-x-2"
                  >
                    {project.isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">{project.description}</p>

            {/* Project Links */}
            <div className="flex items-center space-x-4 mb-6">
              {project.github_repo && (
                <a 
                  href={`https://github.com/${project.github_repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {project.website && (
                <a 
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Website</span>
                </a>
              )}
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{project.stats.total_sessions}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatDuration(project.stats.total_time)}</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatDuration(project.stats.avg_session)}</div>
                <div className="text-sm text-gray-600">Avg Session</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{project.stats.total_kudos}</div>
                <div className="text-sm text-gray-600">Kudos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm border-white/20">
            <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="features">Feature Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Building Sessions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user.avatar_url} />
                          <AvatarFallback>
                            {session.user.handle.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/profile/${session.user.handle}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              @{session.user.handle}
                            </Link>
                            <span className="text-sm text-gray-500">{formatTimeAgo(session.created_at)}</span>
                          </div>
                          {session.note && (
                            <p className="text-sm text-gray-600 mt-1">{session.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{formatDuration(session.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getMoodIcon(session.mood)}
                          <span className="text-sm text-gray-600">{session.mood}/5</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(session.id)}
                          className={`flex items-center space-x-1 ${
                            session.isLiked ? 'text-red-500' : 'text-gray-600'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${session.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{session.kudos}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Building Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="font-semibold">{project.stats.total_sessions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Build Time</span>
                    <span className="font-semibold">{formatDuration(project.stats.total_time)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Session</span>
                    <span className="font-semibold">{formatDuration(project.stats.avg_session)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Session</span>
                    <span className="font-semibold">{formatTimeAgo(project.stats.last_session)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Social Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Followers</span>
                    <span className="font-semibold">{project.followers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Kudos</span>
                    <span className="font-semibold">{project.stats.total_kudos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Public Project</span>
                    <span className="font-semibold">{project.is_public ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeatureRequests projectId={project.id} projectName={project.name} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default ProjectDetail; 