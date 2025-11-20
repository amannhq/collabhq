'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  rank?: number;
  creatorName: string;
  creatorHandle?: string;
  creatorAvatar?: string;
  postCount: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
}

interface LeaderboardCardProps {
  title: string;
  description?: string;
  data: LeaderboardEntry[];
  metric?: 'engagement' | 'impressions' | 'posts';
}

export function LeaderboardCard({
  title,
  description,
  data,
  metric = 'engagement',
}: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">#{rank}</span>;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (metric) {
      case 'engagement':
        return (entry.totalEngagement || 0).toLocaleString();
      case 'impressions':
        return (entry.totalImpressions || 0).toLocaleString();
      case 'posts':
        return (entry.postCount || 0).toString();
      default:
        return (entry.totalEngagement || 0).toLocaleString();
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'engagement':
        return 'Total Engagement';
      case 'impressions':
        return 'Total Impressions';
      case 'posts':
        return 'Posts';
      default:
        return 'Metric';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const isTopThree = rank <= 3;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isTopThree
                    ? 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 flex-shrink-0">
                  {getRankIcon(rank)}
                </div>

                {/* Creator Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{entry.creatorName || 'Unknown Creator'}</div>
                  {entry.creatorHandle && (
                    <div className="text-xs text-muted-foreground">
                      {entry.creatorHandle}
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-base">{getMetricValue(entry)}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{getMetricLabel()}</div>
                </div>

                {/* Engagement Rate & Post Count */}
                <div className="flex flex-col gap-1 flex-shrink-0 min-w-[80px]">
                  {metric === 'engagement' && (
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>{(entry.avgEngagementRate || 0).toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground text-right">
                    {entry.postCount || 0} {entry.postCount === 1 ? 'post' : 'posts'}
                  </div>
                </div>
              </div>
            );
          })}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

