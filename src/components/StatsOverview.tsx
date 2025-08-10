import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Flame, 
  TrendingUp, 
  Target,
  BarChart3,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSessions } from '@/lib/database';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StatsOverview: React.FC = () => {
  const { user } = useAuth();

  type SessionLite = { created_at: string; duration: number };
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionLite[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await getSessions(user.id, 500);
        if (error) {
          setLoadError(error.message ?? 'Failed to load sessions');
        } else if (data) {
          const mapped = (data as any[]).map((s) => ({
            created_at: s.created_at,
            duration: s.duration,
          })) as SessionLite[];
          setSessions(mapped);
        }
      } catch (e: any) {
        setLoadError(e?.message ?? 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [user]);

  // Build heatmap for last 12 weeks (84 days)
  const { heatmapData, totalSeconds, sessionsThisWeek, averageSessionSeconds, currentStreakDays } = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 83);

    // Sum duration by YYYY-MM-DD
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const totalsByDay = new Map<string, number>();
    for (const s of sessions) {
      const d = new Date(s.created_at);
      if (d >= start && d <= now) {
        const key = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + (s.duration ?? 0));
      }
    }

    // Build 12x7 grid, from 11 weeks ago to this week
    const grid: number[][] = [];
    const gridStart = new Date(start);
    for (let w = 0; w < 12; w++) {
      const row: number[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(gridStart);
        cur.setDate(start.getDate() + w * 7 + d);
        const key = dayKey(cur);
        const secs = totalsByDay.get(key) ?? 0;
        // bucketize into 0..4 by hours
        const hours = secs / 3600;
        const level = hours >= 2 ? 4 : hours >= 1 ? 3 : hours >= 0.5 ? 2 : hours > 0 ? 1 : 0;
        row.push(level);
      }
      grid.push(row);
    }

    // Totals
    let total = 0;
    for (const s of sessions) total += s.duration ?? 0;

    // Sessions this week
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekCount = sessions.filter((s) => new Date(s.created_at) >= weekStart).length;

    // Average session length
    const avg = sessions.length ? Math.round(total / sessions.length) : 0;

    // Current streak (consecutive days with any activity up to today)
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const has = (totalsByDay.get(key) ?? 0) > 0;
      if (has) streak += 1; else break;
    }

    return {
      heatmapData: grid,
      totalSeconds: total,
      sessionsThisWeek: weekCount,
      averageSessionSeconds: avg,
      currentStreakDays: streak,
    };
  }, [sessions]);

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-100';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center text-gray-600"><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Loading stats...</div>
      )}
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load stats</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      {/* Weekly Activity Heatmap */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Calendar className="h-5 w-5" />
            <span>Activity Heatmap</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Week day labels */}
            <div className="flex">
              <div className="w-8"></div> {/* Spacer */}
              {weekDays.map((day) => (
                              <div key={day} className="flex-1 text-center text-xs text-gray-600">
                {day}
              </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            <div className="space-y-1">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex space-x-1">
                  <div className="w-8 text-xs text-gray-600 flex items-center">
                    {12 - weekIndex}w ago
                  </div>
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`flex-1 h-3 rounded-sm ${getHeatmapColor(day)}`}
                      title={`${day} activity level`}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="text-gray-600">Less</span>
              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`}
                  />
                ))}
              </div>
              <span className="text-gray-600">More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{currentStreakDays} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Build Time</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(totalSeconds/3600)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessions This Week</p>
                <p className="text-2xl font-bold text-gray-900">{sessionsThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(averageSessionSeconds/60)}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <BarChart3 className="h-5 w-5" />
            <span>This Week's Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weekDays.map((day, index) => {
              const hours = Math.floor(Math.random() * 8) + 1; // 1-8 hours
              const percentage = (hours / 8) * 100;
              
              return (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{day}</span>
                    <span className="text-sm text-gray-600">{hours}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Flame className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">7-Day Streak</p>
                <p className="text-sm text-gray-600">You've been building for 7 days straight!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">100 Hours Milestone</p>
                <p className="text-sm text-gray-600">You've logged over 100 hours of building!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Consistent Builder</p>
                <p className="text-sm text-gray-600">You've completed 20+ sessions this week!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview; 