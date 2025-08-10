import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  Github,
  Bell,
  Shield,
  User,
  Palette,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Twitter,
  Linkedin,
  Globe
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const Settings = () => {
  const [githubConnected, setGitHubConnected] = useState(false);
  const [autoImportCommits, setAutoImportCommits] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoShareEnabled, setAutoShareEnabled] = useState(false);
  const [autoSharePlatform, setAutoSharePlatform] = useState<'twitter' | 'linkedin' | 'both'>('twitter');
  const [autoShareIncludeMetrics, setAutoShareIncludeMetrics] = useState(true);
  const [autoShareIncludeStreak, setAutoShareIncludeStreak] = useState(true);

  const handleConnectGitHub = async () => {
    // Simulate GitHub OAuth flow
    setGitHubConnected(true);
  };

  const handleDisconnectGitHub = () => {
    setGitHubConnected(false);
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and integrations</p>
        </div>

        <div className="space-y-6">
          {/* GitHub Integration */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Github className="h-5 w-5" />
                <span>GitHub Integration</span>
                {githubConnected && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Connect GitHub Account</h3>
                  <p className="text-sm text-gray-600">
                    Automatically import commits and track your coding activity
                  </p>
                </div>
                {githubConnected ? (
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnectGitHub}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    onClick={handleConnectGitHub}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </Button>
                )}
              </div>

              {githubConnected && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="auto-import" className="text-sm font-medium">
                          Auto-import commits
                        </Label>
                        <p className="text-xs text-gray-500">
                          Automatically import commits within 1 hour of session time
                        </p>
                      </div>
                      <Switch
                        id="auto-import"
                        checked={autoImportCommits}
                        onCheckedChange={setAutoImportCommits}
                      />
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">What we access:</p>
                          <ul className="text-blue-700 space-y-1">
                            <li>• Public repositories</li>
                            <li>• Commit history and stats</li>
                            <li>• Pull request activity</li>
                            <li>• Code changes and file modifications</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="public-profile" className="text-sm font-medium">
                    Public Profile
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allow others to view your profile and activity
                  </p>
                </div>
                <Switch
                  id="public-profile"
                  checked={publicProfile}
                  onCheckedChange={setPublicProfile}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications" className="text-sm font-medium">
                    Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive notifications for likes, comments, and follows
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto-Sharing */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Auto-Sharing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-share" className="text-sm font-medium">
                    Auto-share daily summaries
                  </Label>
                  <p className="text-xs text-gray-500">
                    Automatically share your daily build summary to social platforms
                  </p>
                </div>
                <Switch
                  id="auto-share"
                  checked={autoShareEnabled}
                  onCheckedChange={setAutoShareEnabled}
                />
              </div>

              {autoShareEnabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Share to:</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={autoSharePlatform === 'twitter' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAutoSharePlatform('twitter')}
                          className="flex-1"
                        >
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter/X
                        </Button>
                        <Button
                          variant={autoSharePlatform === 'linkedin' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAutoSharePlatform('linkedin')}
                          className="flex-1"
                        >
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </Button>
                        <Button
                          variant={autoSharePlatform === 'both' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAutoSharePlatform('both')}
                          className="flex-1"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Both
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="include-metrics" className="text-sm font-medium">
                            Include GitHub metrics
                          </Label>
                          <p className="text-xs text-gray-500">
                            Show commits, lines changed, and files modified
                          </p>
                        </div>
                        <Switch
                          id="include-metrics"
                          checked={autoShareIncludeMetrics}
                          onCheckedChange={setAutoShareIncludeMetrics}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="include-streak" className="text-sm font-medium">
                            Include streak badge
                          </Label>
                          <p className="text-xs text-gray-500">
                            Show your current build streak 🔥
                          </p>
                        </div>
                        <Switch
                          id="include-streak"
                          checked={autoShareIncludeStreak}
                          onCheckedChange={setAutoShareIncludeStreak}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">Auto-sharing tips</p>
                          <ul className="text-blue-800 space-y-1 text-xs">
                            <li>• Shares are posted at the end of your last session each day</li>
                            <li>• Only shares if you had at least one session that day</li>
                            <li>• You can always manually share individual sessions</li>
                            <li>• Customize what gets included in your auto-shares</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="text-sm font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-xs text-gray-500">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Export */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data & Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-600">
                    Download your sessions, projects, and activity data
                  </p>
                </div>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Features */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Advanced Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Github className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">GitHub Integration</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Auto-import commits and track coding activity
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Available
                  </Badge>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Palette className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Figma Integration</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Track design work and file changes
                  </p>
                  <Badge variant="outline" className="text-gray-500">
                    Coming Soon
                  </Badge>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Notion Integration</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sync documentation and note-taking activity
                  </p>
                  <Badge variant="outline" className="text-gray-500">
                    Coming Soon
                  </Badge>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bell className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Slack Integration</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Share progress updates with your team
                  </p>
                  <Badge variant="outline" className="text-gray-500">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Settings; 