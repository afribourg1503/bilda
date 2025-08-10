import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Flame, 
  Home, 
  User, 
  FolderOpen, 
  Trophy, 
  LogOut,
  Settings,
  ChevronDown,
  Users,
  TrendingUp,
  Target,
  MapPin,
  Search,
  X,
  Activity,
  Bell,
  Plus,
  Upload,
  FileText,
  Route,
  MessageSquare,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { listNotifications, subscribeToNotifications, searchProfiles, searchProjects } from '@/lib/database';

const AppNavbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'builders' | 'projects' | 'activities' | 'challenges'>('builders');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<{ profiles: any[], projects: any[] }>({ profiles: [], projects: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        if (!user) return setUnreadCount(0);
        const { data } = await listNotifications(user.id, 50);
        const count = (data as any[])?.filter((n: any) => !n.read).length || 0;
        setUnreadCount(count);
      } catch {}
    };
    run();
    const ch = user ? subscribeToNotifications(user.id, () => run()) : null;
    return () => { try { ch?.unsubscribe(); } catch {} };
  }, [user]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        
        try {
          const [profilesResult, projectsResult] = await Promise.all([
            searchProfiles(searchQuery, 5),
            searchProjects(searchQuery, 5)
          ]);
          
          setSearchResults({
            profiles: profilesResult.data || [],
            projects: projectsResult.data || []
          });
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults({ profiles: [], projects: [] });
        }
        
        setIsSearching(false);
      } else {
        setShowResults(false);
        setSearchResults({ profiles: [], projects: [] });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLogout = async () => {
    console.log('Logout clicked');
    try {
      await signOut();
      console.log('Logout successful');
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    console.log(`Searching for "${searchQuery}" in category: ${searchCategory}`);
    
    // Navigate to search results page with query parameters
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&category=${searchCategory}`);
    
    // Clear search and hide search bar
    setSearchQuery('');
    setShowSearchBar(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isDashboardActive = () => {
    return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
  };

  const navItems = [
    { path: '/projects', label: 'Projects', icon: FolderOpen },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/leaderboards', label: 'Leaderboards', icon: Trophy },
    { path: '/challenges', label: 'Challenges', icon: Target },
  ];

  const dashboardSubPages = [
    { path: '/dashboard', label: 'Feed', icon: Users },
    { path: '/stats', label: 'Stats', icon: TrendingUp },
    { path: '/challenges', label: 'Challenges', icon: Target },
  ];

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <img 
                src="/bilda logo.svg" 
                alt="Bilda Logo" 
                className="h-16 w-auto" 
              />
            </Link>
            
            <Badge variant="secondary" className="hidden sm:inline-flex bg-gray-100 text-gray-700 border-gray-200">
              <Flame className="w-3 h-3 mr-1" />
              Build in Public
            </Badge>
          </div>

          {/* Search Bar */}
          {showSearchBar && (
            <div className="hidden lg:flex items-center space-x-2 w-full max-w-4xl mx-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 rounded-l-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <span className="capitalize">{searchCategory}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32 bg-white border-gray-200 shadow-lg">
                  <DropdownMenuItem onClick={() => setSearchCategory('builders')} className="text-gray-700 hover:text-gray-900">
                    <Users className="h-4 w-4 mr-2" />
                    Builders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchCategory('projects')} className="text-gray-700 hover:text-gray-900">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Projects
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchCategory('activities')} className="text-gray-700 hover:text-gray-900">
                    <Activity className="h-4 w-4 mr-2" />
                    Activities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchCategory('challenges')} className="text-gray-700 hover:text-gray-900">
                    <Trophy className="h-4 w-4 mr-2" />
                    Challenges
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search builders and projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowResults(false);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                {/* Search Results Dropdown */}
                {showResults && (searchResults.profiles.length > 0 || searchResults.projects.length > 0 || isSearching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pulse-500 mx-auto"></div>
                        <span className="ml-2">Searching...</span>
                      </div>
                    ) : (
                      <>
                        {/* Profiles */}
                        {searchResults.profiles.length > 0 && (
                          <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                              Builders
                            </div>
                            {searchResults.profiles.map((profile: any) => (
                              <button
                                key={profile.user_id}
                                onClick={() => {
                                  navigate(`/profile/${profile.handle}`);
                                  setSearchQuery('');
                                  setShowResults(false);
                                }}
                                className="w-full flex items-center space-x-3 px-2 py-2 hover:bg-gray-50 rounded text-left"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={profile.avatar_url} />
                                  <AvatarFallback>{profile.handle?.charAt(0)?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {profile.name || profile.handle}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">@{profile.handle}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Projects */}
                        {searchResults.projects.length > 0 && (
                          <div className="p-2 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                              Projects
                            </div>
                            {searchResults.projects.map((project: any) => (
                              <button
                                key={project.id}
                                onClick={() => {
                                  navigate(`/project/${project.id}`);
                                  setSearchQuery('');
                                  setShowResults(false);
                                }}
                                className="w-full flex items-center space-x-3 px-2 py-2 hover:bg-gray-50 rounded text-left"
                              >
                                <div className={`w-8 h-8 rounded-lg ${project.color || 'bg-gray-500'} flex items-center justify-center text-white font-semibold`}>
                                  {project.emoji || '🚀'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {project.name}
                                  </p>
                                  {project.description && (
                                    <p className="text-sm text-gray-500 truncate">{project.description}</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* View All Results */}
                        {searchQuery.trim() && (
                          <div className="p-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                handleSearch();
                                setShowResults(false);
                              }}
                              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-pulse-600 hover:bg-pulse-50 rounded"
                            >
                              <Search className="h-4 w-4" />
                              <span>View all results for "{searchQuery}"</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearch}
                className="px-3 py-2 bg-pulse-500 hover:bg-pulse-600 text-white rounded-lg"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchBar(false)}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Search Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className={`hidden lg:flex text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 ${showSearchBar ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Navigation Links */}
          <nav className={`hidden md:flex items-center space-x-2 transition-all duration-300 ${showSearchBar ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {/* Dashboard Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDashboardActive()
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span className="font-semibold">Dashboard</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white border-gray-200 shadow-lg">
                <DropdownMenuLabel className="text-gray-900">Dashboard</DropdownMenuLabel>
                {dashboardSubPages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 ${
                          isActive(item.path) ? 'bg-gray-100 text-gray-900' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Other Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications Bell */}
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[10px] leading-[16px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
            
            {/* Mobile Menu Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-50">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-lg">
                <DropdownMenuLabel className="text-gray-900">Navigation</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 ${
                          isActive(item.path) ? 'bg-gray-100 text-gray-900' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-gray-900">Create</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Start Session</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/projects" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Create Project</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/community" className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Create Post</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar and Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-gray-200">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gray-100 text-gray-700">
                      {user?.user_metadata?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-[100]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-2 py-1">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">{user?.user_metadata?.name || user?.email}</p>
                    <p className="text-xs leading-none text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="px-2 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900">
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-2 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900">
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-2 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900">
                  <Link to="/achievements" className="flex items-center">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Achievements</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-2 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900">
                  <Link to="/dashboard" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer px-2 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Create Activity Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8 rounded-full bg-pulse-500 hover:bg-pulse-600 text-white shadow-sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-lg">
                <DropdownMenuItem asChild className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Link to="/dashboard" className="flex items-center">
                    <Upload className="h-4 w-4 mr-3" />
                    <span>Start Session</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Link to="/projects" className="flex items-center">
                    <FileText className="h-4 w-4 mr-3" />
                    <span>Create Project</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Link to="/community" className="flex items-center">
                    <Route className="h-4 w-4 mr-3" />
                    <span>Share Progress</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Link to="/ship" className="flex items-center">
                    <Zap className="h-4 w-4 mr-3" />
                    <span>Ship Project</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Link to="/community" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-3" />
                    <span>Create Post</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar; 