import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Flag, 
  Users, 
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  Star,
  MapPin
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const Clubs = () => {
  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏁 Clubs</h1>
              <p className="text-gray-600">
                Join or create clubs to collaborate with other builders, share projects, and build together.
              </p>
            </div>
            <Button className="bg-pulse-600 hover:bg-pulse-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Club
            </Button>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full p-6 mb-6 inline-block">
              <Flag className="w-12 h-12 text-purple-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Clubs Coming Soon!</h2>
            <p className="text-gray-600 mb-6">
              We're building an amazing club system where you can collaborate with other builders, 
              join specialized communities, and work on projects together.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                Create and join builder communities
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 mr-2" />
                Collaborate on shared projects
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                Organize building sessions and events
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Star className="w-4 h-4 mr-2" />
                Exclusive club challenges and rewards
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-6 text-pulse-600 border-pulse-600 hover:bg-pulse-50"
              onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
            >
              Request Early Access
            </Button>
          </div>
        </div>

        {/* Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 opacity-60">
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🚀</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Startup Club</h3>
                  <p className="text-sm text-gray-500">142 members</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                For builders working on startup ideas, MVP development, and entrepreneurial projects.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active
                </Badge>
                <Button size="sm" variant="outline" disabled>
                  Join Club
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">💻</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Open Source</h3>
                  <p className="text-sm text-gray-500">89 members</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Contributing to open source projects, collaborative coding, and community-driven development.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
                <Button size="sm" variant="outline" disabled>
                  Join Club
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🎨</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Design & Frontend</h3>
                  <p className="text-sm text-gray-500">67 members</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                UI/UX design, frontend development, and creating beautiful user experiences.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Growing
                </Badge>
                <Button size="sm" variant="outline" disabled>
                  Join Club
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Clubs;