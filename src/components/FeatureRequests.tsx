import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Plus, 
  Filter,
  SortAsc,
  Calendar,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'bugfix' | 'improvement' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'declined';
  votes: number;
  userVoted: boolean;
  userRating?: number;
  createdBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  comments: number;
  tags: string[];
}

interface FeatureRequestsProps {
  projectId: string;
  projectName: string;
}

const FeatureRequests: React.FC<FeatureRequestsProps> = ({ projectId, projectName }) => {
  const [requests, setRequests] = useState<FeatureRequest[]>([
    {
      id: '1',
      title: 'Dark Mode Support',
      description: 'Add a dark mode theme option for better user experience in low-light environments.',
      category: 'feature',
      priority: 'medium',
      status: 'pending',
      votes: 24,
      userVoted: false,
      createdBy: {
        id: '1',
        name: 'Sarah Dev',
        avatar: 'https://github.com/github.png'
      },
      createdAt: '2024-01-15T10:30:00Z',
      comments: 8,
      tags: ['ui', 'theme', 'accessibility']
    },
    {
      id: '2',
      title: 'Export Data to CSV',
      description: 'Allow users to export their session data and statistics to CSV format for external analysis.',
      category: 'feature',
      priority: 'high',
      status: 'in-progress',
      votes: 42,
      userVoted: true,
      userRating: 5,
      createdBy: {
        id: '2',
        name: 'Alex Builder',
        avatar: 'https://github.com/github.png'
      },
      createdAt: '2024-01-14T15:20:00Z',
      comments: 12,
      tags: ['export', 'data', 'analytics']
    },
    {
      id: '3',
      title: 'Fix Session Timer Lag',
      description: 'The session timer sometimes lags and doesn\'t update in real-time, especially on slower devices.',
      category: 'bugfix',
      priority: 'high',
      status: 'completed',
      votes: 18,
      userVoted: false,
      createdBy: {
        id: '3',
        name: 'Mike Coder',
        avatar: 'https://github.com/github.png'
      },
      createdAt: '2024-01-13T09:15:00Z',
      comments: 5,
      tags: ['performance', 'timer', 'bug']
    },
    {
      id: '4',
      title: 'Slack Integration',
      description: 'Integrate with Slack to automatically post session summaries and achievements to team channels.',
      category: 'integration',
      priority: 'medium',
      status: 'pending',
      votes: 31,
      userVoted: false,
      createdBy: {
        id: '4',
        name: 'Emma Designer',
        avatar: 'https://github.com/github.png'
      },
      createdAt: '2024-01-12T14:45:00Z',
      comments: 6,
      tags: ['slack', 'integration', 'team']
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'date' | 'priority'>('votes');
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'feature' as const,
    priority: 'medium' as const,
    tags: ''
  });

  const handleVote = (requestId: string) => {
    setRequests(requests.map(request => {
      if (request.id === requestId) {
        return {
          ...request,
          votes: request.userVoted ? request.votes - 1 : request.votes + 1,
          userVoted: !request.userVoted
        };
      }
      return request;
    }));
  };

  const handleRate = (requestId: string, rating: number) => {
    setRequests(requests.map(request => {
      if (request.id === requestId) {
        return {
          ...request,
          userRating: rating
        };
      }
      return request;
    }));
  };

  const handleCreateRequest = () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      return;
    }

    const request: FeatureRequest = {
      id: Date.now().toString(),
      title: newRequest.title,
      description: newRequest.description,
      category: newRequest.category,
      priority: newRequest.priority,
      status: 'pending',
      votes: 1,
      userVoted: true,
      createdBy: {
        id: 'current-user',
        name: 'You',
        avatar: 'https://github.com/github.png'
      },
      createdAt: new Date().toISOString(),
      comments: 0,
      tags: newRequest.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    setRequests([request, ...requests]);
    setNewRequest({
      title: '',
      description: '',
      category: 'feature',
      priority: 'medium',
      tags: ''
    });
    setShowCreateDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <Plus className="h-4 w-4" />;
      case 'bugfix': return <AlertCircle className="h-4 w-4" />;
      case 'improvement': return <TrendingUp className="h-4 w-4" />;
      case 'integration': return <MessageSquare className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
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

  const filteredAndSortedRequests = requests
    .filter(request => filterCategory === 'all' || request.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return b.votes - a.votes;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feature Requests</h2>
          <p className="text-gray-600">Help shape the future of {projectName}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-pulse-500 hover:bg-pulse-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Request Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request a New Feature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Feature Title</Label>
                <Input
                  id="title"
                  placeholder="Brief, descriptive title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the feature in detail. What problem does it solve? How should it work?"
                  rows={4}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newRequest.category}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value as any }))}
                  >
                    <option value="feature">Feature</option>
                    <option value="bugfix">Bug Fix</option>
                    <option value="improvement">Improvement</option>
                    <option value="integration">Integration</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="ui, performance, mobile"
                  value={newRequest.tags}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRequest}
                  className="flex-1 bg-pulse-500 hover:bg-pulse-600 text-white"
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            className="p-2 border border-gray-300 rounded-md"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="feature">Features</option>
            <option value="bugfix">Bug Fixes</option>
            <option value="improvement">Improvements</option>
            <option value="integration">Integrations</option>
          </select>
          
          <select
            className="p-2 border border-gray-300 rounded-md"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="votes">Sort by Votes</option>
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredAndSortedRequests.length} requests
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredAndSortedRequests.map((request) => (
          <Card key={request.id} className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(request.category)}
                      <span className="capitalize">{request.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{request.createdBy.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTimeAgo(request.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(request.priority)}>
                    {request.priority}
                  </Badge>
                </div>
              </div>

              {/* Tags */}
              {request.tags.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  {request.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(request.id)}
                    className={`flex items-center space-x-1 ${
                      request.userVoted ? 'text-pulse-600' : 'text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{request.votes}</span>
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{request.comments}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(request.id, star)}
                      className={`p-1 ${
                        request.userRating && request.userRating >= star
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      } hover:text-yellow-500 transition-colors`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedRequests.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feature requests yet</h3>
          <p className="text-gray-600">Be the first to suggest an improvement!</p>
        </div>
      )}
    </div>
  );
};

export default FeatureRequests; 