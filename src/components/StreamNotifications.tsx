import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Heart, 
  Gift, 
  Star, 
  Users, 
  Zap, 
  Crown,
  X,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface StreamEvent {
  id: string;
  type: 'follow' | 'subscription' | 'donation' | 'raid' | 'host' | 'cheer' | 'command';
  username: string;
  message?: string;
  amount?: number;
  tier?: string;
  timestamp: Date;
  isRead: boolean;
}

interface StreamNotificationsProps {
  isStreamer: boolean;
  liveSessionId: string;
  onClose: () => void;
}

const StreamNotifications: React.FC<StreamNotificationsProps> = ({
  isStreamer,
  liveSessionId,
  onClose
}) => {
  const [notifications, setNotifications] = useState<StreamEvent[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    follows: true,
    subscriptions: true,
    donations: true,
    raids: true,
    hosts: true,
    cheers: true,
    commands: false
  });

  // Simulate incoming notifications for demo
  useEffect(() => {
    const demoNotifications: StreamEvent[] = [
      {
        id: '1',
        type: 'follow',
        username: 'alice_dev',
        timestamp: new Date(Date.now() - 5000),
        isRead: false
      },
      {
        id: '2',
        type: 'subscription',
        username: 'bob_coder',
        tier: 'Tier 2',
        message: 'Thanks for the great content!',
        timestamp: new Date(Date.now() - 15000),
        isRead: false
      },
      {
        id: '3',
        type: 'donation',
        username: 'charlie_builder',
        amount: 25,
        message: 'Keep up the amazing work!',
        timestamp: new Date(Date.now() - 30000),
        isRead: false
      }
    ];

    setNotifications(demoNotifications);
  }, []);

  const getEventIcon = (type: StreamEvent['type']) => {
    switch (type) {
      case 'follow': return <Users className="h-4 w-4 text-blue-500" />;
      case 'subscription': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'donation': return <Heart className="h-4 w-4 text-red-500" />;
      case 'raid': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'host': return <Crown className="h-4 w-4 text-green-500" />;
      case 'cheer': return <Gift className="h-4 w-4 text-pink-500" />;
      case 'command': return <Zap className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: StreamEvent['type']) => {
    switch (type) {
      case 'follow': return 'bg-blue-50 border-blue-200';
      case 'subscription': return 'bg-yellow-50 border-yellow-200';
      case 'donation': return 'bg-red-50 border-red-200';
      case 'raid': return 'bg-purple-50 border-purple-200';
      case 'host': return 'bg-green-50 border-green-200';
      case 'cheer': return 'bg-pink-50 border-pink-200';
      case 'command': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getEventText = (event: StreamEvent) => {
    switch (event.type) {
      case 'follow':
        return `${event.username} started following you!`;
      case 'subscription':
        return `${event.username} subscribed at ${event.tier}!`;
      case 'donation':
        return `${event.username} donated $${event.amount}!`;
      case 'raid':
        return `${event.username} raided with ${event.amount} viewers!`;
      case 'host':
        return `${event.username} is hosting you!`;
      case 'cheer':
        return `${event.username} cheered ${event.amount} bits!`;
      case 'command':
        return `${event.username} used a command`;
      default:
        return 'New event occurred';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Stream Notifications</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {showSettings && (
          <div className="px-6 py-3 border-b bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Notification Settings</h4>
            <div className="space-y-2">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">They'll appear here as they happen</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getEventColor(notification.type)} ${
                      !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getEventIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {getEventText(notification)}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        {notification.message && (
                          <p className="text-sm text-gray-600 mt-1">
                            "{notification.message}"
                          </p>
                        )}
                        {notification.amount && (
                          <Badge variant="secondary" className="mt-2">
                            ${notification.amount}
                          </Badge>
                        )}
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {notifications.filter(n => !n.isRead).length} unread
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamNotifications;
