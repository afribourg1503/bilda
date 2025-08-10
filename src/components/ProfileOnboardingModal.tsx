import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { upsertProfile } from '@/lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function ProfileOnboardingModal({ open, onComplete }: ProfileOnboardingModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    handle: '',
    name: user?.user_metadata?.name || user?.user_metadata?.full_name || '',
    bio: '',
    avatar_url: user?.user_metadata?.avatar_url || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.handle.trim()) {
      toast.error('Handle is required');
      return;
    }

    // Basic handle validation
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.handle)) {
      toast.error('Handle can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!user) throw new Error('No user found');
      
      const profile = {
        user_id: user.id,
        handle: formData.handle.toLowerCase(),
        name: formData.name || formData.handle,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null
      };

      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
      );
      
      console.log('🔐 ProfileOnboarding: Starting profile creation...', profile);
      const profilePromise = upsertProfile(profile);
      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      console.log('🔐 ProfileOnboarding: Profile creation result:', result);
      
      if (result.error) {
        if (result.error.code === '23505') {
          toast.error('This handle is already taken. Please choose another.');
          return;
        }
        throw result.error;
      }

      toast.success('Profile created successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Profile creation error:', error);
      
      // Handle timeout specifically
      if (error.message === 'Profile creation timeout') {
        toast.error('Profile creation is taking too long. Please try again or check your connection.');
      } else {
        toast.error(error.message || 'Failed to create profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSuggestedHandle = () => {
    const name = formData.name || user?.email?.split('@')[0] || 'builder';
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${cleanName}${randomSuffix}`;
  };

  const handleGenerateHandle = () => {
    setFormData(prev => ({ ...prev, handle: generateSuggestedHandle() }));
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">Complete Your Profile</DialogTitle>
          <p className="text-sm text-gray-600 text-center">
            Set up your builder profile to start sharing your progress
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="bg-gray-200">
                <User className="h-8 w-8 text-gray-400" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Handle */}
          <div className="space-y-2">
            <Label htmlFor="handle">Handle *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  @
                </span>
                <Input
                  id="handle"
                  value={formData.handle}
                  onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
                  placeholder="yourhandle"
                  className="pl-8"
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateHandle}
                className="whitespace-nowrap"
              >
                Suggest
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell other builders about yourself..."
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 text-right">
              {formData.bio.length}/160
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formData.handle.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Profile...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}