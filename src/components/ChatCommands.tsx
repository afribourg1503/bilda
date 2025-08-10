import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Command, 
  Settings, 
  Zap, 
  Heart, 
  Clock, 
  Users, 
  TrendingUp,
  MessageSquare,
  Star,
  Crown,
  Gift,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatCommand {
  id: string;
  command: string;
  response: string;
  description: string;
  isEnabled: boolean;
  cooldown: number; // in seconds
  lastUsed?: Date;
  cost?: number; // channel points cost
  userLevel: 'everyone' | 'follower' | 'subscriber' | 'moderator';
}

interface ChatCommandsProps {
  isStreamer: boolean;
  liveSessionId: string;
  onCommandExecuted: (command: string, response: string) => void;
  commands?: any[];
}

const DEFAULT_COMMANDS: ChatCommand[] = [
  {
    id: '1',
    command: '!hello',
    response: 'Hello @{username}! Welcome to the stream! 👋',
    description: 'Greet viewers',
    isEnabled: true,
    cooldown: 30,
    userLevel: 'everyone'
  },
  {
    id: '2',
    command: '!project',
    response: 'We\'re currently working on {project_name}! Check it out on GitHub: {project_url}',
    description: 'Show current project info',
    isEnabled: true,
    cooldown: 60,
    userLevel: 'everyone'
  },
  {
    id: '3',
    command: '!uptime',
    response: 'Stream has been live for {uptime}! 🕐',
    description: 'Show stream duration',
    isEnabled: true,
    cooldown: 30,
    userLevel: 'everyone'
  },
  {
    id: '4',
    command: '!viewers',
    response: 'Currently {viewer_count} people are watching! 👀',
    description: 'Show current viewer count',
    isEnabled: true,
    cooldown: 15,
    userLevel: 'everyone'
  },
  {
    id: '5',
    command: '!follow',
    response: 'Thanks for following! Don\'t forget to turn on notifications! 🔔',
    description: 'Thank new followers',
    isEnabled: true,
    cooldown: 0,
    userLevel: 'everyone'
  },
  {
    id: '6',
    command: '!help',
    response: 'Available commands: !hello, !project, !uptime, !viewers, !follow, !social, !schedule',
    description: 'Show available commands',
    isEnabled: true,
    cooldown: 120,
    userLevel: 'everyone'
  },
  {
    id: '7',
    command: '!social',
    response: 'Follow me on Twitter: @{twitter}, GitHub: @{github}, Discord: {discord_invite}',
    description: 'Show social media links',
    isEnabled: true,
    cooldown: 300,
    userLevel: 'everyone'
  },
  {
    id: '8',
    command: '!schedule',
    response: 'I stream every Monday, Wednesday, and Friday at 7 PM EST! 📅',
    description: 'Show streaming schedule',
    isEnabled: true,
    cooldown: 600,
    userLevel: 'everyone'
  }
];

