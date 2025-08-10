import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Heart, 
  Zap, 
  Clock,
  Target,
  Activity,
  Download,
  Share2,
  Eye,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface StreamMetrics {
  peakViewers: number;
  currentViewers: number;
  totalViews: number;
  totalChatMessages: number;
  totalCommands: number;
  totalReactions: number;
  totalFollows: number;
  totalSubscriptions: number;
  totalDonations: number;
  avgWatchTime: number;
  chatEngagement: number;
  streamDuration: number;
  viewerRetention: number;
}

interface StreamAnalyticsProps {
  isVisible: boolean;
  onClose: () => void;
  liveSessionId: string;
  currentViewers: number;
  streamStartTime: Date | null;
}

const StreamAnalytics: React.FC<StreamAnalyticsProps> = ({
  isVisible,
  onClose,
  liveSessionId,
  currentViewers,
  streamStartTime
}) => {
  const [metrics, setMetrics] = useState<StreamMetrics>({
    peakViewers: 0,
    currentViewers: 0,
    totalViews: 0,
    totalChatMessages: 0,
    totalCommands: 0,
    totalReactions: 0,
    totalFollows: 0,
    totalSubscriptions: 0,
    totalDonations: 0,
    avgWatchTime: 0,
    chatEngagement: 0,
    streamDuration: 0,
    viewerRetention: 0
  });
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (isVisible && streamStartTime) {
      // Update peak viewers when current viewers change
      setMetrics(prev => ({
        ...prev,
        peakViewers: Math.max(prev.peakViewers, currentViewers),
        currentViewers: currentViewers
      }));
    }
  }, [currentViewers, isVisible, streamStartTime]);

  useEffect(() => {
    if (isVisible && streamStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - streamStartTime.getTime()) / 1000);
        
        setMetrics(prev => ({
          ...prev,
          streamDuration: duration
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, streamStartTime]);

  // Simulate metrics updates for demo
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          totalChatMessages: prev.totalChatMessages + Math.floor(Math.random() * 3),
          totalCommands: prev.totalCommands + Math.floor(Math.random() * 2),
          totalReactions: prev.totalReactions + Math.floor(Math.random() * 5),
          totalFollows: prev.totalFollows + Math.floor(Math.random() * 1),
          avgWatchTime: Math.min(prev.avgWatchTime + Math.random() * 0.1, 45),
          chatEngagement: Math.min(prev.chatEngagement + Math.random() * 0.5, 95),
          viewerRetention: Math.min(prev.viewerRetention + Math.random() * 0.3, 85)
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-600';
    if (engagement >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      sessionId: liveSessionId,
      metrics: metrics,
      timeRange: timeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-analytics-${liveSessionId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported successfully!');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <BarChart3 className="h-6 w-6" />
                <span>Stream Analytics</span>
              </h2>
              <p className="text-gray-600 mt-1">
                Real-time insights and performance metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <div className="flex space-x-1">
                {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
              
              <Button onClick={exportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button onClick={onClose} variant="ghost">
                ✕
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Viewers</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.currentViewers)}</div>
                <p className="text-xs text-muted-foreground">
                  Peak: {formatNumber(metrics.peakViewers)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.totalChatMessages)}</div>
                <p className="text-xs text-muted-foreground">
                  Engagement: {metrics.chatEngagement.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commands Used</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.totalCommands)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalReactions} reactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stream Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(metrics.streamDuration)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg watch: {metrics.avgWatchTime.toFixed(1)} min
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Engagement Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Chat Engagement</span>
                    <span className={`text-sm font-bold ${getEngagementColor(metrics.chatEngagement)}`}>
                      {metrics.chatEngagement.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.chatEngagement} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Viewer Retention</span>
                    <span className="text-sm font-bold text-blue-600">
                      {metrics.viewerRetention.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.viewerRetention} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Watch Time</span>
                    <span className="text-sm font-bold text-green-600">
                      {metrics.avgWatchTime.toFixed(1)} min
                    </span>
                  </div>
                  <Progress value={(metrics.avgWatchTime / 60) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Growth Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(metrics.totalFollows)}
                    </div>
                    <div className="text-sm text-gray-600">New Follows</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(metrics.totalSubscriptions)}
                    </div>
                    <div className="text-sm text-gray-600">Subscriptions</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      ${formatNumber(metrics.totalDonations)}
                    </div>
                    <div className="text-sm text-gray-600">Donations</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(metrics.totalViews)}
                    </div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Real-time Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Viewer count updated</p>
                      <p className="text-sm text-gray-600">
                        Currently {metrics.currentViewers} viewers
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Chat activity</p>
                      <p className="text-sm text-gray-600">
                        {metrics.totalChatMessages} total messages
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Command executed</p>
                      <p className="text-sm text-gray-600">
                        {metrics.totalCommands} commands used
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StreamAnalytics;
