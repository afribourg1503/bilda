import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Github,
  Twitter,
  Globe,
  MapPin,
  Trophy,
  Star,
  Activity,
  Users,
  Heart,
  Zap,
  GitBranch,
  Award,
  CheckCircle,
  Eye,
  Share2,
  ExternalLink,
  Calendar as CalendarIcon,
  BarChart3,
  Target as TargetIcon,
  Copy
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { getProfileByHandle, getProjects as getProjectsDb, getSessionsPaginated, followUser, unfollowUser, getFollowersCount, getFollowingCount, isFollowingUser } from '@/lib/database';

interface PublicUser {
  id: string;
  handle: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  isFollowing: boolean;
  followers: number;
  following: number;
  totalBuildTime: number;
  currentStreak: number;
  longestStreak: number;
  projects: number;
  achievements: number;
  level: number;
  xp: number;
  joinDate: string;
}

interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  is_public: boolean;
  followers: number;
  isFollowing: boolean;
  stats: {
    total_sessions: number;
    total_time: number;
    last_session: string;
  };
  is_featured?: boolean;
  is_trending?: boolean;
}

interface BuildingSession {
  id: string;
  project: {
    name: string;
    emoji: string;
    color: string;
  };
  duration: number;
  note?: string;
  mood: number;
  created_at: string;
  kudos: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [recentSessions, setRecentSessions] = useState<BuildingSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!username) return;
      setLoading(true);
      try {
        const { data: profile } = await getProfileByHandle(username);
        if (profile) {
          const [{ count: followers }, { count: following }] = await Promise.all([
            getFollowersCount(profile.user_id),
            getFollowingCount(profile.user_id)
          ]);
          const followingState = currentUser ? await isFollowingUser(currentUser.id, profile.user_id) : { isFollowing: false };
          setProfileUser({
            id: profile.user_id,
            handle: profile.handle,
            name: profile.name ?? profile.handle,
            avatar_url: profile.avatar_url ?? 'https://github.com/github.png',
            bio: profile.bio ?? '',
            location: '',
            website: (profile.links as any)?.website,
            twitter: (profile.links as any)?.twitter,
            github: (profile.links as any)?.github,
            linkedin: (profile.links as any)?.linkedin,
            isFollowing: Boolean((followingState as any).isFollowing),
            followers: followers ?? 0,
            following: following ?? 0,
            totalBuildTime: 0,
            currentStreak: 0,
            longestStreak: 0,
            projects: 0,
            achievements: 0,
            level: 0,
            xp: 0,
            joinDate: new Date().toISOString(),
          });
          const { data: projectsData } = await getProjectsDb(profile.user_id);
          if (projectsData) setProjects((projectsData as any[]).map(p => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji ?? '🚀',
            color: p.color ?? 'bg-purple-500',
            description: p.description ?? '',
            is_public: Boolean(p.is_public),
            followers: 0,
            isFollowing: false,
            stats: { total_sessions: 0, total_time: 0, last_session: new Date(p.updated_at).toISOString() },
          })));
          const { data: sessionsData } = await getSessionsPaginated(profile.user_id, 20);
          if (sessionsData) setRecentSessions((sessionsData as any[]).map(s => ({
            id: s.id,
            project: { name: 'Project', emoji: '🚀', color: 'bg-purple-500' },
            duration: s.duration ?? 0,
            note: s.note ?? undefined,
            mood: s.mood ?? 3,
            created_at: s.created_at,
            kudos: 0,
          })));
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    const wasFollowing = profileUser.isFollowing;
    setProfileUser({ ...profileUser, isFollowing: !profileUser.isFollowing, followers: wasFollowing ? profileUser.followers - 1 : profileUser.followers + 1 });
    try {
      if (wasFollowing) await unfollowUser(currentUser.id, profileUser.id);
      else await followUser(currentUser.id, profileUser.id);
    } catch {}
  };

  const handleFollowProject = (projectId: string) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          isFollowing: !project.isFollowing,
          followers: project.isFollowing ? project.followers - 1 : project.followers + 1
        };
      }
      return project;
    }));
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600';
      case 'epic': return 'text-purple-600';
      case 'rare': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileUser?.handle}`;
    const shareText = `Check out ${profileUser?.name}'s builder profile on Bilda! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileUser?.name} - Builder Profile`,
          text: shareText,
          url: profileUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
        // You could add a toast notification here
        alert('Profile link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  };

  const copyProfileUrl = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileUser?.handle}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      alert('Profile URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL');
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!profileUser) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">The builder you're looking for doesn't exist.</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="relative mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-pulse-50 to-purple-50 rounded-3xl"></div>
          
          {/* Profile Header */}
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row items-start justify-between">
              <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={profileUser.avatar_url} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-3xl">
                    {profileUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{profileUser.name}</h1>
                    <Badge variant="secondary" className="bg-pulse-100 text-pulse-700">
                      Level {profileUser.level}
                    </Badge>
                  </div>
                  <p className="text-xl text-gray-600 mb-2">@{profileUser.handle}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profileUser.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Joined {new Date(profileUser.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {currentUser?.id !== profileUser.id && (
                  <Button
                    variant={profileUser.isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="flex items-center space-x-2"
                  >
                    {profileUser.isFollowing ? (
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
                <Button variant="outline" className="flex items-center space-x-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={copyProfileUrl} className="flex items-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>Copy URL</span>
                </Button>
              </div>
            </div>

            <p className="text-gray-700 mt-6 leading-relaxed max-w-3xl">{profileUser.bio}</p>

            {/* Social Links */}
            <div className="flex items-center space-x-4 mt-6">
              {profileUser.website && (
                <a 
                  href={profileUser.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
              {profileUser.twitter && (
                <a 
                  href={`https://twitter.com/${profileUser.twitter.replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </a>
              )}
              {profileUser.github && (
                <a 
                  href={`https://github.com/${profileUser.github}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              )}
              {profileUser.linkedin && (
                <a 
                  href={`https://linkedin.com/in/${profileUser.linkedin}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{profileUser.followers}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{profileUser.currentStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{formatDuration(profileUser.totalBuildTime)}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{profileUser.projects}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm border-white/20">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Link to={`/project/${project.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${project.color}`}>
                            {project.emoji}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {project.is_public ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Public
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  <TargetIcon className="w-3 h-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                              {project.is_featured && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                  <Star className="w-3 h-3 mr-1" /> Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Sessions</span>
                        <span className="font-semibold text-gray-900">{project.stats.total_sessions}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Time</span>
                        <span className="font-semibold text-gray-900">{formatDuration(project.stats.total_time)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Followers</span>
                        <span className="font-semibold text-gray-900">{project.followers}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link to={`/project/${project.id}`}>
                        <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {project.is_public && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFollowProject(project.id)}
                          className={`flex items-center space-x-1 ${
                            project.isFollowing
                              ? 'text-gray-600 hover:text-gray-800'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {project.isFollowing ? (
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
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
                        <Badge className={`${session.project.color} text-white`}>
                          {session.project.emoji} {session.project.name}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-900">{session.note}</p>
                          <p className="text-sm text-gray-600">{formatTimeAgo(session.created_at)}</p>
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
                        <div className="flex items-center space-x-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-600">{session.kudos}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className={`text-center p-4 bg-gradient-to-br ${achievement.color} rounded-lg border border-white/20`}>
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <div className="font-semibold text-gray-900 mb-1">{achievement.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{achievement.description}</div>
                      <div className={`text-xs ${getRarityColor(achievement.rarity)} font-medium`}>
                        {achievement.rarity.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(achievement.unlockedAt)}
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
                    <BarChart3 className="h-5 w-5" />
                    <span>Building Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Build Time</span>
                    <span className="font-semibold">{formatDuration(profileUser.totalBuildTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Streak</span>
                    <span className="font-semibold">{profileUser.currentStreak} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Longest Streak</span>
                    <span className="font-semibold">{profileUser.longestStreak} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Projects</span>
                    <span className="font-semibold">{profileUser.projects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Level</span>
                    <span className="font-semibold">{profileUser.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total XP</span>
                    <span className="font-semibold">{profileUser.xp.toLocaleString()}</span>
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
                    <span className="font-semibold">{profileUser.followers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Following</span>
                    <span className="font-semibold">{profileUser.following}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Achievements</span>
                    <span className="font-semibold">{profileUser.achievements}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">{new Date(profileUser.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default PublicProfile; 