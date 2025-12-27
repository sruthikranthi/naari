'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/fantasy/types';

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  period: string;
  title?: string;
}

export function LeaderboardCard({ entries, period, title }: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || `${period.charAt(0).toUpperCase() + period.slice(1)} Leaderboard`}</CardTitle>
        <CardDescription>Top performers in fantasy games</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No entries yet. Be the first to play!
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold overflow-hidden">
                      {entry.userAvatar ? (
                        <img src={entry.userAvatar} alt={entry.userName} className="h-full w-full object-cover" />
                      ) : (
                        entry.userName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{entry.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.gamesPlayed} games • {entry.winRate.toFixed(1)}% win rate
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-primary">{entry.totalPoints}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                  {entry.badges.length > 0 && (
                    <div className="flex gap-1">
                      {entry.badges.slice(0, 3).map((badge, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

