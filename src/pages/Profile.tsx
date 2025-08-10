import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit, 
  Save, 
  X, 
  Flame, 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Settings,
  LogOut
} from 'lucide-react';
import StatsOverview from '@/components/StatsOverview';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: 'Passionate builder working on the next big thing. Love open source and building in public.',
    location: 'San Francisco, CA',
    website: 'https://alexbuilder.dev',
    twitter: '@alexbuilder',
    github: 'alexbuilder',
  });

  const handleSave = () => {
    // TODO: Save profile data to backend
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      bio: 'Passionate builder working on the next big thing. Love open source and building in public.',
      location: 'San Francisco, CA',
      website: 'https://alexbuilder.dev',
      twitter: '@alexbuilder',
      github: 'alexbuilder',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthenticatedLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-gray-900">Profile</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>

              <div className="text-center mb-6">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-2xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="twitter" className="text-sm font-medium text-gray-700">Twitter</Label>
                    <Input
                      id="twitter"
                      value={profileData.twitter}
                      onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="github" className="text-sm font-medium text-gray-700">GitHub</Label>
                    <Input
                      id="github"
                      value={profileData.github}
                      onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSave} className="flex-1 bg-pulse-500 hover:bg-pulse-600">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Bio</Label>
                    <p className="text-gray-600 mt-1">{profileData.bio}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <p className="text-gray-600 mt-1">{profileData.location}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Website</Label>
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 block">
                      {profileData.website}
                    </a>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Twitter</Label>
                    <p className="text-gray-600 mt-1">{profileData.twitter}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">GitHub</Label>
                    <p className="text-gray-600 mt-1">{profileData.github}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats and Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <Tabs defaultValue="stats" className="w-full">
              <div className="border-b border-gray-200">
                <div className="px-6 py-4">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                    <TabsTrigger value="stats" className="data-[state=active]:bg-white">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Stats
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-white">
                      <Clock className="w-4 h-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="stats" className="p-6">
                <StatsOverview />
              </TabsContent>

              <TabsContent value="activity" className="p-6">
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity History</h3>
                  <p className="text-gray-600">Your detailed activity history will appear here.</p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="p-6">
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
                  <p className="text-gray-600">Manage your account preferences and notifications.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Profile; 