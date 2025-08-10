import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  MessageCircle, 
  Heart, 
  Share2, 
  Settings,
  BarChart3,
  Zap,
  Crown,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getStreamAnalytics } from '@/lib/liveFeatures';

interface StreamStats {
  totalViews: number;
  peakViewers: number;
  totalChats: number;
  followers: number;
  tips: number;
  avgWatchTime: number;
  chatEngagement: number;
  streamDuration: number;
}

interface StreamerDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  currentViewers: number;
  streamStartTime: Date | null;
  onStreamSettings: () => void;
  liveSessionId?: string;
}

const StreamerDashboard: React.FC<StreamerDashboardProps> = ({
  isVisible,
  onClose,
  currentViewers,
  streamStartTime,
  onStreamSettings
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StreamStats>({
    totalViews: 0,
    peakViewers: 0,
    totalChats: 0,
    followers: 0,
    tips: 0,
    avgWatchTime: 0,
    chatEngagement: 0,
    streamDuration: 0
  });
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  useEffect(() => {
    if (isVisible && streamStartTime) {
      // Update peak viewers when current viewers change
      setStats(prev => ({
        ...prev,
        peakViewers: Math.max(prev.peakViewers, currentViewers)
      }));
    }
  }, [currentViewers, isVisible, streamStartTime]);

  useEffect(() => {
    if (isVisible && streamStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - streamStartTime.getTime()) / 1000);
        setStats(prev => ({
          ...prev,
          streamDuration: duration
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, streamStartTime]);

  // Load stream analytics when dashboard becomes visible
  useEffect(() => {
    if (isVisible && liveSessionId) {
      const loadAnalytics = async () => {
        try {
          const { data: analytics } = await getStreamAnalytics(liveSessionId);
          if (analytics) {
            setStats(prev => ({
              ...prev,
              peakViewers: analytics.peak_viewers || prev.peakViewers,
              totalChats: analytics.total_chat_messages || prev.totalChats,
              // Add more analytics as they become available
            }));
          }
        } catch (error) {
          console.error('Error loading stream analytics:', error);
        }
      };

      loadAnalytics();
    }
  }, [isVisible, liveSessionId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-600';
    if (engagement >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-gray-900">Stream Dashboard</h2>
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Real-time Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-gray-600">Current Viewers</span>
                </div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  {currentViewers}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Peak Viewers</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {stats.peakViewers}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Chats</span>
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {stats.totalChats}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Stream Time</span>
                </div>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  {formatDuration(stats.streamDuration)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Engagement Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chat Engagement Rate</span>
                <span className={`font-semibold ${getEngagementColor(stats.chatEngagement)}`}>
                  {stats.chatEngagement}%
                </span>
              </div>
              <Progress value={stats.chatEngagement} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Watch Time</span>
                <span className="font-semibold text-gray-900">
                  {Math.floor(stats.avgWatchTime / 60)}m {stats.avgWatchTime % 60}s
                </span>
              </div>
              <Progress value={(stats.avgWatchTime / 300) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-2"
              onClick={onStreamSettings}
            >
              <Settings className="h-5 w-5" />
              <span>Stream Settings</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Share2 className="h-5 w-5" />
              <span>Share Stream</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Crown className="h-5 w-5" />
              <span>Channel Points</span>
            </Button>
          </div>

          {/* Advanced Metrics Toggle */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
              className="text-gray-600 hover:text-gray-900"
            >
              {showAdvancedMetrics ? 'Hide' : 'Show'} Advanced Metrics
              <BarChart3 className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Advanced Metrics */}
          {showAdvancedMetrics && (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audience Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">1-minute retention</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">5-minute retention</span>
                      <span className="font-semibold">72%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">15-minute retention</span>
                      <span className="font-semibold">58%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Messages per minute</span>
                      <span className="font-semibold">12.5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unique chatters</span>
                      <span className="font-semibold">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Chat quality score</span>
                      <span className="font-semibold text-green-600">8.7/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamerDashboard; 