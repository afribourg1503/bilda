import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowUp, 
  MessageSquare, 
  Share2, 
  Heart,
  ExternalLink,
  Github,
  Twitter,
  Globe,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  Star,
  Zap
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface ShipDetail {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  website: string;
  github?: string;
  twitter?: string;
  images: string[];
  tags: string[];
  upvotes: number;
  isUpvoted: boolean;
  comments: number;
  views: number;
  traction: {
    users?: number;
    revenue?: number;
    growth?: string;
  };
  press: {
    mentions: string[];
    articles: string[];
  };
  maker: {
    id: string;
    name: string;
    avatar: string;
    handle: string;
    bio: string;
  };
  createdAt: string;
}

const ShipDetail = () => {
  const { shipId } = useParams();
  const { user } = useAuth();
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(127);

  // Mock data - replace with API call
  const shipDetail: ShipDetail = {
    id: shipId || '1',
    title: 'Bilda - Strava for Founders',
    tagline: 'Track your building progress and share your journey with other founders',
    description: `Bilda is a social platform that helps founders track their building progress, share their journey, and connect with other builders. Think of it as Strava for founders - you can track your daily building sessions, see your progress over time, and get motivated by seeing what other founders are building.

Key Features:
• Track building sessions with a timer
• Share your progress with the community
• Follow other builders and their projects
• Analytics and insights on your building habits
• Challenges and achievements to stay motivated

Built with React, TypeScript, and Supabase. This project started as a way to stay accountable while building in public and has grown into a community of builders supporting each other.`,
    category: 'SaaS',
    website: 'https://bilda.com',
    github: 'https://github.com/username/bilda',
    twitter: '@bildaapp',
    images: ['/hero-image.jpg'],
    tags: ['react', 'typescript', 'supabase', 'saas', 'social'],
    upvotes: 127,
    isUpvoted: false,
    comments: 23,
    views: 1247,
    traction: {
      users: 500,
      revenue: 2500,
      growth: '15%'
    },
    press: {
      mentions: ['TechCrunch', 'Product Hunt'],
      articles: ['How I Built a Social Platform in 30 Days']
    },
    maker: {
      id: '1',
      name: 'Alex Builder',
      avatar: 'https://github.com/github.png',
      handle: 'alexbuilder',
      bio: 'Full-stack developer passionate about building in public and helping other founders succeed.'
    },
    createdAt: '2024-01-15T10:30:00Z'
  };

  const handleUpvote = () => {
    if (isUpvoted) {
      setUpvotes(upvotes - 1);
    } else {
      setUpvotes(upvotes + 1);
    }
    setIsUpvoted(!isUpvoted);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={shipDetail.maker.avatar} />
              <AvatarFallback className="text-xl">{shipDetail.maker.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">{shipDetail.title}</h1>
              <p className="text-xl text-gray-600 mb-2">{shipDetail.tagline}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>by {shipDetail.maker.name}</span>
                <span>•</span>
                <span>{formatDate(shipDetail.createdAt)}</span>
                <span>•</span>
                <span>{shipDetail.category}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleUpvote}
              className={`flex items-center space-x-2 px-6 py-3 ${
                isUpvoted 
                  ? 'bg-pulse-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowUp className={`h-5 w-5 ${isUpvoted ? 'text-white' : 'text-gray-600'}`} />
              <span className="font-semibold">{upvotes}</span>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 px-6 py-3">
              <MessageSquare className="h-5 w-5" />
              <span>{shipDetail.comments} Comments</span>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 px-6 py-3">
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Image */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-0">
                <img 
                  src={shipDetail.images[0]} 
                  alt={shipDetail.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">About this project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {shipDetail.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Comments ({shipDetail.comments})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/github.png" />
                      <AvatarFallback>SB</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">Sarah Builder</span>
                        <span className="text-sm text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-gray-700">This looks amazing! Love the Strava for founders concept. How long did it take you to build this?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/github.png" />
                      <AvatarFallback>MD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">Mike Developer</span>
                        <span className="text-sm text-gray-500">1 hour ago</span>
                      </div>
                      <p className="text-gray-700">Great work! I've been looking for something like this. The social aspect is really well done.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Links */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={shipDetail.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
                
                {shipDetail.github && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={shipDetail.github} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                )}
                
                {shipDetail.twitter && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`https://twitter.com/${shipDetail.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-2" />
                      Follow on Twitter
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Traction */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Traction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipDetail.traction.users && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Users</span>
                      </div>
                      <span className="font-semibold text-gray-900">{shipDetail.traction.users.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {shipDetail.traction.revenue && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Monthly Revenue</span>
                      </div>
                      <span className="font-semibold text-gray-900">${shipDetail.traction.revenue.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {shipDetail.traction.growth && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Growth Rate</span>
                      </div>
                      <span className="font-semibold text-gray-900">{shipDetail.traction.growth}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {shipDetail.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Views</span>
                    </div>
                    <span className="font-semibold text-gray-900">{shipDetail.views.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Upvotes</span>
                    </div>
                    <span className="font-semibold text-gray-900">{upvotes}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Comments</span>
                    </div>
                    <span className="font-semibold text-gray-900">{shipDetail.comments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default ShipDetail; 