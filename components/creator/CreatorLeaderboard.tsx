'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  rank: number;
  creatorId: string;
  creatorName: string;
  creatorHandle?: string;
  creatorAvatar?: string;
  postCount: number;
  totalEngagement: number;
  totalImpressions: number;
  engagementRate: number;
  impactScore: number;
}

interface CreatorLeaderboardProps {
  data: LeaderboardEntry[];
  currentCreatorId: string;
}

export function CreatorLeaderboard({ data, currentCreatorId }: CreatorLeaderboardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-semibold">1</div>;
    if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">2</div>;
    if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-semibold">3</div>;
    return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">{rank}</div>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-lg font-normal">Leaderboard</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-10" />
            <p className="font-medium">No creators yet</p>
            <p className="text-sm mt-1">Start posting to appear</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="divide-y">
              {data.map((entry) => {
                const isCurrentUser = entry.creatorId === currentCreatorId;

                return (
                  <div
                    key={entry.creatorId}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      isCurrentUser
                        ? 'bg-primary/5 border-l-2 border-l-primary'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      {getRankBadge(entry.rank)}
                    </div>

                    {/* Creator Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {entry.creatorName}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid - Desktop */}
                    <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                      {/* Engagement */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Engagement</p>
                        <p className="font-semibold text-sm">
                          {formatNumber(entry.totalEngagement)}
                        </p>
                      </div>

                      {/* Reach */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Reach</p>
                        <p className="font-semibold text-sm">
                          {formatNumber(entry.totalImpressions)}
                        </p>
                      </div>

                      {/* Rate */}
                      <div className="text-right min-w-[50px]">
                        <p className="text-xs text-muted-foreground mb-0.5">Rate</p>
                        <p className="font-semibold text-sm text-emerald-600">
                          {entry.engagementRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid - Mobile/Tablet */}
                    <div className="lg:hidden flex flex-col items-end gap-0.5 flex-shrink-0">
                      <p className="font-semibold text-sm">
                        {formatNumber(entry.totalEngagement)}
                      </p>
                      <p className="text-emerald-600 font-medium text-xs">
                        {entry.engagementRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