const ChatCommands: React.FC<ChatCommandsProps> = ({
  isStreamer,
  liveSessionId,
  onCommandExecuted,
  commands: initialCommands
}) => {
  const [commands, setCommands] = useState<ChatCommand[]>(initialCommands || DEFAULT_COMMANDS);
  const [showSettings, setShowSettings] = useState(false);
  const [newCommand, setNewCommand] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCooldown, setNewCooldown] = useState(30);
  const [newUserLevel, setNewUserLevel] = useState<'everyone' | 'follower' | 'subscriber' | 'moderator'>('everyone');
  const [botSettings, setBotSettings] = useState({
    autoGreet: true,
    autoThankFollowers: true,
    autoThankSubscribers: true,
    welcomeMessage: 'Welcome @{username} to the stream! 🎉',
    followerMessage: 'Thanks for following @{username}! 🙏',
    subscriberMessage: 'Welcome to the family @{username}! 💖'
  });

  // Update commands when prop changes
  useEffect(() => {
    if (initialCommands) {
      setCommands(initialCommands);
    }
  }, [initialCommands]);

  const userLevels = [
    { value: 'everyone', label: 'Everyone', icon: <Users className="h-4 w-4" /> },
    { value: 'follower', label: 'Followers', icon: <Heart className="h-4 w-4" /> },
    { value: 'subscriber', label: 'Subscribers', icon: <Crown className="h-4 w-4" /> },
    { value: 'moderator', label: 'Moderators', icon: <Star className="h-4 w-4" /> }
  ];

  const addCustomCommand = () => {
    if (!newCommand.trim() || !newResponse.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newCommand.startsWith('!')) {
      toast.error('Commands must start with !');
      return;
    }

    const commandExists = commands.some(cmd => cmd.command === newCommand);
    if (commandExists) {
      toast.error('Command already exists');
      return;
    }

    const newCmd: ChatCommand = {
      id: Date.now().toString(),
      command: newCommand,
      response: newResponse,
      description: newDescription || 'Custom command',
      isEnabled: true,
      cooldown: newCooldown,
      userLevel: newUserLevel
    };

    setCommands(prev => [...prev, newCmd]);
    
    // Reset form
    setNewCommand('');
    setNewResponse('');
    setNewDescription('');
    setNewCooldown(30);
    setNewUserLevel('everyone');
    
    toast.success('Custom command added!');
  };

  const toggleCommand = (commandId: string) => {
    setCommands(prev => prev.map(cmd => 
      cmd.id === commandId 
        ? { ...cmd, isEnabled: !cmd.isEnabled }
        : cmd
    ));
  };

  const deleteCommand = (commandId: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== commandId));
    toast.success('Command deleted');
  };

  const updateBotSettings = () => {
    // In a real app, this would save to the database
    toast.success('Bot settings updated');
  };

  const getCommandIcon = (command: string) => {
    if (command.includes('hello') || command.includes('follow')) return <Heart className="h-4 w-4" />;
    if (command.includes('project') || command.includes('code')) return <Target className="h-4 w-4" />;
    if (command.includes('time') || command.includes('schedule')) return <Clock className="h-4 w-4" />;
    if (command.includes('viewers') || command.includes('social')) return <Users className="h-4 w-4" />;
    if (command.includes('help')) return <Command className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  const getUserLevelIcon = (level: string) => {
    const levelConfig = userLevels.find(l => l.value === level);
    return levelConfig?.icon || <Users className="h-4 w-4" />;
  };

  const getUserLevelBadge = (level: string) => {
    switch (level) {
      case 'everyone': return <Badge variant="secondary">Everyone</Badge>;
      case 'follower': return <Badge variant="outline">Followers</Badge>;
      case 'subscriber': return <Badge variant="default">Subscribers</Badge>;
      case 'moderator': return <Badge variant="destructive">Moderators</Badge>;
      default: return <Badge variant="secondary">Everyone</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bot Status and Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8" />
              <div>
                <div className="text-sm opacity-90">Chat Bot</div>
                <div className="text-xl font-bold">Active</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {commands.filter(cmd => cmd.isEnabled).length} commands
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Command Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Command className="h-5 w-5" />
            <span>Quick Commands</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {commands.slice(0, 6).map((command) => (
              <div
                key={command.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${
                  command.isEnabled 
                    ? 'bg-white hover:shadow-md' 
                    : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getCommandIcon(command.command)}
                  <div>
                    <div className="font-medium text-sm">{command.command}</div>
                    <div className="text-xs text-gray-600">{command.description}</div>
                  </div>
                </div>
                
                {isStreamer && (
                  <Switch
                    checked={command.isEnabled}
                    onCheckedChange={() => toggleCommand(command.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Commands */}
      {isStreamer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add Custom Command</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Command</label>
                <Input
                  placeholder="!command"
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">User Level</label>
                <select
                  value={newUserLevel}
                  onChange={(e) => setNewUserLevel(e.target.value as any)}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-sm"
                >
                  {userLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Response</label>
              <Input
                placeholder="Response message (use @{username} for mentions)"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  placeholder="What this command does"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Cooldown (seconds)</label>
                <Input
                  type="number"
                  value={newCooldown}
                  onChange={(e) => setNewCooldown(parseInt(e.target.value))}
                  className="mt-1"
                  min="0"
                  max="3600"
                />
              </div>
            </div>
            
            <Button
              onClick={addCustomCommand}
              disabled={!newCommand.trim() || !newResponse.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Command
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Commands List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>All Commands</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commands.map((command) => (
              <div
                key={command.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${
                  command.isEnabled 
                    ? 'bg-white hover:shadow-md' 
                    : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getCommandIcon(command.command)}
                  <div>
                    <div className="font-medium">{command.command}</div>
                    <div className="text-sm text-gray-600">{command.description}</div>
                    <div className="text-xs text-gray-500">
                      Cooldown: {command.cooldown}s • {getUserLevelBadge(command.userLevel)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isStreamer && (
                    <>
                      <Switch
                        checked={command.isEnabled}
                        onCheckedChange={() => toggleCommand(command.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommand(command.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bot Settings */}
      {showSettings && isStreamer && (
        <Card>
          <CardHeader>
            <CardTitle>Bot Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <Switch
                  checked={botSettings.autoGreet}
                  onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoGreet: checked }))}
                />
                <span className="text-sm font-medium">Auto-greet new viewers</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <Switch
                  checked={botSettings.autoThankFollowers}
                  onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoThankFollowers: checked }))}
                />
                <span className="text-sm font-medium">Auto-thank new followers</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <Switch
                  checked={botSettings.autoThankSubscribers}
                  onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoThankSubscribers: checked }))}
                />
                <span className="text-sm font-medium">Auto-thank new subscribers</span>
              </label>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Welcome Message</label>
                <Input
                  value={botSettings.welcomeMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="Welcome @{username} to the stream!"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Follower Message</label>
                <Input
                  value={botSettings.followerMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, followerMessage: e.target.value }))}
                  placeholder="Thanks for following @{username}!"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Subscriber Message</label>
                <Input
                  value={botSettings.subscriberMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, subscriberMessage: e.target.value }))}
                  placeholder="Welcome to the family @{username}!"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={updateBotSettings}
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChatCommands;
