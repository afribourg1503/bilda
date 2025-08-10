import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Video, 
  Volume2, 
  Monitor, 
  Globe, 
  Shield, 
  Users,
  Bell,
  Share2,
  Target,
  Palette,
  Clock,
  Zap,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface StreamSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  onSaveSettings: (settings: StreamConfig) => void;
  currentSettings?: StreamConfig;
}

interface StreamConfig {
  // Basic Settings
  title: string;
  description: string;
  category: string;
  tags: string[];
  language: string;
  matureContent: boolean;
  
  // Video Settings
  resolution: '720p' | '1080p' | '1440p' | '4K';
  frameRate: 30 | 60;
  bitrate: number;
  keyframeInterval: number;
  
  // Audio Settings
  audioBitrate: number;
  audioChannels: 1 | 2;
  audioSampleRate: 44100 | 48000;
  
  // Chat Settings
  chatEnabled: boolean;
  slowMode: boolean;
  slowModeInterval: number;
  followersOnly: boolean;
  followersOnlyDuration: number;
  subscribersOnly: boolean;
  subscribersOnlyDuration: number;
  emoteOnly: boolean;
  emoteOnlyDuration: number;
  
  // Moderation
  autoModLevel: 'low' | 'medium' | 'high';
  blockLinks: boolean;
  blockCaps: boolean;
  maxMessageLength: number;
  
  // Notifications
  notifyFollowers: boolean;
  notifySubscribers: boolean;
  socialMediaShare: boolean;
  
  // Advanced
  recordingEnabled: boolean;
  vodEnabled: boolean;
  clipEnabled: boolean;
  streamKey: string;
}

const DEFAULT_SETTINGS: StreamConfig = {
  title: 'Live Building Session',
  description: 'Join me as I build something amazing live!',
  category: 'Programming',
  tags: ['coding', 'building', 'live', 'programming'],
  language: 'en',
  matureContent: false,
  
  resolution: '1080p',
  frameRate: 60,
  bitrate: 6000,
  keyframeInterval: 2,
  
  audioBitrate: 128,
  audioChannels: 2,
  audioSampleRate: 48000,
  
  chatEnabled: true,
  slowMode: false,
  slowModeInterval: 3,
  followersOnly: false,
  followersOnlyDuration: 0,
  subscribersOnly: false,
  subscribersOnlyDuration: 0,
  emoteOnly: false,
  emoteOnlyDuration: 0,
  
  autoModLevel: 'medium',
  blockLinks: true,
  blockCaps: false,
  maxMessageLength: 200,
  
  notifyFollowers: true,
  notifySubscribers: true,
  socialMediaShare: true,
  
  recordingEnabled: true,
  vodEnabled: true,
  clipEnabled: true,
  streamKey: 'live_' + Math.random().toString(36).substr(2, 9)
};

