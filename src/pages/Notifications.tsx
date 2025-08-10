import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  UserMinus,
  Trophy,
  Star,
  Activity,
  Clock,
  Check,
  X
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { listNotifications, markNotificationsRead, subscribeToNotifications } from '@/lib/database';

interface Notification {
  id: string;
  type: 'follow' | 'kudos' | 'comment' | 'achievement' | 'mention';
  user: {
    id: string;
    handle: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
  isRead: boolean;
  metadata?: {
    sessionId?: string;
    projectName?: string;
    achievementName?: string;
  };
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await listNotifications(user.id, 50);
        if (!error && data) {
          // Map DB to UI; for MVP, show raw content and a generic avatar
          const mapped = (data as any[]).map(n => ({
            id: n.id,
            type: (n.type || 'mention') as Notification['type'],
            user: {
              id: n.actor_id || 'system',
              handle: n.actor_id ? 'user' : 'system',
              avatar_url: 'https://github.com/github.png',
            },
            content: n.entity_type ? `${n.type} on ${n.entity_type}` : n.type,
            created_at: n.created_at,
            isRead: Boolean(n.read),
            metadata: n.data || {},
          })) as Notification[];
          setNotifications(mapped);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    const ch = user ? subscribeToNotifications(user.id, () => run()) : null;
    return () => { try { ch?.unsubscribe(); } catch {} };
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    if (user) await markNotificationsRead(user.id);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'kudos':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'mention':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow':
        return 'bg-blue-50 border-blue-200';
      case 'kudos':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-green-50 border-green-200';
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200';
      case 'mention':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Notifications</h2>
            <p className="text-gray-600">Stay updated with your social interactions</p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-pulse-500 text-white">
                {unreadCount} new
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600">When you start building and connecting with others, you'll see notifications here.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl transition-all ${
                  !notification.isRead ? 'ring-2 ring-pulse-500/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.user.handle === 'system' ? (
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.user.avatar_url} />
                          <AvatarFallback>
                            {notification.user.handle.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {notification.user.handle !== 'system' && (
                              <Link 
                                to={`/profile/${notification.user.handle}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                @{notification.user.handle}
                              </Link>
                            )}
                            <span className="text-gray-600">{notification.content}</span>
                            {notification.metadata?.projectName && (
                              <Badge variant="outline" className="text-xs">
                                {notification.metadata.projectName}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {getNotificationIcon(notification.type)}
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-pulse-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Empty State */}
        {notifications.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default Notifications; 