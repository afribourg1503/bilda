import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  Square, 
  Timer, 
  TrendingUp, 
  Calendar,
  Flame,
  Users,
  Target,
  Github,
  Twitter,
  Clock,
  Zap,
  BarChart3,
  Activity,
  MapPin,
  Trophy,
  Shield,
  Flag,
  UserPlus,
  ArrowRight,
  Settings,
  BookOpen,
  Star
} from 'lucide-react';
import SessionTimer from '@/components/SessionTimer';
import ActivityFeed from '@/components/ActivityFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsOverview from '@/components/StatsOverview';
import ProjectSelector from '@/components/ProjectSelector';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import LiveNow from '@/components/LiveNow';
import { getSuggestedBuilders, followUser } from '@/lib/database';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [suggestedBuilders, setSuggestedBuilders] = useState<any[]>([]);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSuggestedBuilders();
    }
  }, [user]);

  const fetchSuggestedBuilders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getSuggestedBuilders(user.id, 3);
      if (error) throw error;
      setSuggestedBuilders(data || []);
    } catch (error) {
      console.error('Error fetching suggested builders:', error);
    }
  };

  const handleFollowUser = async (targetUserId: string) => {
    if (!user) return;
    
    setFollowLoading(targetUserId);
    try {
      const { error } = await followUser(user.id, targetUserId);
      if (error) throw error;
      
      toast.success('Successfully followed user!');
      // Remove from suggested builders after following
      setSuggestedBuilders(prev => prev.filter(builder => builder.user_id !== targetUserId));
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(null);
    }
  };
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
  };

  const handleProjectChange = (projectId: string | null) => {
    setSelectedProject(projectId);
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - User Profile & Stats */}
          <div className="col-span-3">
            <div className="space-y-4">
              {/* User Profile Card */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xl">{(user?.user_metadata?.name || user?.email)?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{user?.user_metadata?.name || user?.email || 'User'}</h3>
                    <p className="text-xs text-gray-600 mb-3">Building amazing things in public</p>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Following</p>
                        <p className="text-sm font-semibold text-gray-900">12</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Followers</p>
                        <p className="text-sm font-semibold text-gray-900">47</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Sessions</p>
                        <p className="text-sm font-semibold text-gray-900">156</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Latest Activity */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Latest Activity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Bilda Development</p>
                        <p className="text-xs text-gray-500">2h 34m • Today</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">API Backend</p>
                        <p className="text-xs text-gray-500">1h 15m • Yesterday</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-pulse-600 hover:text-pulse-700 text-xs"
                    onClick={() => navigate('/stats')}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Training Log
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Type Summary */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Activity Summary</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <Target className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Coding</p>
                      <p className="text-xs font-semibold text-gray-900">67h</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <BookOpen className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Learning</p>
                      <p className="text-xs font-semibold text-gray-900">23h</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <Activity className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Planning</p>
                      <p className="text-xs font-semibold text-gray-900">15h</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <Zap className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Shipping</p>
                      <p className="text-xs font-semibold text-gray-900">8h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Weekly Goal</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Build Time</span>
                        <span className="text-gray-900">15h / 20h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-pulse-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Sessions</span>
                        <span className="text-gray-900">12 / 15</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-pulse-600 hover:text-pulse-700 text-xs"
                    onClick={() => navigate('/stats')}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Manage Goals
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content - Activity Feed */}
          <div className="col-span-6">
            <div className="space-y-4">
              {/* Session Timer */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <ProjectSelector selectedProject={selectedProject} onProjectChange={handleProjectChange} />
                  </div>
                  <SessionTimer 
                    isActive={isSessionActive}
                    onStart={handleStartSession}
                    onStop={handleStopSession}
                    selectedProject={selectedProject}
                    onProjectChange={handleProjectChange}
                  />
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">Activity</CardTitle>
                      <p className="text-sm text-gray-600">Following, Global, and My Sessions</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/stats')}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Stats
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/challenges')}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Challenges
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="following" className="w-full">
                    <TabsList className="bg-gray-100">
                      <TabsTrigger value="following">Following</TabsTrigger>
                      <TabsTrigger value="global">Global</TabsTrigger>
                      <TabsTrigger value="mine">My Sessions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="following" className="pt-4">
                      <ActivityFeed scope="following" />
                    </TabsContent>
                    <TabsContent value="global" className="pt-4">
                      <ActivityFeed scope="global" />
                    </TabsContent>
                    <TabsContent value="mine" className="pt-4">
                      <ActivityFeed scope="mine" />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Community Features */}
          <div className="col-span-3">
            <div className="space-y-4">
              {/* Challenges */}
              <LiveNow />
              
              {/* Challenges */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-pulse-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Challenges</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Join weekly building challenges to earn achievements and compete with other builders.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/challenges')}
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    View All Challenges
                  </Button>
                </CardContent>
              </Card>

              {/* Clubs */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Flag className="h-4 w-4 text-pulse-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Clubs</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Why build alone? Join or create a club to collaborate with other builders.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/clubs')}
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    View All Clubs
                  </Button>
                </CardContent>
              </Card>

              {/* Suggested Builders */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggested Builders</h4>
                  <div className="space-y-2">
                    {suggestedBuilders.length > 0 ? (
                      suggestedBuilders.map((builder, index) => (
                        <div key={builder.user_id} className={`flex items-center space-x-${index === suggestedBuilders.length - 1 ? '3' : '2'}`}>
                          <Avatar className={index === suggestedBuilders.length - 1 ? "h-8 w-8" : "h-6 w-6"}>
                            <AvatarImage src={builder.avatar_url || 'https://github.com/github.png'} />
                            <AvatarFallback className="text-xs">
                              {(builder.handle || builder.name || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className={`font-medium text-gray-900 ${index === suggestedBuilders.length - 1 ? 'text-sm' : 'text-xs'}`}>
                              {builder.name || builder.handle || 'Anonymous'}
                            </p>
                            {builder.handle && (
                              <p className="text-xs text-gray-500">@{builder.handle}</p>
                            )}
                            {index === suggestedBuilders.length - 1 && builder.bio && (
                              <p className="text-xs text-pulse-600 truncate">{builder.bio}</p>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleFollowUser(builder.user_id)}
                            disabled={followLoading === builder.user_id}
                            className={index === suggestedBuilders.length - 1 ? "" : "text-xs px-2 py-1"}
                          >
                            {followLoading === builder.user_id ? (
                              <div className="w-3 h-3 border-2 border-pulse-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <UserPlus className={`h-3 w-3 ${index === suggestedBuilders.length - 1 ? 'mr-1' : ''}`} />
                                {index === suggestedBuilders.length - 1 && 'Follow'}
                              </>
                            )}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No suggestions available</p>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-pulse-600 hover:text-pulse-700"
                    onClick={() => navigate('/community')}
                  >
                    Find and Invite Your Friends
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Tip */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Pro Tip</h4>
                      <p className="text-sm text-gray-600">
                        Track your progress on different projects to see your building patterns and improve your workflow.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Dashboard; 