const StreamSettings: React.FC<StreamSettingsProps> = ({
  isVisible,
  onClose,
  onSaveSettings,
  currentSettings
}) => {
  const [settings, setSettings] = useState<StreamConfig>(currentSettings || DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'basic' | 'video' | 'audio' | 'chat' | 'moderation' | 'notifications' | 'advanced'>('basic');
  const [newTag, setNewTag] = useState('');

  const tabs = [
    { id: 'basic', label: 'Basic', icon: <Settings className="h-4 w-4" /> },
    { id: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
            { id: 'audio', label: 'Audio', icon: <Volume2 className="h-4 w-4" /> },
    { id: 'chat', label: 'Chat', icon: <Users className="h-4 w-4" /> },
    { id: 'moderation', label: 'Moderation', icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Monitor className="h-4 w-4" /> }
  ];

  const resolutions = [
    { value: '720p', label: '720p (HD)', bitrate: 3000 },
    { value: '1080p', label: '1080p (Full HD)', bitrate: 6000 },
    { value: '1440p', label: '1440p (2K)', bitrate: 12000 },
    { value: '4K', label: '4K (Ultra HD)', bitrate: 25000 }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' }
  ];

  const categories = [
    'Programming', 'Gaming', 'Art', 'Music', 'Education', 'Just Chatting', 'IRL', 'Creative'
  ];

  const addTag = () => {
    if (!newTag.trim() || settings.tags.includes(newTag.trim())) {
      toast.error('Tag already exists or is empty');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const updateResolution = (resolution: string) => {
    const resConfig = resolutions.find(r => r.value === resolution);
    if (resConfig) {
      setSettings(prev => ({
        ...prev,
        resolution: resolution as any,
        bitrate: resConfig.bitrate
      }));
    }
  };

  const handleSave = () => {
    onSaveSettings(settings);
    toast.success('Stream settings saved successfully!');
    onClose();
  };

  const generateNewStreamKey = () => {
    const newKey = 'live_' + Math.random().toString(36).substr(2, 9);
    setSettings(prev => ({ ...prev, streamKey: newKey }));
    toast.success('New stream key generated!');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Stream Settings</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Basic Settings */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Stream Title</label>
                  <Input
                    value={settings.title}
                    onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter your stream title"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you'll be doing on stream"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={settings.category}
                      onChange={(e) => setSettings(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} size="sm">Add</Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {settings.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-red-100" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center space-x-3">
                  <Switch
                    checked={settings.matureContent}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, matureContent: checked }))}
                  />
                  <span className="text-sm font-medium">Mature Content (18+)</span>
                </label>
              </div>
            )}

            {/* Video Settings */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Resolution</label>
                    <select
                      value={settings.resolution}
                      onChange={(e) => updateResolution(e.target.value)}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      {resolutions.map(res => (
                        <option key={res.value} value={res.value}>{res.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Frame Rate</label>
                    <select
                      value={settings.frameRate}
                      onChange={(e) => setSettings(prev => ({ ...prev, frameRate: parseInt(e.target.value) as any }))}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      <option value={30}>30 FPS</option>
                      <option value={60}>60 FPS</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bitrate (kbps)</label>
                    <Input
                      type="number"
                      value={settings.bitrate}
                      onChange={(e) => setSettings(prev => ({ ...prev, bitrate: parseInt(e.target.value) }))}
                      className="mt-1"
                      min="1000"
                      max="50000"
                      step="1000"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Keyframe Interval (seconds)</label>
                    <Input
                      type="number"
                      value={settings.keyframeInterval}
                      onChange={(e) => setSettings(prev => ({ ...prev, keyframeInterval: parseInt(e.target.value) }))}
                      className="mt-1"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Recommended Settings</h4>
                  <p className="text-sm text-blue-700">
                    For {settings.resolution} at {settings.frameRate}fps, we recommend a bitrate of {settings.bitrate}kbps.
                    Higher bitrates provide better quality but require more bandwidth.
                  </p>
                </div>
              </div>
            )}

            {/* Audio Settings */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Audio Bitrate (kbps)</label>
                    <select
                      value={settings.audioBitrate}
                      onChange={(e) => setSettings(prev => ({ ...prev, audioBitrate: parseInt(e.target.value) }))}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      <option value={64}>64 kbps</option>
                      <option value={96}>96 kbps</option>
                      <option value={128}>128 kbps</option>
                      <option value={160}>160 kbps</option>
                      <option value={192}>192 kbps</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Audio Channels</label>
                    <select
                      value={settings.audioChannels}
                      onChange={(e) => setSettings(prev => ({ ...prev, audioChannels: parseInt(e.target.value) as any }))}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      <option value={1}>Mono (1 channel)</option>
                      <option value={2}>Stereo (2 channels)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Sample Rate (Hz)</label>
                  <select
                    value={settings.audioSampleRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, audioSampleRate: parseInt(e.target.value) as any }))}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  >
                    <option value={44100}>44.1 kHz (CD Quality)</option>
                    <option value={48000}>48 kHz (Professional)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Chat Settings */}
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <Switch
                    checked={settings.chatEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, chatEnabled: checked }))}
                  />
                  <span className="text-sm font-medium">Enable Chat</span>
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.slowMode}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, slowMode: checked }))}
                    />
                    <span className="text-sm font-medium">Slow Mode</span>
                  </label>
                  
                  {settings.slowMode && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Interval (seconds)</label>
                      <Input
                        type="number"
                        value={settings.slowModeInterval}
                        onChange={(e) => setSettings(prev => ({ ...prev, slowModeInterval: parseInt(e.target.value) }))}
                        className="mt-1"
                        min="1"
                        max="60"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.followersOnly}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, followersOnly: checked }))}
                    />
                    <span className="text-sm font-medium">Followers Only</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.subscribersOnly}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, subscribersOnly: checked }))}
                    />
                    <span className="text-sm font-medium">Subscribers Only</span>
                  </label>
                </div>
                
                <label className="flex items-center space-x-3">
                  <Switch
                    checked={settings.emoteOnly}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emoteOnly: checked }))}
                  />
                  <span className="text-sm font-medium">Emote Only Mode</span>
                </label>
              </div>
            )}

            {/* Moderation Settings */}
            {activeTab === 'moderation' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-Mod Level</label>
                  <select
                    value={settings.autoModLevel}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoModLevel: e.target.value as any }))}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  >
                    <option value="low">Low - Only obvious violations</option>
                    <option value="medium">Medium - Common violations</option>
                    <option value="high">High - Strict filtering</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.blockLinks}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, blockLinks: checked }))}
                    />
                    <span className="text-sm font-medium">Block Links</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.blockCaps}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, blockCaps: checked }))}
                    />
                    <span className="text-sm font-medium">Block Excessive Caps</span>
                  </label>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Message Length</label>
                  <Input
                    type="number"
                    value={settings.maxMessageLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxMessageLength: parseInt(e.target.value) }))}
                    className="mt-1"
                    min="50"
                    max="500"
                  />
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.notifyFollowers}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifyFollowers: checked }))}
                    />
                    <span className="text-sm font-medium">Notify Followers</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.notifySubscribers}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifySubscribers: checked }))}
                    />
                    <span className="text-sm font-medium">Notify Subscribers</span>
                  </label>
                </div>
                
                <label className="flex items-center space-x-3">
                  <Switch
                    checked={settings.socialMediaShare}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, socialMediaShare: checked }))}
                  />
                  <span className="text-sm font-medium">Share to Social Media</span>
                </label>
              </div>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.recordingEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, recordingEnabled: checked }))}
                    />
                    <span className="text-sm font-medium">Enable Recording</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <Switch
                      checked={settings.vodEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, vodEnabled: checked }))}
                    />
                    <span className="text-sm font-medium">Save VOD</span>
                  </label>
                </div>
                
                <label className="flex items-center space-x-3">
                  <Switch
                    checked={settings.clipEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, clipEnabled: checked }))}
                  />
                  <span className="text-sm font-medium">Enable Clips</span>
                </label>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Stream Key</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      value={settings.streamKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={generateNewStreamKey} variant="outline" size="sm">
                      Generate New
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Keep this key private. Anyone with this key can stream to your channel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamSettings;
