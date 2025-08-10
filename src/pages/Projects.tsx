import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Github,
  Globe,
  Lock,
  UserPlus,
  UserMinus,
  Users,
  Zap,
  Star,
  TrendingUp as TrendingUpIcon,
  DollarSign,
  Users as UsersIcon,
  BarChart3,
  Filter,
  Calendar,
  GitBranch,
  Activity,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createProject as createProjectDb, getProjects as getProjectsDb, updateProject as updateProjectDb, deleteProject as deleteProjectDb, subscribeToProjects } from '@/lib/database';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'feature' | 'bugfix' | 'launch' | 'milestone';
  completed: boolean;
}

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
  };
  followers: number;
  isFollowing: boolean;
  stats: {
    total_sessions: number;
    total_time: number;
    avg_session: number;
    last_session: string;
  };
  milestones?: Milestone[];
  // Viral features
  is_featured?: boolean;
  is_trending?: boolean;
  viral_score?: number;
  funding_status?: 'bootstrapped' | 'seed' | 'series_a' | 'series_b' | 'acquired';
  funding_amount?: number;
  investors?: string[];
  press_mentions?: string[];
  launch_date?: string;
  traction_metrics?: {
    users?: number;
    revenue?: number;
    growth_rate?: number;
  };
}

const Projects = () => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'following' | 'trending' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'time' | 'popularity' | 'recent'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    emoji: '🚀',
    color: 'bg-purple-500',
    description: '',
    is_public: true,
    github_repo: '',
    website: '',
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Bilda',
      emoji: '🚀',
      color: 'bg-purple-500',
      description: 'A social platform for tracking and sharing build sessions',
      is_public: true,
      owner: {
        id: '1',
        handle: 'alexbuilder',
        avatar_url: 'https://github.com/github.png'
      },
      followers: 1247,
      isFollowing: false,
      github_repo: 'alexbuilder/bilda',
      website: 'https://bilda.dev',
      stats: {
        total_sessions: 45,
        total_time: 7200,
        avg_session: 2700,
        last_session: '2024-01-15T10:30:00Z',
      },
      is_featured: true,
      is_trending: true,
      viral_score: 95,
      milestones: [
        {
          id: '1',
          title: 'MVP Launch',
          description: 'Initial version with core features',
          date: '2024-01-10T00:00:00Z',
          type: 'launch',
          completed: true
        },
        {
          id: '2',
          title: 'User Authentication',
          description: 'Added OAuth and user profiles',
          date: '2024-01-12T00:00:00Z',
          type: 'feature',
          completed: true
        },
        {
          id: '3',
          title: 'Social Features',
          description: 'Following, comments, and activity feed',
          date: '2024-01-15T00:00:00Z',
          type: 'feature',
          completed: false
        }
      ],
      funding_status: 'seed',
      funding_amount: 500000,
      investors: ['Y Combinator', 'Sequoia Capital'],
      press_mentions: ['TechCrunch', 'The Verge'],
      launch_date: '2024-01-01',
      traction_metrics: {
        users: 15000,
        revenue: 25000,
        growth_rate: 45
      }
    },
    {
      id: '2',
      name: 'Design System',
      emoji: '🎨',
      color: 'bg-pink-500',
      description: 'Component library and design tokens for our products',
      is_public: false,
      owner: {
        id: '1',
        handle: 'alexbuilder',
        avatar_url: 'https://github.com/github.png'
      },
      followers: 0,
      isFollowing: false,
      stats: {
        total_sessions: 23,
        total_time: 5400,
        avg_session: 1800,
        last_session: '2024-01-14T15:20:00Z',
      },
    },
    {
      id: '3',
      name: 'API Backend',
      emoji: '⚡',
      color: 'bg-blue-500',
      description: 'RESTful API with authentication and real-time features',
      is_public: true,
      github_repo: 'alexbuilder/api-backend',
      owner: {
        id: '1',
        handle: 'alexbuilder',
        avatar_url: 'https://github.com/github.png'
      },
      followers: 892,
      isFollowing: false,
      stats: {
        total_sessions: 67,
        total_time: 10800,
        avg_session: 2400,
        last_session: '2024-01-15T08:45:00Z',
      },
    },
  ]);

  // Map DB project shape to local UI shape
  const mapDbProjectToLocal = useCallback((p: any): Project => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji ?? '🚀',
    color: p.color ?? 'bg-purple-500',
    description: p.description ?? '',
    is_public: Boolean(p.is_public),
    github_repo: p.github_repo ?? undefined,
    website: p.website ?? undefined,
    owner: {
      id: p.user_id ?? 'me',
      handle: 'you',
      avatar_url: 'https://github.com/github.png'
    },
    followers: 0,
    isFollowing: false,
    stats: {
      total_sessions: 0,
      total_time: 0,
      avg_session: 0,
      last_session: new Date().toISOString(),
    },
  }), []);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await getProjectsDb(user.id);
        if (error) {
          setLoadError(error.message ?? 'Failed to load projects');
        } else if (data) {
          setProjects(data.map(mapDbProjectToLocal));
        }
      } catch (err: any) {
        setLoadError(err?.message ?? 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    run();

    // Temporarily disabled real-time subscription until projects table is created
    // TODO: Re-enable when projects table is added to database
    
    return () => {
      // Cleanup function (empty for now)
    };
  }, [user, mapDbProjectToLocal]);

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

  const handleCreateProject = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await createProjectDb({
        name: newProject.name,
        emoji: newProject.emoji,
        color: newProject.color,
        description: newProject.description,
        is_public: newProject.is_public,
        github_repo: newProject.github_repo || undefined,
        website: newProject.website || undefined,
        user_id: user.id,
      });
      if (error) {
        toast.error(`Create failed: ${error.message}`);
        return;
      }
      if (data) {
        const mapped = mapDbProjectToLocal(data);
        setProjects(prev => [...prev, mapped]);
        toast.success(`${mapped.name} is live.`);
      }
    } finally {
      setNewProject({
        name: '',
        emoji: '🚀',
        color: 'bg-purple-500',
        description: '',
        is_public: true,
        github_repo: '',
        website: '',
      });
    }
  }, [user, newProject, mapDbProjectToLocal]);

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      const { data, error } = await updateProjectDb(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
        is_public: editingProject.is_public,
        github_repo: editingProject.github_repo,
        website: editingProject.website,
        color: editingProject.color,
        emoji: editingProject.emoji,
      });
      if (!error && data) {
        const mapped = mapDbProjectToLocal(data);
        setProjects(prev => prev.map(p => p.id === mapped.id ? mapped : p));
        toast({ title: 'Project updated', description: mapped.name });
      } else {
        // fallback optimistic update
        setProjects(prev => prev.map(p => p.id === editingProject.id ? editingProject : p));
      }
    } finally {
      setEditingProject(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const prev = projects;
            setProjects(prev => prev.filter(p => p.id !== projectId));
    const { error } = await deleteProjectDb(projectId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' as any });
      setProjects(prev);
    } else {
      toast({ title: 'Project deleted' });
    }
  };

  const handleSeedSampleProjects = async () => {
    if (!user) return;
    const samples = [
      {
        name: 'Bilda',
        emoji: '🚀',
        color: 'bg-purple-500',
        description: 'A social platform for tracking and sharing build sessions',
        is_public: true,
        github_repo: 'alexbuilder/bilda',
        website: 'https://bilda.dev',
      },
      {
        name: 'API Backend',
        emoji: '⚡',
        color: 'bg-blue-500',
        description: 'RESTful API with authentication and real-time features',
        is_public: true,
        github_repo: 'alexbuilder/api-backend',
      },
    ];
    try {
      for (const s of samples) {
        const { data, error } = await createProjectDb({
          name: s.name,
          emoji: s.emoji,
          color: s.color,
          description: s.description,
          is_public: s.is_public,
          github_repo: s.github_repo,
          website: s.website,
          user_id: user.id,
        });
        if (!error && data) {
          setProjects(curr => [...curr, mapDbProjectToLocal(data)]);
        }
      }
      toast({ title: 'Sample projects created' });
    } catch (e: any) {
      toast({ title: 'Seeding failed', description: e?.message ?? 'Unknown error', variant: 'destructive' as any });
    }
  };

  const handleFollowProject = (projectId: string) => {
            setProjects(prev => prev.map(project => {
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

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => {
      // Search filter
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      switch (filterType) {
        case 'following':
          return project.isFollowing;
        case 'trending':
          return project.is_trending || project.is_featured;
        case 'recent':
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          return new Date(project.stats.last_session) > lastWeek;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'time':
          return b.stats.total_time - a.stats.total_time;
        case 'popularity':
          return b.followers - a.followers;
        case 'recent':
          return new Date(b.stats.last_session).getTime() - new Date(a.stats.last_session).getTime();
        default:
          return 0;
      }
    });

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'feature': return <GitBranch className="h-4 w-4" />;
      case 'bugfix': return <CheckCircle className="h-4 w-4" />;
      case 'launch': return <Zap className="h-4 w-4" />;
      case 'milestone': return <Award className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-24 text-gray-600">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading projects...
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      {loadError && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertTitle>Failed to load projects</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Projects</h2>
            <p className="text-gray-600">Discover and follow amazing projects from the builder community</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-pulse-500 hover:bg-pulse-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="My Awesome Project"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="What are you building?"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="github">GitHub Repo (optional)</Label>
                      <Input
                        id="github"
                        value={newProject.github_repo}
                        onChange={(e) => setNewProject({ ...newProject, github_repo: e.target.value })}
                        placeholder="username/repo"
                        className="bg-white border-gray-200 text-gray-900"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        value={newProject.website}
                        onChange={(e) => setNewProject({ ...newProject, website: e.target.value })}
                        placeholder="https://..."
                        className="bg-white border-gray-200 text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public"
                      checked={newProject.is_public}
                      onChange={(e) => setNewProject({ ...newProject, is_public: e.target.checked })}
                    />
                    <Label htmlFor="public">Public project</Label>
                  </div>
                  <Button onClick={handleCreateProject} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Search</Label>
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Filter Type */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Filter</Label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                >
                  <option value="all">All Projects</option>
                  <option value="following">Following</option>
                  <option value="trending">Trending</option>
                  <option value="recent">Recent Activity</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popularity">Most Popular</option>
                  <option value="time">Most Time Logged</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  {filteredAndSortedProjects.length} projects found
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && filteredAndSortedProjects.length === 0 && (
        <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-white/70 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Plus className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="text-gray-600">Click the "New Project" button to create your first project.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button onClick={() => setShowFilters(false)} variant="outline">New Project</Button>
            <Button onClick={handleSeedSampleProjects} variant="secondary">Create sample projects</Button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedProjects.map((project) => (
          <div key={project.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
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
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        {project.is_featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            <Star className="w-3 h-3 mr-1" /> Featured
                          </Badge>
                        )}
                        {project.is_trending && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <TrendingUpIcon className="w-3 h-3 mr-1" /> Trending
                          </Badge>
                        )}
                        {project.funding_status && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <DollarSign className="w-3 h-3 mr-1" /> {project.funding_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProject(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{project.description}</p>

              {/* Project Owner and Social Info */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {project.owner.handle.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-600">@{project.owner.handle}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="h-3 w-3" />
                    <span>{project.followers}</span>
                  </div>
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
              </div>

              {/* Viral Metrics */}
              {(project.is_featured || project.is_trending || project.funding_status || project.traction_metrics) && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Viral Metrics</h4>
                    {project.viral_score && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Zap className="w-3 h-3 mr-1" />
                        Score: {project.viral_score}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {project.funding_status && project.funding_amount && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-gray-700">${project.funding_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {project.traction_metrics?.users && (
                      <div className="flex items-center space-x-1">
                        <UsersIcon className="h-3 w-3 text-blue-600" />
                        <span className="text-gray-700">{project.traction_metrics.users.toLocaleString()} users</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Recent Milestones
                  </h4>
                  <div className="space-y-2">
                    {project.milestones.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                          milestone.completed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getMilestoneIcon(milestone.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            milestone.completed ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {milestone.title}
                          </p>
                          <p className="text-xs text-gray-500">{milestone.description}</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimeAgo(milestone.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-lg font-semibold text-gray-900">{project.stats.total_sessions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDuration(project.stats.total_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Session</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDuration(project.stats.avg_session)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Session</p>
                  <p className="text-sm font-medium text-gray-900">{formatTimeAgo(project.stats.last_session)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <Link to={`/project/${project.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Link to={`/project/${project.id}?tab=features`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Feature Requests
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="sm:max-w-md bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-public"
                  checked={editingProject.is_public}
                  onChange={(e) => setEditingProject({ ...editingProject, is_public: e.target.checked })}
                />
                <Label htmlFor="edit-public">Public project</Label>
              </div>
              <Button onClick={handleUpdateProject} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Update Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AuthenticatedLayout>
  );
};

export default Projects; 