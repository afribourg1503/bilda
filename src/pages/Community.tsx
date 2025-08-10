import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { getCommunityBuilders, getCommunityProjects, followUser, unfollowUser } from '@/lib/database';
import { toast } from 'sonner';
import { 
  UserPlus, 
  UserMinus, 
  Flame, 
  Clock,
  Target,
  TrendingUp,
  Users,
  Heart,
  Activity,
  MapPin,
  Trophy,
  Star,
  Search,
  Filter,
  Zap,
  Eye,
  Share2
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface Builder {
  id: string;
  handle: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  isFollowing: boolean;
  followers: number;
  following: number;
  totalBuildTime: number;
  currentStreak: number;
  projects: number;
  lastActive: string;
}



interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  creator: {
    handle: string;
    name: string;
    avatar_url: string;
  };
  totalTime: number;
  sessions: number;
  activityScore: number;
  lastActivity: string;
  isPublic: boolean;
}

const Community = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'builders' | 'projects' | 'viral'>('builders');
  const [searchQuery, setSearchQuery] = useState('');
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCommunityData();
  }, [currentUser]);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      // Load builders
      const { data: buildersData, error: buildersError } = await getCommunityBuilders(
        currentUser?.id, 
        20
      );
      
      if (buildersError) {
        console.error('Error loading builders:', buildersError);
      } else {
        setBuilders(buildersData || []);
      }

      // Load projects
      const { data: projectsData, error: projectsError } = await getCommunityProjects(20);
      
      if (projectsError) {
        console.error('Error loading projects:', projectsError);
      } else {
        setProjects(projectsData || []);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowBuilder = async (builderId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;
    
    setFollowLoading(builderId);
    try {
      if (isCurrentlyFollowing) {
        const { error } = await unfollowUser(currentUser.id, builderId);
        if (error) throw error;
      } else {
        const { error } = await followUser(currentUser.id, builderId);
        if (error) throw error;
      }
      
      // Update local state optimistically
      setBuilders(builders.map(builder => {
        if (builder.id === builderId) {
          return {
            ...builder,
            isFollowing: !isCurrentlyFollowing,
            followers: isCurrentlyFollowing ? builder.followers - 1 : builder.followers + 1
          };
        }
        return builder;
      }));
      
      toast.success(isCurrentlyFollowing ? 'Unfollowed user' : 'Following user!');
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to follow/unfollow user');
    } finally {
      setFollowLoading(null);
    }
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

  const filteredBuilders = builders.filter(builder =>
    builder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    builder.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    builder.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.creator.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Community</h2>
              <p className="text-gray-600">Discover amazing builders and projects to follow</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search builders and projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm border-white/20">
            <TabsTrigger value="builders">Builders</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="viral">Trending & Viral</TabsTrigger>
          </TabsList>

          <TabsContent value="builders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuilders.map((builder) => (
                <Card key={builder.id} className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={builder.avatar_url} />
                          <AvatarFallback className="bg-gray-200 text-gray-700">
                            {builder.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link 
                            to={`/profile/${builder.handle}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {builder.name}
                          </Link>
                          <p className="text-sm text-gray-600">@{builder.handle}</p>
                        </div>
                      </div>
                      <Button
                        variant={builder.isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollowBuilder(builder.id, builder.isFollowing)}
                        disabled={followLoading === builder.id}
                        className="flex items-center space-x-1"
                      >
                        {builder.isFollowing ? (
                          <>
                            <UserMinus className="h-3 w-3" />
                            <span className="text-xs">Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3" />
                            <span className="text-xs">Follow</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{builder.bio}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Build Time</span>
                        <span className="font-semibold text-gray-900">{formatDuration(builder.totalBuildTime)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Current Streak</span>
                        <span className="font-semibold text-gray-900">{builder.currentStreak} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Projects</span>
                        <span className="font-semibold text-gray-900">{builder.projects}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{builder.followers} followers</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{builder.location || 'Unknown'}</span>
                          </div>
                        </div>
                        <span>Active {formatTimeAgo(builder.lastActive)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{builders.length}</div>
                  <div className="text-sm text-gray-600">Active Builders</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{projects.length}</div>
                  <div className="text-sm text-gray-600">Projects</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.floor(builders.reduce((sum, b) => sum + b.totalBuildTime, 0) / 3600)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Build Time</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {builders.reduce((sum, b) => sum + b.followers, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Connections</div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Builders */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Featured Builders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {builders.slice(0, 4).map((builder) => (
                  <Card key={builder.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={builder.avatar_url} />
                          <AvatarFallback className="text-sm">
                            {builder.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/profile/${builder.handle}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block"
                          >
                            {builder.name}
                          </Link>
                          <p className="text-sm text-gray-600">@{builder.handle}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span>{builder.currentStreak} day streak</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Target className="w-3 h-3 text-green-500" />
                          <span>{builder.projects} projects</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFollowBuilder(builder.id, builder.isFollowing)}
                          disabled={followLoading === builder.id}
                          className={`flex items-center space-x-1 ${
                            builder.isFollowing
                              ? 'text-gray-600 hover:text-gray-800'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {builder.isFollowing ? (
                            <>
                              <UserMinus className="h-3 w-3" />
                              <span className="text-xs">Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              <span className="text-xs">Follow</span>
                            </>
                          )}
                        </Button>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{builder.followers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${project.color}`}>
                          {project.emoji}
                        </div>
                        <div>
                          <Link 
                            to={`/project/${project.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {project.name}
                          </Link>
                          <Link 
                            to={`/profile/${project.creator.handle}`}
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                          >
                            @{project.creator.handle}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{project.sessions}</div>
                        <div className="text-xs text-gray-500">Sessions</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{formatDuration(project.totalTime)}</div>
                        <div className="text-xs text-gray-500">Time</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{project.activityScore}</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last activity {formatTimeAgo(project.lastActivity)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="viral" className="space-y-6">
            {/* Trending Builders Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Trending Builders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {builders.sort((a, b) => b.followers - a.followers).slice(0, 4).map((builder) => (
                  <Card key={builder.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={builder.avatar_url} />
                          <AvatarFallback className="text-sm">
                            {builder.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/profile/${builder.handle}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block"
                          >
                            {builder.name}
                          </Link>
                          <p className="text-sm text-gray-600">@{builder.handle}</p>
                        </div>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Hot
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Users className="w-3 h-3 text-blue-500" />
                          <span>{builder.followers} followers</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Target className="w-3 h-3 text-green-500" />
                          <span>{builder.projects} projects</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFollowBuilder(builder.id, builder.isFollowing)}
                          disabled={followLoading === builder.id}
                          className={`flex items-center space-x-1 ${
                            builder.isFollowing
                              ? 'text-gray-600 hover:text-gray-800'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {builder.isFollowing ? (
                            <>
                              <UserMinus className="h-3 w-3" />
                              <span className="text-xs">Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              <span className="text-xs">Follow</span>
                            </>
                          )}
                        </Button>
                        <div className="flex items-center space-x-1 text-xs text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{Math.floor(Math.random() * 20 + 5)} today</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Viral Projects Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Viral Projects</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.sort((a, b) => b.activityScore - a.activityScore).slice(0, 6).map((project) => (
                  <Card key={project.id} className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${project.color}`}>
                            {project.emoji}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {project.activityScore > 50 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              <Star className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          )}
                          {project.sessions > 10 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              <TrendingUp className="w-3 h-3 mr-1" /> Popular
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                        <p className="text-gray-600 mb-3">{project.description}</p>
                        
                        <div className="flex items-center space-x-3 mb-3">
                          <Link 
                            to={`/profile/${project.creator.handle}`}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={project.creator.avatar_url} />
                              <AvatarFallback className="text-xs">{project.creator.handle.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>by @{project.creator.handle}</span>
                          </Link>
                        </div>
                      </div>

                      {/* Activity Metrics */}
                      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">Activity Score</h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <Zap className="w-3 h-3 mr-1" />
                            {project.activityScore}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center space-x-1">
                            <Activity className="h-3 w-3 text-blue-600" />
                            <span className="text-gray-700">{project.sessions} sessions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <span className="text-gray-700">{formatDuration(project.totalTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Link to={`/project/${project.id}`}>
                          <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default Community;