import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Shield, 
  Flag, 
  Crown, 
  Star,
  Heart,
  Zap,
  Gift,
  Users,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  message: string;
  created_at: string;
  user_role: 'viewer' | 'moderator' | 'streamer' | 'vip';
  badges: string[];
  isHighlighted?: boolean;
}

interface EnhancedLiveChatProps {
  liveSessionId: string;
  streamerId: string;
  isStreamer: boolean;
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isConnected: boolean;
}

const EMOTES = {
  ':)': '😊', ':(': '😢', ':D': '😃', ';)': '😉', ':P': '😛',
  '<3': '❤️', ':heart:': '❤️', ':fire:': '🔥', ':zap:': '⚡',
  ':crown:': '👑', ':star:': '⭐', ':gift:': '🎁', ':rocket:': '🚀'
};

const BADGE_ICONS = {
  'moderator': <Shield className="h-3 w-3 text-blue-600" />,
  'streamer': <Crown className="h-3 w-3 text-yellow-600" />,
  'vip': <Star className="h-3 w-3 text-purple-600" />,
  'subscriber': <Heart className="h-3 w-3 text-red-600" />
};

const EnhancedLiveChat: React.FC<EnhancedLiveChatProps> = ({
  liveSessionId,
  streamerId,
  isStreamer,
  onSendMessage,
  messages,
  isConnected
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    slowMode: false,
    slowModeInterval: 3,
    followersOnly: false,
    subscribersOnly: false,
    chatEnabled: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [chatMode, setChatMode] = useState<'all' | 'highlights' | 'moderated'>('all');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages based on chat mode
  useEffect(() => {
    let filtered = messages;
    
    if (chatMode === 'highlights') {
      filtered = messages.filter(msg => msg.isHighlighted || msg.user_role !== 'viewer');
    } else if (chatMode === 'moderated') {
      filtered = messages.filter(msg => msg.user_role === 'moderator' || msg.user_role === 'streamer');
    }
    
    setFilteredMessages(filtered);
  }, [messages, chatMode]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatSettings.chatEnabled) return;
    
    // Check slow mode
    if (chatSettings.slowMode) {
      // This would need to be implemented with a cooldown system
      toast.info('Slow mode is enabled. Please wait before sending another message.');
      return;
    }
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const replaceEmotes = (text: string) => {
    let result = text;
    Object.entries(EMOTES).forEach(([emote, emoji]) => {
      result = result.replace(new RegExp(emote, 'g'), emoji);
    });
    return result;
  };

  const addEmote = (emote: string) => {
    setNewMessage(prev => prev + emote);
    setShowEmotes(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getMessageClass = (message: ChatMessage) => {
    let baseClass = 'p-2 rounded-lg transition-all duration-200';
    
    if (message.isHighlighted) {
      baseClass += ' bg-yellow-50 border-l-4 border-yellow-400';
    } else if (message.user_role === 'streamer') {
      baseClass += ' bg-red-50 border-l-4 border-red-400';
    } else if (message.user_role === 'moderator') {
      baseClass += ' bg-blue-50 border-l-4 border-blue-400';
    } else if (message.user_role === 'vip') {
      baseClass += ' bg-purple-50 border-l-4 border-purple-400';
    }
    
    return baseClass;
  };

  const handleModerateMessage = (messageId: string, action: 'delete' | 'timeout' | 'ban') => {
    if (!isStreamer) return;
    
    // This would integrate with your moderation system
    toast.success(`Message ${action}ed successfully`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            <span>Live Chat</span>
            {isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Chat Mode Selector */}
            <select
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 bg-white"
            >
              <option value="all">All</option>
              <option value="highlights">Highlights</option>
              <option value="moderated">Moderated</option>
            </select>
            
            {/* Settings Button */}
            {isStreamer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Chat Stats */}
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <span className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{messages.length} messages</span>
          </span>
          <span className="flex items-center space-x-1">
            <MessageCircle className="h-3 w-3" />
            <span>{new Set(messages.map(m => m.user_id)).size} chatters</span>
          </span>
        </div>
      </CardHeader>

      {/* Chat Settings Panel */}
      {showSettings && isStreamer && (
        <div className="px-4 py-3 bg-gray-50 border-b space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chatSettings.slowMode}
                onChange={(e) => setChatSettings(prev => ({ ...prev, slowMode: e.target.checked }))}
                className="rounded"
              />
              <span>Slow Mode</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chatSettings.followersOnly}
                onChange={(e) => setChatSettings(prev => ({ ...prev, followersOnly: e.target.checked }))}
                className="rounded"
              />
              <span>Followers Only</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chatSettings.chatEnabled}
                onChange={(e) => setChatSettings(prev => ({ ...prev, chatEnabled: e.target.checked }))}
                className="rounded"
              />
              <span>Chat Enabled</span>
            </label>
          </div>
          
          {chatSettings.slowMode && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">Slow mode interval:</span>
              <select
                value={chatSettings.slowModeInterval}
                onChange={(e) => setChatSettings(prev => ({ ...prev, slowModeInterval: parseInt(e.target.value) }))}
                className="text-xs border rounded px-2 py-1"
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={15}>15s</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="h-full overflow-y-auto px-4 space-y-2 pb-4"
        >
          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to chat!</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div key={message.id} className={getMessageClass(message)}>
                <div className="flex items-start space-x-2">
                  {/* User Avatar */}
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={message.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {message.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {/* Username */}
                      <span className="font-semibold text-sm text-gray-900">
                        {message.username}
                      </span>
                      
                      {/* Badges */}
                      {message.badges.map((badge, index) => (
                        <span key={index} className="flex-shrink-0">
                          {BADGE_ICONS[badge as keyof typeof BADGE_ICONS]}
                        </span>
                      ))}
                      
                      {/* Timestamp */}
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatTimestamp(message.created_at)}
                      </span>
                    </div>
                    
                    {/* Message Text */}
                    <p className="text-sm text-gray-700 break-words">
                      {replaceEmotes(message.message)}
                    </p>
                  </div>
                  
                  {/* Moderation Actions */}
                  {isStreamer && (
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleModerateMessage(message.id, 'delete')}
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                      >
                        ✕
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleModerateMessage(message.id, 'timeout')}
                        className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-100"
                      >
                        ⏰
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </CardContent>

      {/* Chat Input */}
      <div className="p-4 border-t bg-gray-50">
        {!chatSettings.chatEnabled ? (
          <div className="text-center text-gray-500 py-2">
            <VolumeX className="h-5 w-5 mx-auto mb-1" />
            <p className="text-sm">Chat is currently disabled</p>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {/* Emote Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmotes(!showEmotes)}
              className="h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            {/* Message Input */}
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!chatSettings.chatEnabled}
            />
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !chatSettings.chatEnabled}
              size="sm"
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Emote Picker */}
        {showEmotes && (
          <div className="mt-3 p-3 bg-white border rounded-lg">
            <div className="grid grid-cols-8 gap-2">
              {Object.entries(EMOTES).map(([emote, emoji]) => (
                <button
                  key={emote}
                  onClick={() => addEmote(emote)}
                  className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                  title={emote}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedLiveChat; 