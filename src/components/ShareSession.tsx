import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Share2, 
  Twitter, 
  Linkedin, 
  Globe, 
  Copy, 
  CheckCircle, 
  Sparkles,
  Flame,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface SessionData {
  id: string;
  duration: number;
  project?: {
    name: string;
    emoji: string;
  };
  mood: number;
  note?: string;
  metrics?: {
    commits?: number;
    lines_added?: number;
    lines_removed?: number;
    files_changed?: number;
    github_connected?: boolean;
  };
  streak: number;
  totalSessions: number;
  totalTime: number;
}

interface ShareSessionProps {
  sessionData: SessionData;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (platform: string, content: string) => void;
}

const ShareSession: React.FC<ShareSessionProps> = ({
  sessionData,
  isOpen,
  onClose,
  onShare
}) => {
  const [customText, setCustomText] = useState('');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeStreak, setIncludeStreak] = useState(true);
  const [includeProject, setIncludeProject] = useState(true);
  const [autoShare, setAutoShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      generateDefaultText();
    }
  }, [isOpen, sessionData]);

  const generateDefaultText = () => {
    const duration = formatDuration(sessionData.duration);
    const projectText = sessionData.project ? ` on ${sessionData.project.emoji} ${sessionData.project.name}` : '';
    const moodEmoji = getMoodEmoji(sessionData.mood);
    const streakText = sessionData.streak > 1 ? ` 🔥 ${sessionData.streak} day streak!` : '';
    
    let text = `Just finished a ${duration} build session${projectText} ${moodEmoji}${streakText}`;
    
    if (sessionData.metrics?.github_connected && sessionData.metrics.commits) {
      text += `\n\n📊 Session stats:\n• ${sessionData.metrics.commits} commits`;
      if (sessionData.metrics.lines_added) {
        text += `\n• +${sessionData.metrics.lines_added} lines`;
      }
      if (sessionData.metrics.lines_removed) {
        text += `\n• -${sessionData.metrics.lines_removed} lines`;
      }
    }
    
    if (sessionData.note) {
      text += `\n\n💭 ${sessionData.note}`;
    }
    
    text += `\n\n#BuildInPublic #Bilda`;
    
    setCustomText(text);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4) return '🚀';
    if (mood >= 3) return '😊';
    if (mood >= 2) return '😐';
    return '😔';
  };

  const generateShareText = () => {
    let text = customText;
    
    if (!includeMetrics && sessionData.metrics?.github_connected) {
      // Remove metrics section
      text = text.replace(/\n\n📊 Session stats:\n•.*?(?=\n\n|$)/s, '');
    }
    
    if (!includeStreak && sessionData.streak > 1) {
      text = text.replace(/🔥 \d+ day streak!/, '');
    }
    
    if (!includeProject && sessionData.project) {
      text = text.replace(/ on 🚀 .*? /, ' ');
    }
    
    return text;
  };

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'copy') => {
    setIsSharing(true);
    setShareStatus('idle');
    
    try {
      const shareText = generateShareText();
      const shareUrl = `https://bilda.dev/session/${sessionData.id}`;
      const fullText = `${shareText}\n\n${shareUrl}`;
      
      switch (platform) {
        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
          window.open(twitterUrl, '_blank');
          break;
          
        case 'linkedin':
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('Build Session Update')}&summary=${encodeURIComponent(shareText)}`;
          window.open(linkedinUrl, '_blank');
          break;
          
        case 'copy':
          await navigator.clipboard.writeText(fullText);
          break;
      }
      
      setShareStatus('success');
      
      if (onShare) {
        onShare(platform, shareText);
      }
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setShareStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Share error:', error);
      setShareStatus('error');
    } finally {
      setIsSharing(false);
    }
  };

  const getShareButtonVariant = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'linkedin': return 'bg-blue-700 hover:bg-blue-800 text-white';
      case 'copy': return 'bg-gray-600 hover:bg-gray-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const getShareButtonIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'copy': return <Copy className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Build Session</span>
            {sessionData.streak > 1 && (
              <Badge className="bg-orange-100 text-orange-700">
                <Flame className="h-3 w-3 mr-1" />
                {sessionData.streak} day streak!
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Session Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {sessionData.project?.emoji && (
                    <div className="text-2xl">{sessionData.project.emoji}</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {sessionData.project?.name || 'Build Session'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDuration(sessionData.duration)} • {getMoodEmoji(sessionData.mood)} Mood: {sessionData.mood}/5
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Sessions</div>
                  <div className="text-lg font-bold text-gray-900">{sessionData.totalSessions}</div>
                </div>
              </div>
              
              {sessionData.metrics?.github_connected && (
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-blue-200">
                  {sessionData.metrics.commits && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{sessionData.metrics.commits}</div>
                      <div className="text-xs text-gray-600">Commits</div>
                    </div>
                  )}
                  {sessionData.metrics.lines_added && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">+{sessionData.metrics.lines_added}</div>
                      <div className="text-xs text-gray-600">Lines Added</div>
                    </div>
                  )}
                  {sessionData.metrics.files_changed && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{sessionData.metrics.files_changed}</div>
                      <div className="text-xs text-gray-600">Files Changed</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-text" className="text-sm font-medium text-gray-700">
                Share Message
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateDefaultText}
                className="text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            </div>
            
            <Textarea
              id="custom-text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={8}
              className="resize-none"
              placeholder="Customize your share message..."
            />
            
            <div className="text-xs text-gray-500">
              {customText.length}/280 characters
              {customText.length > 280 && (
                <span className="text-red-500 ml-2">⚠️ Message too long for Twitter</span>
              )}
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Include in share:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-metrics"
                  checked={includeMetrics}
                  onCheckedChange={setIncludeMetrics}
                />
                <Label htmlFor="include-metrics" className="text-sm">GitHub metrics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-streak"
                  checked={includeStreak}
                  onCheckedChange={setIncludeStreak}
                />
                <Label htmlFor="include-streak" className="text-sm">Streak badge</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-project"
                  checked={includeProject}
                  onCheckedChange={setIncludeProject}
                />
                <Label htmlFor="include-project" className="text-sm">Project info</Label>
              </div>
            </div>
          </div>

          {/* Auto-Share Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Auto-share daily summaries</h4>
                <p className="text-xs text-gray-600">Automatically share your daily build summary to Twitter/X</p>
              </div>
            </div>
            <Switch
              checked={autoShare}
              onCheckedChange={setAutoShare}
            />
          </div>

          {/* Share Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handleShare('twitter')}
              disabled={isSharing}
              className={`flex-1 ${getShareButtonVariant('twitter')}`}
            >
              {isSharing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                getShareButtonIcon('twitter')
              )}
              <span className="ml-2">Share to X</span>
            </Button>
            
            <Button
              onClick={() => handleShare('linkedin')}
              disabled={isSharing}
              className={`flex-1 ${getShareButtonVariant('linkedin')}`}
            >
              {isSharing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                getShareButtonIcon('linkedin')
              )}
              <span className="ml-2">Share to LinkedIn</span>
            </Button>
            
            <Button
              onClick={() => handleShare('copy')}
              disabled={isSharing}
              variant="outline"
              className="flex-1"
            >
              {isSharing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                getShareButtonIcon('copy')
              )}
              <span className="ml-2">Copy Text</span>
            </Button>
          </div>

          {/* Status Messages */}
          {shareStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Successfully shared!</span>
            </div>
          )}
          
          {shareStatus === 'error' && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Failed to share. Please try again.</span>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Build in Public Tips
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Share your wins, struggles, and learnings</li>
              <li>• Include screenshots or demos when possible</li>
              <li>• Engage with other builders in the community</li>
              <li>• Be consistent with your sharing schedule</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSession; 