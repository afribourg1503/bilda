import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Square, Timer, Smile, Meh, Frown, Plus, Sparkles, Target, Github, GitCommit, Share2, Radio, Minimize2 } from 'lucide-react';
import GitHubIntegration from './GitHubIntegration';
import ShareSession from './ShareSession';
import { useAuth } from '@/contexts/AuthContext';
import { createSession, createProject as createProjectDb, startLiveSession, stopLiveSession, getProjects as getProjectsDb, saveSessionMetrics, getLiveSessionByUser } from '@/lib/database';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SessionTimerProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  selectedProject: string | null;
  onProjectChange?: (projectId: string | null) => void;
}

interface SessionData {
  note: string;
  mood: number;
  screenshot?: string;
  loomLink?: string;
  githubCommits?: any[];
}

interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ 
  isActive, 
  onStart, 
  onStop, 
  selectedProject,
  onProjectChange
}) => {
  const { user } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData>({
    note: '',
    mood: 3,
  });
  const [isLive, setIsLive] = useState(false);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [forceCheck, setForceCheck] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    emoji: '🚀',
    color: 'bg-purple-500'
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  const [showStreamerDashboard, setShowStreamerDashboard] = useState(false);
  const [streamStats, setStreamStats] = useState({
    totalViews: 0,
    peakViewers: 0,
    totalChats: 0,
    followers: 0,
    tips: 0
  });

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      const { data } = await getProjectsDb(user.id);
      if (data) {
        const mapped = (data as any[]).map((p) => ({ id: p.id, name: p.name, emoji: p.emoji ?? '🚀', color: p.color ?? 'bg-purple-500' })) as Project[];
        setProjects(mapped);
      }
    };
    run();
  }, [user]);

  // Check for existing live session on mount
  useEffect(() => {
    const checkExistingLiveSession = async () => {
      if (!user || (hasRestoredSession && !forceCheck)) {
        console.log('⏭️ Skipping live session check:', { hasUser: !!user, hasRestoredSession, forceCheck });
        return;
      }
      
      console.log('🔍 Checking for existing live session for user:', user.id);
      
      try {
        const { data: liveSession, error } = await getLiveSessionByUser(user.id);
        
        if (error) {
          console.error('❌ Error fetching live session:', error);
          setHasRestoredSession(true);
          return;
        }
        
        if (liveSession) {
          console.log('✅ Found existing live session:', liveSession);
          
          // Calculate elapsed time from when the session started
          const startTime = new Date(liveSession.started_at);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const elapsedMinutes = Math.floor(elapsedSeconds / 60);
          
          console.log(`⏱️ Session was started ${elapsedMinutes}m ago (${elapsedSeconds}s)`);
          
          // Only restore if the session is recent (less than 12 hours)
          if (elapsedSeconds < 12 * 60 * 60) {
            console.log('🔄 Restoring live session state...');
            
            setIsLive(true);
            setElapsed(elapsedSeconds);
            setSessionStartTime(startTime);
            setHasRestoredSession(true);
            
            // Set the project if it matches one in our list
            if (onProjectChange && liveSession.project_id) {
              console.log('📁 Setting project:', liveSession.project_id);
              onProjectChange(liveSession.project_id);
            }
            
            // Start the session after a brief delay to ensure component is ready
            console.log('▶️ Starting session timer, current isActive:', isActive);
            setTimeout(() => {
              console.log('▶️ Calling onStart()...');
              onStart();
            }, 100);
            
            toast({ 
              title: 'Live session restored', 
              description: `You were live for ${elapsedMinutes}m before the page reload` 
            });
          } else {
            // Clean up old session
            console.log('🗑️ Cleaning up old live session (older than 12h)');
            await stopLiveSession(user.id);
            setHasRestoredSession(true);
          }
        } else {
          console.log('ℹ️ No existing live session found');
          setHasRestoredSession(true);
        }
      } catch (e) {
        console.error('❌ Error checking existing live session:', e);
        setHasRestoredSession(true);
      }
    };
    
    checkExistingLiveSession();
  }, [user, onProjectChange, hasRestoredSession, forceCheck, onStart]);
  
  // Add a global function to force check for live session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceCheckLiveSession = () => {
        console.log('🔄 Force checking for live session...');
        setHasRestoredSession(false);
        setForceCheck(true);
        setTimeout(() => setForceCheck(false), 1000);
      };
    }
  }, []);

  const emojiOptions = ['🚀', '🎨', '⚡', '💻', '🔧', '📱', '🌐', '🎯', '⚙️', '🎪'];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
        // Broadcast elapsed to viewers if live
        try {
          if (isLive && user) {
            supabase.channel(`live_elapsed_${user.id}`).send({ type: 'broadcast', event: 'elapsed', payload: { elapsed: elapsed + 1 } });
          }
        } catch {}
      }, 1000);
    } else if (!hasRestoredSession && !isActive) {
      // Only reset elapsed if we're not in the middle of a restoration and session is not active
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, isLive, user, elapsed, hasRestoredSession]);

  // Enhanced live session management
  useEffect(() => {
    if (isActive && !isPaused && user) {
      // Start live session if not already live
      if (!isLive) {
        startLiveSession();
      }
      
      // Set up real-time viewer count updates
      const channel = supabase.channel(`live_viewers_${user.id}`)
        .on('broadcast', { event: 'viewer_count' }, (payload) => {
          setViewersCount(payload.payload.count);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isActive, isPaused, isLive, user]);

  const startLiveSession = async () => {
    if (!user || !selectedProject) return;

    try {
      const { error } = await startLiveSession({
        user_id: user.id,
        project_id: selectedProject,
        started_at: new Date().toISOString(),
        viewers_count: 0
      });

      if (error) throw error;

      setIsLive(true);
      toast.success('🎥 Going live! Your session is now visible to the community.');
      
      // Initialize stream stats
      setStreamStats(prev => ({
        ...prev,
        peakViewers: 0,
        totalChats: 0
      }));
    } catch (error) {
      console.error('Error starting live session:', error);
      toast.error('Failed to start live session');
    }
  };

  const handleStart = () => {
    const isUuid = (v: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
    if (!selectedProject || !isUuid(selectedProject)) {
      toast({ title: 'Select a project first', variant: 'destructive' as any });
      return;
    }
    // Reset session state when starting a new session
    setSessionData({ note: '', mood: 3, githubCommits: [] });
    setElapsed(0);
    setSessionStartTime(new Date());
    setHasRestoredSession(false);
    setIsPaused(false);
    setPausedElapsed(0);
    onStart();
  };

  const handleStop = () => {
    setShowEndDialog(true);
  };

  const handleCancelEndSession = () => {
    setShowEndDialog(false);
    // Don't reset anything - just close the dialog and continue the session
  };

  const handlePause = () => {
    setIsPaused(true);
    setPausedElapsed(elapsed);
  };

  const handleResume = () => {
    setIsPaused(false);
    setPausedElapsed(0);
  };

  const handleEndSession = async () => {
    if (!user) {
      toast({ title: 'You must be logged in', variant: 'destructive' as any });
      return;
    }
    const isUuid = (v: string) => /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/.test(v);
    if (!selectedProject || !isUuid(selectedProject)) {
      toast({ title: 'Select a project first', variant: 'destructive' as any });
      return;
    }
    try {
      const { data: created, error } = await createSession({
        user_id: user.id,
        project_id: selectedProject,
        duration: elapsed,
        note: sessionData.note || undefined,
        mood: sessionData.mood,
      });
      if (error) {
        toast({ title: 'Failed to save session', description: error.message, variant: 'destructive' as any });
      } else {
        toast({ title: 'Session saved', description: `Duration: ${Math.floor(elapsed/60)}m` });
        // Persist GitHub metrics if present
        try {
          if (created?.id && sessionData.githubCommits && sessionData.githubCommits.length > 0) {
            const totalLines = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (c.stats?.total || 0), 0);
            const totalAdditions = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (c.stats?.additions || 0), 0);
            const totalDeletions = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (c.stats?.deletions || 0), 0);
            const filesChanged = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (Array.isArray(c.files) ? c.files.length : 0), 0);
            await saveSessionMetrics(created.id as string, {
              commits: sessionData.githubCommits.length,
              additions: totalAdditions,
              deletions: totalDeletions,
              filesChanged,
            });
          }
        } catch {}
      }
    } catch (e: any) {
      toast({ title: 'Failed to save session', description: e?.message ?? 'Unknown error', variant: 'destructive' as any });
    } finally {
      if (isLive) {
        try { await stopLiveSession(user.id); } catch {}
        setIsLive(false);
      }
      setShowEndDialog(false);
      // Reset all session state to properly end the session
      setSessionData({ note: '', mood: 3, githubCommits: [] });
      setSessionStartTime(null);
      setElapsed(0);
      setHasRestoredSession(false);
      setIsPaused(false);
      setPausedElapsed(0);
      onStop();
    }
  };

  const handleCreateProject = async () => {
    if (!user) {
      toast({ title: 'You must be logged in', variant: 'destructive' as any });
      return;
    }
    if (!newProject.name.trim()) {
      toast({ title: 'Please enter a project name', variant: 'destructive' as any });
      return;
    }
    try {
      const { data, error } = await createProjectDb({
        name: newProject.name,
        emoji: newProject.emoji,
        color: newProject.color,
        is_public: true,
        user_id: user.id,
      });
      if (error) {
        toast({ title: 'Failed to create project', description: error.message, variant: 'destructive' as any });
        return;
      }
      if (data) {
        toast({ title: 'Project created', description: data.name });
        if (onProjectChange) onProjectChange(data.id as string);
      }
    } finally {
      setShowCreateProjectDialog(false);
      setNewProject({ name: '', emoji: '🚀', color: 'bg-purple-500' });
    }
  };

  const handleToggleLive = async () => {
    if (!user || !selectedProject) {
      toast({ title: 'Select a project first', variant: 'destructive' as any });
      return;
    }
    const isUuid = (v: string) => /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/.test(v);
    if (!isUuid(selectedProject)) {
      toast({ title: 'Invalid project selection', description: 'Please pick a project from your list (UUID id).', variant: 'destructive' as any });
      return;
    }
    try {
      if (!isLive) {
        // Check if there's already a live session and clean it up first
        const { data: existingSession } = await getLiveSessionByUser(user.id);
        if (existingSession) {
          console.log('Cleaning up existing live session before starting new one');
          await stopLiveSession(user.id);
        }
        
        const { error } = await startLiveSession({
          user_id: user.id,
          project_id: selectedProject,
          started_at: new Date().toISOString(),
          note: sessionData.note || undefined,
          mood: sessionData.mood,
        });
        if (error) throw error;
        setIsLive(true);
        setSessionStartTime(new Date());
        toast({ title: 'You are live' });
      } else {
        const { error } = await stopLiveSession(user.id);
        if (error) throw error;
        setIsLive(false);
        toast({ title: 'Live ended' });
      }
    } catch (e: any) {
      toast({ title: 'Live error', description: e?.message ?? 'Unknown error', variant: 'destructive' as any });
    }
  };

  const handleCommitsImported = (commits: any[]) => {
    setSessionData(prev => ({
      ...prev,
      githubCommits: commits
    }));
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return <Smile className="h-4 w-4 text-green-500" />;
    if (mood >= 3) return <Meh className="h-4 w-4 text-yellow-500" />;
    return <Frown className="h-4 w-4 text-red-500" />;
  };

  const getCommitStats = () => {
    if (!sessionData.githubCommits || sessionData.githubCommits.length === 0) return null;
    
    const totalLines = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (c.stats?.total || 0), 0);
    const totalAdditions = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (c.stats?.additions || 0), 0);
    const totalDeletions = sessionData.githubCommits.reduce((sum: number, c: any) => sum + (c.stats?.deletions || 0), 0);
    
    return {
      commits: sessionData.githubCommits.length,
      linesChanged: totalLines,
      additions: totalAdditions,
      deletions: totalDeletions,
    };
  };

  const getTotalSessionTime = () => {
    if (!sessionStartTime) return elapsed;
    const now = new Date();
    const totalMs = now.getTime() - sessionStartTime.getTime();
    return Math.floor(totalMs / 1000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeWithAnimation = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const timeClass = isPaused ? 'text-yellow-600' : 'text-primary';
    const pulseClass = isActive && !isPaused ? 'animate-pulse' : '';
    
    if (hours > 0) {
      return (
        <span className={`flex items-center justify-center space-x-1 ${timeClass}`}>
          <span>{hours}</span>
          <span className={`${pulseClass} text-primary`}>:</span>
          <span>{minutes.toString().padStart(2, '0')}</span>
          <span className={`${pulseClass} text-primary`}>:</span>
          <span>{secs.toString().padStart(2, '0')}</span>
        </span>
      );
    }
    return (
      <span className={`flex items-center justify-center space-x-1 ${timeClass}`}>
        <span>{minutes}</span>
        <span className={`${pulseClass} text-primary`}>:</span>
        <span>{secs.toString().padStart(2, '0')}</span>
      </span>
    );
  };

  const handleShareStream = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user?.name || 'Builder'} is live!`,
        text: `Watch me build ${selectedProject || 'my project'} live!`,
        url: `${window.location.origin}/live/${user?.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/live/${user?.id}`);
      toast.success('Stream link copied to clipboard!');
    }
  };

  const handleStreamSettings = () => {
    setShowStreamerDashboard(!showStreamerDashboard);
  };

  // Empty state when no project is selected
  if (!selectedProject) {
    return (
      <div className="space-y-4">
        {/* Timer Display with Empty State */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-gray-300 mb-3">
            {formatTimeWithAnimation(0)}
          </div>
          
          {/* Empty State Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-xl p-4 max-w-md mx-auto">
            <div className="text-center space-y-3">
              <div className="relative">
                <Target className="h-8 w-8 text-blue-400 mx-auto mb-1" />
                <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Choose a Project</h3>
              <p className="text-xs text-gray-600 mb-2">
                Select a project to start tracking your build session
              </p>
              
              {/* Mini Project Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-1">
                  {projects.map((project) => (
                    <Badge 
                      key={project.id}
                      variant="outline" 
                      className="cursor-pointer hover:bg-blue-50 transition-colors bg-white border-gray-200 text-gray-700 text-xs px-2 py-1"
                      onClick={() => {
                        if (onProjectChange) {
                          onProjectChange(project.id);
                        }
                      }}
                    >
                      {project.emoji} {project.name}
                    </Badge>
                  ))}
                </div>
                
                {/* Create New Project Dialog */}
                <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-2 py-1">
                      <Plus className="h-3 w-3 mr-1" />
                      Create New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border-gray-200">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Create New Project</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                          id="project-name"
                          placeholder="Enter project name..."
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white border-gray-200 text-gray-900"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Project Emoji</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {emojiOptions.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`p-2 rounded-lg text-lg hover:bg-gray-100 transition-colors ${
                                newProject.emoji === emoji ? 'bg-blue-100 border-2 border-blue-300' : ''
                              }`}
                              onClick={() => setNewProject(prev => ({ ...prev, emoji }))}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateProjectDialog(false)}
                          className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateProject}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Create Project
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Hint Bubble */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
          <div className="flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-blue-900 mb-1">Pro Tip</p>
              <p className="text-blue-700">
                Track your progress on different projects to see your building patterns and improve your workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
      {/* Streamer Dashboard Toggle */}
      {isLive && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-purple-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Radio className="h-5 w-5 text-red-600 animate-pulse" />
                <span className="font-semibold text-red-700">LIVE STREAMING</span>
              </div>
              <Badge variant="destructive" className="animate-pulse bg-red-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                {isPaused ? 'LIVE (PAUSED)' : 'LIVE'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStreamSettings}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {showStreamerDashboard ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {showStreamerDashboard ? 'Hide' : 'Show'} Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareStream}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share Stream
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Streamer Dashboard */}
      {isLive && showStreamerDashboard && (
        <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Stream Analytics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{viewersCount}</div>
              <div className="text-xs text-gray-600">Current Viewers</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{streamStats.peakViewers}</div>
              <div className="text-xs text-gray-600">Peak Viewers</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{streamStats.totalChats}</div>
              <div className="text-xs text-gray-600">Total Chats</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{streamStats.followers}</div>
              <div className="text-xs text-gray-600">New Followers</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{streamStats.tips}</div>
              <div className="text-xs text-gray-600">Tips Received</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Stream Duration: {formatTime(getTotalSessionTime())}</span>
            <span>Project: {selectedProject || 'None'}</span>
          </div>
        </div>
      )}

      {/* Main Timer Display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-mono font-bold text-primary mb-2">
          {formatTimeWithAnimation(elapsed)}
        </div>

        {isPaused && (
          <div className="mb-2">
            <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
              <Timer className="h-3 w-3 mr-1" />
              PAUSED
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-center space-x-2">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              {isPaused ? 'LIVE (PAUSED)' : 'LIVE'}
            </Badge>
          )}
          {selectedProject && (
            <Badge variant="outline" className="border-blue-300 text-blue-600">
              <Target className="h-3 w-3 mr-1" />
              {selectedProject}
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isActive ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        ) : (
          <>
            <Button
              onClick={isPaused ? handleResume : handlePause}
              size="lg"
              variant={isPaused ? "default" : "outline"}
              className={`${isPaused ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-300 text-blue-600 hover:bg-blue-50'} shadow-lg`}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Timer className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              onClick={handleStop}
              size="lg"
              variant="destructive"
              className="shadow-lg"
            >
              <Square className="w-4 h-4 mr-2" />
              End Session
            </Button>
          </>
        )}
      </div>

      {/* Session Data Input */}
      {isActive && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Note
            </label>
            <Textarea
              value={sessionData.note}
              onChange={(e) => setSessionData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="What are you working on today?"
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling? (1-5)
            </label>
            <Slider
              value={[sessionData.mood]}
              onValueChange={(value) => setSessionData(prev => ({ ...prev, mood: value[0] }))}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>😞</span>
              <span>😐</span>
              <span>😊</span>
            </div>
          </div>
        </div>
      )}

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this session? This will save your progress and stop the timer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-primary mb-2">
                {formatTime(elapsed)}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Active time
              </p>

              {isPaused && (
                <div className="mb-4">
                  <div className="text-lg font-mono font-semibold text-yellow-600">
                    {formatTime(getTotalSessionTime())}
                  </div>
                  <p className="text-xs text-yellow-600">
                    Total session time (including pauses)
                  </p>
                </div>
              )}

              {sessionData.note && (
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 mb-1">Session Note:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{sessionData.note}</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleCancelEndSession}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionTimer; 