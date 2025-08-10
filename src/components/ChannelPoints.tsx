import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Gift, 
  Star, 
  Zap, 
  Heart, 
  Target, 
  Clock,
  TrendingUp,
  Award,
  Coins,
  Sparkles,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  isEnabled: boolean;
  cooldown?: number; // in seconds
  lastUsed?: Date;
}

interface ChannelPointsProps {
  streamerId: string;
  viewerId: string;
  isStreamer: boolean;
  currentPoints: number;
  onRedeemReward: (rewardId: string) => void;
}

const DEFAULT_REWARDS: Reward[] = [
  {
    id: 'highlight',
    name: 'Highlight Message',
    description: 'Highlight your message in chat',
    cost: 100,
    icon: '⭐',
    isEnabled: true
  },
  {
    id: 'slow_mode_off',
    name: 'Disable Slow Mode',
    description: 'Turn off slow mode for 30 seconds',
    cost: 200,
    icon: '⚡',
    isEnabled: true,
    cooldown: 300 // 5 minutes
  },
  {
    id: 'emote_only',
    name: 'Emote Only Mode',
    description: 'Enable emote-only chat for 1 minute',
    cost: 300,
    icon: '😊',
    isEnabled: true,
    cooldown: 600 // 10 minutes
  },
  {
    id: 'subscriber_mode',
    name: 'Subscriber Only',
    description: 'Enable subscriber-only chat for 2 minutes',
    cost: 500,
    icon: '👑',
    isEnabled: true,
    cooldown: 900 // 15 minutes
  },
  {
    id: 'custom_alert',
    name: 'Custom Alert',
    description: 'Show a custom alert on stream',
    cost: 1000,
    icon: '🎉',
    isEnabled: true,
    cooldown: 1800 // 30 minutes
  }
];

const ChannelPoints: React.FC<ChannelPointsProps> = ({
  streamerId,
  viewerId,
  isStreamer,
  currentPoints,
  onRedeemReward
}) => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [showRewards, setShowRewards] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pointsMultiplier, setPointsMultiplier] = useState(1);
  const [showEarnedPoints, setShowEarnedPoints] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Simulate earning points while watching
  useEffect(() => {
    if (!isStreamer && showEarnedPoints) {
      const interval = setInterval(() => {
        setEarnedPoints(prev => prev + (1 * pointsMultiplier));
      }, 10000); // Earn points every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isStreamer, showEarnedPoints, pointsMultiplier]);

  const handleRedeemReward = (reward: Reward) => {
    if (currentPoints < reward.cost) {
      toast.error('Not enough points!');
      return;
    }

    if (reward.cooldown && reward.lastUsed) {
      const timeSinceLastUse = Date.now() - reward.lastUsed.getTime();
      if (timeSinceLastUse < reward.cooldown * 1000) {
        const remainingTime = Math.ceil((reward.cooldown * 1000 - timeSinceLastUse) / 1000);
        toast.error(`Reward on cooldown! Try again in ${remainingTime}s`);
        return;
      }
    }

    // Update reward last used time
    setRewards(prev => prev.map(r => 
      r.id === reward.id 
        ? { ...r, lastUsed: new Date() }
        : r
    ));

    onRedeemReward(reward.id);
    toast.success(`${reward.name} redeemed successfully!`);
  };

  const getCooldownStatus = (reward: Reward) => {
    if (!reward.cooldown || !reward.lastUsed) return null;
    
    const timeSinceLastUse = Date.now() - reward.lastUsed.getTime();
    const remainingTime = Math.ceil((reward.cooldown * 1000 - timeSinceLastUse) / 1000);
    
    if (remainingTime > 0) {
      return (
        <div className="text-xs text-red-600">
          Cooldown: {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
        </div>
      );
    }
    
    return null;
  };

  const toggleReward = (rewardId: string) => {
    if (!isStreamer) return;
    
    setRewards(prev => prev.map(r => 
      r.id === rewardId 
        ? { ...r, isEnabled: !r.isEnabled }
        : r
    ));
  };

  const addCustomReward = () => {
    if (!isStreamer) return;
    
    const newReward: Reward = {
      id: `custom_${Date.now()}`,
      name: 'Custom Reward',
      description: 'A custom reward you can configure',
      cost: 100,
      icon: '🎯',
      isEnabled: true
    };
    
    setRewards(prev => [...prev, newReward]);
    toast.success('Custom reward added!');
  };

  return (
    <div className="space-y-4">
      {/* Points Display */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="h-8 w-8" />
              <div>
                <div className="text-sm opacity-90">Channel Points</div>
                <div className="text-2xl font-bold">{currentPoints.toLocaleString()}</div>
              </div>
            </div>
            
            {!isStreamer && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEarnedPoints(!showEarnedPoints)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {showEarnedPoints ? 'Hide' : 'Show'} Earned
              </Button>
            )}
          </div>
          
          {/* Points Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Progress to next level</span>
              <span>Level {Math.floor(currentPoints / 1000) + 1}</span>
            </div>
            <Progress 
              value={(currentPoints % 1000) / 10} 
              className="h-2 bg-white/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Earned Points Display */}
      {showEarnedPoints && !isStreamer && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  +{earnedPoints} points earned this session
                </span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {pointsMultiplier}x multiplier
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Channel Rewards</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRewards(!showRewards)}
              >
                {showRewards ? 'Hide' : 'Show'} Rewards
              </Button>
              
              {isStreamer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  Settings
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Rewards Settings */}
        {showSettings && isStreamer && (
          <div className="px-6 py-4 bg-gray-50 border-b space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Points Multiplier</label>
                <select
                  value={pointsMultiplier}
                  onChange={(e) => setPointsMultiplier(parseFloat(e.target.value))}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value={0.5}>0.5x (Slow)</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={2}>2x (Fast)</option>
                  <option value={3}>3x (Very Fast)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCustomReward}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Reward
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rewards List */}
        {showRewards && (
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    reward.isEnabled 
                      ? 'bg-white hover:shadow-md' 
                      : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{reward.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      </div>
                    </div>
                    
                    {isStreamer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReward(reward.id)}
                        className="h-6 w-6 p-0"
                      >
                        {reward.isEnabled ? '✓' : '✕'}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-gray-900">{reward.cost}</span>
                    </div>
                    
                    {!isStreamer && reward.isEnabled && (
                      <Button
                        size="sm"
                        onClick={() => handleRedeemReward(reward)}
                        disabled={currentPoints < reward.cost}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Redeem
                      </Button>
                    )}
                  </div>
                  
                  {/* Cooldown Status */}
                  {getCooldownStatus(reward)}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      {!isStreamer && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center justify-center space-y-1"
                onClick={() => onRedeemReward('highlight')}
                disabled={currentPoints < 100}
              >
                <Star className="h-4 w-4" />
                <span className="text-xs">Highlight (100)</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center justify-center space-y-1"
                onClick={() => onRedeemReward('slow_mode_off')}
                disabled={currentPoints < 200}
              >
                <Zap className="h-4 w-4" />
                <span className="text-xs">Speed Up (200)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChannelPoints; 