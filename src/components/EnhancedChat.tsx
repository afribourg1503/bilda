import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Heart, 
  ThumbsUp, 
  ThumbsDown,
  Zap,
  Crown,
  Shield,
  Bot,
  MoreHorizontal,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  message: string;
  created_at: string;
  user_role: 'viewer' | 'moderator' | 'subscriber' | 'streamer' | 'bot';
  badges: string[];
  isHighlighted: boolean;
  reactions?: {
    [key: string]: number;
  };
}

interface EnhancedChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onReaction: (messageId: string, reaction: string) => void;
  onModerate: (messageId: string, action: string) => void;
  isStreamer: boolean;
  isModerator: boolean;
}

const EMOTES = {
  ':)': '😊', ':(': '😢', ':D': '😃', ';)': '😉', ':P': '😛',
  '<3': '❤️', ':heart:': '❤️', ':fire:': '🔥', ':zap:': '⚡',
  ':crown:': '👑', ':star:': '⭐', ':rocket:': '🚀', ':100:': '💯'
};

const REACTIONS = ['❤️', '👍', '👎', '🔥', '😂', '😮', '😢', '🎉'];

const EnhancedChat: React.FC<EnhancedChatProps> = ({
  messages,
  onSendMessage,
  onReaction,
  onModerate,
  isStreamer,
  isModerator
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [chatFilter, setChatFilter] = useState<'all' | 'highlights' | 'commands'>('all');

  useEffect(() => {
    // Filter messages based on current filter
    let filtered = messages;
    if (chatFilter === 'highlights') {
      filtered = messages.filter(m => m.isHighlighted);
    } else if (chatFilter === 'commands') {
      filtered = messages.filter(m => m.message.startsWith('!'));
    }
    setFilteredMessages(filtered);
  }, [messages, chatFilter]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const replaceEmotes = (text: string) => {
    let result = text;
    Object.entries(EMOTES).forEach(([code, emote]) => {
      result = result.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emote);
    });
    return result;
  };

  const getRoleIcon = (role: string, badges: string[]) => {
    if (badges.includes('streamer')) return <Crown className="h-3 w-3 text-yellow-500" />;
    if (badges.includes('moderator')) return <Shield className="h-3 w-3 text-green-500" />;
    if (badges.includes('subscriber')) return <Star className="h-3 w-3 text-purple-500" />;
    if (badges.includes('bot')) return <Bot className="h-3 w-3 text-blue-500" />;
    return null;
  };

  const getRoleColor = (role: string, badges: string[]) => {
    if (badges.includes('streamer')) return 'text-yellow-600';
    if (badges.includes('moderator')) return 'text-green-600';
    if (badges.includes('subscriber')) return 'text-purple-600';
    if (badges.includes('bot')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const formatMessage = (message: string) => {
    // Replace emotes
    let formatted = replaceEmotes(message);
    
    // Highlight mentions
    formatted = formatted.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
    
    // Highlight commands
    formatted = formatted.replace(/(!\w+)/g, '<span class="text-purple-500 font-mono">$1</span>');
    
    // Highlight links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-500 underline">$1</a>');
    
    return formatted;
  };

  const handleReaction = (messageId: string, reaction: string) => {
    onReaction(messageId, reaction);
    setShowReactions(null);
  };

  const getModerationActions = (message: ChatMessage) => {
    if (!isStreamer && !isModerator) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModerate(message.id, 'timeout')}
          className="h-6 px-2 text-xs"
        >
          Timeout
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModerate(message.id, 'delete')}
          className="h-6 px-2 text-xs text-red-600"
        >
          Delete
        </Button>
        {isStreamer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModerate(message.id, 'ban')}
            className="h-6 px-2 text-xs text-red-600"
          >
            Ban
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Live Chat</span>
          </CardTitle>
          
          {/* Chat Filters */}
          <div className="flex space-x-1">
            <Button
              variant={chatFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChatFilter('all')}
              className="h-7 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant={chatFilter === 'highlights' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChatFilter('highlights')}
              className="h-7 px-2 text-xs"
            >
              Highlights
            </Button>
            <Button
              variant={chatFilter === 'commands' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChatFilter('commands')}
              className="h-7 px-2 text-xs"
            >
              Commands
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`group flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50 ${
                  message.isHighlighted ? 'bg-yellow-50 border border-yellow-200' : ''
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.avatar_url} />
                  <AvatarFallback>
                    {message.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${getRoleColor(message.user_role, message.badges)}`}>
                      {message.username}
                    </span>
                    {getRoleIcon(message.user_role, message.badges)}
                    {message.badges.map((badge, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div 
                    className="text-sm text-gray-700 break-words"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.message) }}
                  />
                  
                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      {Object.entries(message.reactions).map(([reaction, count]) => (
                        <Badge key={reaction} variant="outline" className="text-xs">
                          {reaction} {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                    className="h-6 px-2"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                  
                  {getModerationActions(message)}
                </div>
                
                {/* Reactions Popup */}
                {showReactions === message.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-4 gap-1">
                      {REACTIONS.map((reaction) => (
                        <Button
                          key={reaction}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(message.id, reaction)}
                          className="h-8 w-8 p-0 text-lg"
                        >
                          {reaction}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmotes(!showEmotes)}
              className="h-9 px-2"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              
              {/* Emotes Popup */}
              {showEmotes && (
                <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 z-10">
                  <div className="grid grid-cols-8 gap-1">
                    {Object.entries(EMOTES).map(([code, emote]) => (
                      <Button
                        key={code}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewMessage(prev => prev + code);
                          setShowEmotes(false);
                        }}
                        className="h-8 w-8 p-0 text-lg"
                        title={code}
                      >
                        {emote}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="h-9 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedChat;
