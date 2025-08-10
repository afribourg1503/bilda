import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Upload, 
  Link as LinkIcon, 
  Globe, 
  Users, 
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Star,
  MessageSquare,
  Share2,
  ArrowUp,
  Eye,
  Heart
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface ShipData {
  title: string;
  tagline: string;
  description: string;
  projectId: string;
  projectName: string;
  launchDate: string;
  category: string;
  website: string;
  github?: string;
  twitter?: string;
  images: string[];
  tags: string[];
  traction: {
    users?: number;
    revenue?: number;
    growth?: string;
  };
  press: {
    mentions: string[];
    articles: string[];
  };
}

const Ship = () => {
  const { user } = useAuth();
  const [shipData, setShipData] = useState<ShipData>({
    title: '',
    tagline: '',
    description: '',
    projectId: '',
    projectName: '',
    launchDate: '',
    category: '',
    website: '',
    github: '',
    twitter: '',
    images: [],
    tags: [],
    traction: {},
    press: {
      mentions: [],
      articles: []
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to the ship page or show success
      console.log('Ship submitted:', shipData);
    }, 2000);
  };

  const categories = [
    'SaaS', 'Mobile App', 'Web App', 'API', 'Design Tool', 
    'Developer Tool', 'AI/ML', 'Blockchain', 'Gaming', 'Other'
  ];

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Ship Your Project</h1>
          <p className="text-gray-600">Announce your new feature or project to the builder community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Ship Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name *
                      </label>
                      <Input
                        value={shipData.title}
                        onChange={(e) => setShipData({...shipData, title: e.target.value})}
                        placeholder="What are you shipping?"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tagline *
                      </label>
                      <Input
                        value={shipData.tagline}
                        onChange={(e) => setShipData({...shipData, tagline: e.target.value})}
                        placeholder="One-line description of your project"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <Textarea
                        value={shipData.description}
                        onChange={(e) => setShipData({...shipData, description: e.target.value})}
                        placeholder="Tell the community about your project..."
                        rows={4}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Category & Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={shipData.category}
                        onChange={(e) => setShipData({...shipData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website *
                      </label>
                      <Input
                        value={shipData.website}
                        onChange={(e) => setShipData({...shipData, website: e.target.value})}
                        placeholder="https://yourproject.com"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub (optional)
                      </label>
                      <Input
                        value={shipData.github}
                        onChange={(e) => setShipData({...shipData, github: e.target.value})}
                        placeholder="https://github.com/username/repo"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter (optional)
                      </label>
                      <Input
                        value={shipData.twitter}
                        onChange={(e) => setShipData({...shipData, twitter: e.target.value})}
                        placeholder="@yourhandle"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (optional)
                    </label>
                    <Input
                      placeholder="Add tags separated by commas (e.g., react, saas, ai)"
                      className="w-full"
                    />
                  </div>

                  {/* Traction Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Traction Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Users
                        </label>
                        <Input
                          type="number"
                          placeholder="1000"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Revenue (monthly)
                        </label>
                        <Input
                          type="number"
                          placeholder="5000"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Growth Rate
                        </label>
                        <Input
                          placeholder="20%"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-pulse-500 hover:bg-pulse-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Shipping...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Ship Project
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Tips */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{user?.user_metadata?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{user?.user_metadata?.name || 'User'}</p>
                      <p className="text-sm text-gray-500">Shipping today</p>
                    </div>
                  </div>

                  {shipData.title && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{shipData.title}</h3>
                      {shipData.tagline && (
                        <p className="text-gray-600 mt-1">{shipData.tagline}</p>
                      )}
                    </div>
                  )}

                  {shipData.category && (
                    <Badge variant="secondary" className="bg-pulse-100 text-pulse-700">
                      {shipData.category}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-blue-600" />
                  Shipping Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                    <p>Write a compelling tagline that explains your project in one sentence</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                    <p>Include screenshots or demos to show your project in action</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                    <p>Share your building journey and what you learned</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                    <p>Engage with the community by responding to comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today's Ships</span>
                    <span className="font-semibold text-gray-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-semibold text-gray-900">89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Upvotes</span>
                    <span className="font-semibold text-gray-900">24</span>
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

export default Ship; 