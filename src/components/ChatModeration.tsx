import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Ban, 
  Clock, 
  AlertTriangle, 
  Users, 
  Settings,
  Filter,
  MessageSquare,
  Eye,
  EyeOff,
  Zap,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface ModeratedUser {
  id: string;
  username: string;
  avatar_url?: string;
  reason: string;
  moderator: string;
  expires_at?: string;
  isPermanent: boolean;
  type: 'timeout' | 'ban' | 'warning';
}

interface ChatModerationProps {
  isStreamer: boolean;
  liveSessionId: string;
  onModerateUser: (userId: string, action: 'timeout' | 'ban' | 'warning', duration?: number, reason?: string) => void;
  onUpdateChatSettings: (settings: ChatSettings) => void;
  currentSettings: ChatSettings;
}

interface ChatSettings {
  slowMode: boolean;
  slowModeInterval: number;
  followersOnly: boolean;
  followersOnlyDuration: number;
  subscribersOnly: boolean;
  subscribersOnlyDuration: number;
  emoteOnly: boolean;
  emoteOnlyDuration: number;
  chatEnabled: boolean;
  autoModLevel: 'low' | 'medium' | 'high';
  blockLinks: boolean;
  blockCaps: boolean;
  maxMessageLength: number;
}

const ChatModeration: React.FC<ChatModerationProps> = ({
  isStreamer,
  liveSessionId,
  onModerateUser,
  onUpdateChatSettings,
  currentSettings
}) => {
  const [showModeration, setShowModeration] = useState(false);
  const [moderatedUsers, setModeratedUsers] = useState<ModeratedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [moderationAction, setModerationAction] = useState<'timeout' | 'ban' | 'warning'>('timeout');
  const [moderationDuration, setModerationDuration] = useState(300); // 5 minutes default
  const [moderationReason, setModerationReason] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(currentSettings);

  const timeoutDurations = [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' }
  ];

  const autoModLevels = [
    { value: 'low', label: 'Low', description: 'Only obvious violations' },
    { value: 'medium', label: 'Medium', description: 'Common violations' },
    { value: 'high', label: 'High', description: 'Strict filtering' }
  ];

  const handleModerateUser = () => {
    if (!selectedUser || !moderationReason.trim()) {
      toast.error('Please select a user and provide a reason');
      return;
    }

    const duration = moderationAction === 'ban' ? undefined : moderationDuration;
    
    onModerateUser(selectedUser, moderationAction, duration, moderationReason);
    
    // Add to moderated users list
    const newModeratedUser: ModeratedUser = {
      id: selectedUser,
      username: selectedUser, // In real app, get actual username
      reason: moderationReason,
      moderator: 'You', // In real app, get actual moderator name
      expires_at: duration ? new Date(Date.now() + duration * 1000).toISOString() : undefined,
      isPermanent: moderationAction === 'ban',
      type: moderationAction
    };

    setModeratedUsers(prev => [...prev, newModeratedUser]);
    
    // Reset form
    setSelectedUser('');
    setModerationReason('');
    setModerationAction('timeout');
    
    toast.success(`User ${moderationAction}ed successfully`);
  };

  const handleUpdateSettings = () => {
    onUpdateChatSettings(settings);
    setShowSettings(false);
    toast.success('Chat settings updated');
  };

  const removeModeratedUser = (userId: string) => {
    setModeratedUsers(prev => prev.filter(user => user.id !== userId));
    toast.success('User removed from moderation list');
  };

  const getModerationIcon = (type: string) => {
    switch (type) {
      case 'ban': return <Ban className="h-4 w-4 text-red-600" />;
      case 'timeout': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getModerationBadge = (type: string) => {
    switch (type) {
      case 'ban': return <Badge variant="destructive">Banned</Badge>;
      case 'timeout': return <Badge variant="secondary">Timeout</Badge>;
      case 'warning': return <Badge variant="outline">Warning</Badge>;
      default: return null;
    }
  };

  if (!isStreamer) return null;

  return (
    <div className="space-y-4">
      {/* Quick Moderation Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Chat Moderation</span>
            <Badge variant="outline" className="ml-auto">
              {moderatedUsers.length} moderated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Toggle Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={settings.slowMode ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, slowMode: !prev.slowMode }))}
              className="h-10"
            >
              <Clock className="h-4 w-4 mr-2" />
              Slow Mode {settings.slowMode && `(${settings.slowModeInterval}s)`}
            </Button>
            
            <Button
              variant={settings.emoteOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, emoteOnly: !prev.emoteOnly }))}
              className="h-10"
            >
              {settings.emoteOnly ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Emote Only
            </Button>
            
            <Button
              variant={settings.followersOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, followersOnly: !prev.followersOnly }))}
              className="h-10"
            >
              <Users className="h-4 w-4 mr-2" />
              Followers Only
            </Button>
            
            <Button
              variant={settings.subscribersOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, subscribersOnly: !prev.subscribersOnly }))}
              className="h-10"
            >
              <Crown className="h-4 w-4 mr-2" />
              Subscribers Only
            </Button>
          </div>

          {/* Moderation Actions */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-3 mb-3">
              <Input
                placeholder="Username to moderate"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1"
              />
              
              <select
                value={moderationAction}
                onChange={(e) => setModerationAction(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="warning">Warning</option>
                <option value="timeout">Timeout</option>
                <option value="ban">Ban</option>
              </select>
              
              {moderationAction === 'timeout' && (
                <select
                  value={moderationDuration}
                  onChange={(e) => setModerationDuration(parseInt(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  {timeoutDurations.map(duration => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Textarea
                placeholder="Reason for moderation"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                className="flex-1"
                rows={2}
              />
              
              <Button
                onClick={handleModerateUser}
                disabled={!selectedUser || !moderationReason.trim()}
                variant="destructive"
                size="sm"
                className="h-20 px-4"
              >
                {moderationAction === 'ban' ? 'Ban User' : 
                 moderationAction === 'timeout' ? 'Timeout User' : 'Warn User'}
              </Button>
            </div>
          </div>

          {/* Advanced Settings Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Chat Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Chat Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Chat Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-Mod Level</label>
                <select
                  value={settings.autoModLevel}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoModLevel: e.target.value as any }))}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-sm"
                >
                  {autoModLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Max Message Length</label>
                <Input
                  type="number"
                  value={settings.maxMessageLength}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxMessageLength: parseInt(e.target.value) }))}
                  className="mt-1"
                  min={50}
                  max={500}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.blockLinks}
                  onChange={(e) => setSettings(prev => ({ ...prev, blockLinks: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Block Links</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.blockCaps}
                  onChange={(e) => setSettings(prev => ({ ...prev, blockCaps: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Block Excessive Caps</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSettings}
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderated Users List */}
      {moderatedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Moderated Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moderatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getModerationIcon(user.type)}
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-600">{user.reason}</div>
                      {user.expires_at && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(user.expires_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getModerationBadge(user.type)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModeratedUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
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

export default ChatModeration;
