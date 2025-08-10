import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Target, 
  Users, 
  Calendar,
  Clock,
  Flame,
  TrendingUp,
  Award,
  Star,
  Zap
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getChallenges, joinChallenge, leaveChallenge, isUserInChallenge } from '@/lib/database';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  duration: number; // in days
  goal: string;
  participants: number;
  isJoined: boolean;
  progress: number; // 0-100
  leaderboard: {
    rank: number;
    participants: Array<{
      id: string;
      handle: string;
      avatar_url: string;
      score: number;
      sessions: number;
    }>;
  };
}

const Challenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      const { data: challengesData, error } = await getChallenges();
      if (error) throw error;

      // Process challenges and check if user is participating
      const processedChallenges = await Promise.all(
        (challengesData || []).map(async (challenge: any) => {
          const { data: isParticipating } = await isUserInChallenge(challenge.id, user.id);
          
          // Find user's participation data
          const userParticipation = challenge.challenge_participants?.find(
            (p: any) => p.user_id === user.id
          );

          return {
            id: challenge.id,
            name: challenge.name,
            description: challenge.description,
            emoji: challenge.emoji,
            color: challenge.color,
            duration: challenge.duration,
            goal: challenge.goal,
            participants: challenge.challenge_participants?.length || 0,
            isJoined: isParticipating,
            progress: userParticipation?.progress || 0,
            leaderboard: {
              rank: 1, // TODO: Calculate actual rank
              participants: challenge.challenge_participants?.slice(0, 5).map((p: any) => ({
                id: p.user_id,
                handle: p.profiles?.handle || 'Anonymous',
                avatar_url: p.profiles?.avatar_url || 'https://github.com/github.png',
                score: p.score || 0,
                sessions: Math.floor(p.progress / 10) // Estimate sessions from progress
              })) || []
            }
          };
        })
      );

      setChallenges(processedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      // Don't show error toast if no challenges exist - that's normal
      // Just fall back to default challenges
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    
    setJoinLoading(challengeId);
    try {
      const { error } = await joinChallenge(challengeId, user.id);
      if (error) throw error;
      
      toast.success('Successfully joined challenge!');
      fetchChallenges(); // Refresh data
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    } finally {
      setJoinLoading(null);
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    if (!user) return;
    
    setJoinLoading(challengeId);
    try {
      const { error } = await leaveChallenge(challengeId, user.id);
      if (error) throw error;
      
      toast.success('Left challenge successfully');
      fetchChallenges(); // Refresh data
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast.error('Failed to leave challenge');
    } finally {
      setJoinLoading(null);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading challenges...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Add some default challenges if none exist
  const defaultChallenges = challenges.length === 0 ? [
    {
      id: 'default-1',
      name: '7-Day Build Streak',
      description: 'Build something every day for 7 days straight',
      emoji: '🔥',
      color: 'bg-orange-500',
      duration: 7,
      goal: '7 sessions in 7 days',
      participants: 156,
      isJoined: true,
      progress: 85,
      leaderboard: {
        rank: 3,
        participants: [
          {
            id: '1',
            handle: 'sarahdev',
            avatar_url: 'https://github.com/github.png',
            score: 7,
            sessions: 7,
          },
          {
            id: '2',
            handle: 'mikehacker',
            avatar_url: 'https://github.com/github.png',
            score: 6,
            sessions: 6,
          },
          {
            id: '3',
            handle: 'alexbuilder',
            avatar_url: 'https://github.com/github.png',
            score: 5,
            sessions: 5,
          },
        ],
      },
    },
    {
      id: '2',
      name: '100 Hours Club',
      description: 'Log 100 hours of building time',
      emoji: '⏰',
      color: 'bg-blue-500',
      duration: 30,
      goal: '100 hours total',
      participants: 89,
      isJoined: false,
      progress: 0,
      leaderboard: {
        rank: 0,
        participants: [
          {
            id: '1',
            handle: 'prodev',
            avatar_url: 'https://github.com/github.png',
            score: 87,
            sessions: 45,
          },
          {
            id: '2',
            handle: 'coder123',
            avatar_url: 'https://github.com/github.png',
            score: 76,
            sessions: 38,
          },
          {
            id: '3',
            handle: 'buildermaster',
            avatar_url: 'https://github.com/github.png',
            score: 65,
            sessions: 32,
          },
        ],
      },
    },
    {
      id: '3',
      name: 'Weekend Warrior',
      description: 'Complete 5 build sessions over the weekend',
      emoji: '⚡',
      color: 'bg-purple-500',
      duration: 3,
      goal: '5 sessions in 3 days',
      participants: 234,
      isJoined: false,
      progress: 0,
      leaderboard: {
        rank: 0,
        participants: [
          {
            id: '1',
            handle: 'weekenddev',
            avatar_url: 'https://github.com/github.png',
            score: 5,
            sessions: 5,
          },
          {
            id: '2',
            handle: 'saturdaycoder',
            avatar_url: 'https://github.com/github.png',
            score: 4,
            sessions: 4,
          },
          {
            id: '3',
            handle: 'sundayhacker',
            avatar_url: 'https://github.com/github.png',
            score: 3,
            sessions: 3,
          },
        ],
      },
    },
  ] : challenges;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-8">
        <div className="text-center mb-8">
                      <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Community Challenges</h2>
            <p className="text-gray-600">Join community building challenges and build together</p>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultChallenges.map((challenge) => (
          <div key={challenge.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${challenge.color}`}>
                    {challenge.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{challenge.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                </div>
                {challenge.isJoined && (
                  <Badge className="bg-green-100 text-green-700">
                    <Star className="w-3 h-3 mr-1" />
                    Joined
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Goal</span>
                  <span className="font-medium text-gray-900">{challenge.goal}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">{challenge.duration} days</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Participants</span>
                  <span className="font-medium text-gray-900">{challenge.participants}</span>
                </div>

                {challenge.isJoined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Your Progress</span>
                      <span className="font-medium text-gray-900">{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                  </div>
                )}

                <div className="pt-4">
                  {challenge.isJoined ? (
                    <Button 
                      variant="outline" 
                      onClick={() => handleLeaveChallenge(challenge.id)}
                      disabled={joinLoading === challenge.id}
                      className="w-full bg-white border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {joinLoading === challenge.id ? 'Leaving...' : 'Leave Challenge'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joinLoading === challenge.id}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {joinLoading === challenge.id ? (
                        'Joining...'
                      ) : (
                        <>
                          <Trophy className="w-4 h-4 mr-2" />
                          Join Challenge
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Leaderboard */}
              {challenge.isJoined && challenge.leaderboard.rank > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Leaderboard</h4>
                  <div className="space-y-2">
                    {challenge.leaderboard.participants.slice(0, 3).map((participant, index) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={participant.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {participant.handle.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-gray-900">
                            {participant.handle}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {participant.score} pts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-12 text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">More Challenges Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            We're working on new challenges and features to keep you motivated and building.
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Zap className="w-4 h-4 mr-2" />
            Get Notified
          </Button>
        </div>
      </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Challenges; 