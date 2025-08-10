import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Github, 
  GitCommit, 
  GitBranch, 
  GitPullRequest, 
  GitMerge, 
  Plus, 
  CheckCircle, 
  Clock,
  Code,
  FileText,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { githubService, GitHubRepo, GitHubCommit } from '@/lib/github';

interface GitHubIntegrationProps {
  sessionStartTime?: Date;
  sessionEndTime?: Date;
  onCommitsImported?: (commits: GitHubCommit[]) => void;
}

const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({
  sessionStartTime,
  sessionEndTime,
  onCommitsImported
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if GitHub is already connected
    const checkConnection = async () => {
      if (githubService.isAuthenticated()) {
        setIsConnected(true);
        await loadRepos();
      }
    };
    
    checkConnection();
  }, []);

  const loadRepos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userRepos = await githubService.getUserRepos();
      setRepos(userRepos);
    } catch (err) {
      setError('Failed to load repositories');
      console.error('Error loading repos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGitHub = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      githubService.initiateOAuth();
    } catch (err) {
      setError('Failed to initiate GitHub connection');
      console.error('GitHub OAuth error:', err);
      setIsLoading(false);
    }
  };

  const handleDisconnectGitHub = () => {
    githubService.disconnect();
    setIsConnected(false);
    setRepos([]);
    setSelectedRepos([]);
    setCommits([]);
  };

  const fetchCommits = async () => {
    if (!sessionStartTime || !sessionEndTime || selectedRepos.length === 0) {
      setError('Please select repositories and ensure session times are set');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const allCommits: GitHubCommit[] = [];
      
      // Fetch commits for each selected repository
      for (const repoFullName of selectedRepos) {
        const repoCommits = await githubService.getCommitsInTimeRange(
          repoFullName,
          sessionStartTime,
          sessionEndTime
        );
        allCommits.push(...repoCommits);
      }
      
      // Sort commits by date (newest first)
      allCommits.sort((a, b) => new Date(b.author.date).getTime() - new Date(a.author.date).getTime());
      
      setCommits(allCommits);
      
      if (onCommitsImported) {
        onCommitsImported(allCommits);
      }
    } catch (err) {
      setError('Failed to fetch commits');
      console.error('Error fetching commits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRepoSelection = (repoFullName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoFullName) 
        ? prev.filter(r => r !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  const getTotalStats = () => {
    const totalLines = commits.reduce((sum, commit) => sum + commit.stats.total, 0);
    const totalAdditions = commits.reduce((sum, commit) => sum + commit.stats.additions, 0);
    const totalDeletions = commits.reduce((sum, commit) => sum + commit.stats.deletions, 0);
    const totalFiles = commits.reduce((sum, commit) => sum + commit.files.length, 0);
    
    return { totalLines, totalAdditions, totalDeletions, totalFiles };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  const truncateMessage = (message: string) => {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-900 mb-1">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Connection Status */}
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Github className="h-5 w-5 text-gray-700" />
              <div>
                <h3 className="font-semibold text-gray-900">GitHub Integration</h3>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            
            {!isConnected ? (
              <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowConnectDialog(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Connect GitHub Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Connect your GitHub account to automatically import commits and track your coding activity.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">What we'll access:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Public repositories</li>
                        <li>• Commit history</li>
                        <li>• Pull request activity</li>
                        <li>• Code changes and stats</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={handleConnectGitHub}
                      disabled={isLoading}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Github className="h-4 w-4 mr-2" />
                          Connect GitHub
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRepoSelector(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Repos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchCommits}
                  disabled={isLoading || selectedRepos.length === 0}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Import
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnectGitHub}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Repository Selector */}
      {isConnected && (
        <Dialog open={showRepoSelector} onOpenChange={setShowRepoSelector}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Repositories</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose which repositories to monitor for commits during your sessions.
              </p>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-600">Loading repositories...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {repos.map((repo) => (
                    <div 
                      key={repo.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRepos.includes(repo.full_name)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleRepoSelection(repo.full_name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedRepos.includes(repo.full_name)}
                              onChange={() => toggleRepoSelection(repo.full_name)}
                              className="rounded border-gray-300"
                            />
                            <Github className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{repo.name}</h4>
                            <p className="text-sm text-gray-600">{repo.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {repo.language}
                          </Badge>
                          {repo.private && (
                            <Badge variant="outline" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-gray-600">
                  {selectedRepos.length} repositories selected
                </span>
                <Button onClick={() => setShowRepoSelector(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Commits Summary */}
      {commits.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitCommit className="h-5 w-5" />
              <span>Session Commits</span>
              <Badge variant="secondary" className="ml-auto">
                {commits.length} commits
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {getTotalStats().totalLines}
                </div>
                <div className="text-sm text-blue-700">Lines Changed</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {getTotalStats().totalAdditions}
                </div>
                <div className="text-sm text-green-700">Lines Added</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {getTotalStats().totalDeletions}
                </div>
                <div className="text-sm text-red-700">Lines Removed</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {getTotalStats().totalFiles}
                </div>
                <div className="text-sm text-purple-700">Files Changed</div>
              </div>
            </div>

            {/* Commit List */}
            <div className="space-y-3">
              {commits.map((commit, index) => (
                <div key={commit.sha} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <GitCommit className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 truncate">
                        {truncateMessage(commit.message)}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(commit.author.date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {commit.author.name} • {commit.sha.substring(0, 7)}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-xs">
                        <Code className="h-3 w-3 text-green-600" />
                        <span className="text-green-700">+{commit.stats.additions}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        <Code className="h-3 w-3 text-red-600" />
                        <span className="text-red-700">-{commit.stats.deletions}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        <FileText className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-700">{commit.files.length} files</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GitHubIntegration; 