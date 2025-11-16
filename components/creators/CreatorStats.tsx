'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText, Eye, Heart, MessageCircle } from 'lucide-react';

interface CreatorStatsProps {
  stats: {
    totalPosts: number;
    approvedPosts: number;
    pendingPosts: number;
    totalImpressions: number;
    totalLikes: number;
    totalComments: number;
    avgEngagementRate: number;
    growthRate: number;
  };
}

export function CreatorStats({ stats }: CreatorStatsProps) {
  const statCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      description: `${stats.approvedPosts} approved, ${stats.pendingPosts} pending`,
      color: 'text-blue-600',
    },
    {
      title: 'Total Impressions',
      value: stats.totalImpressions.toLocaleString(),
      icon: Eye,
      description: 'Across all posts',
      color: 'text-purple-600',
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes.toLocaleString(),
      icon: Heart,
      description: 'Engagement metric',
      color: 'text-pink-600',
    },
    {
      title: 'Total Comments',
      value: stats.totalComments.toLocaleString(),
      icon: MessageCircle,
      description: 'Interaction metric',
      color: 'text-green-600',
    },
    {
      title: 'Avg Engagement Rate',
      value: `${stats.avgEngagementRate.toFixed(2)}%`,
      icon: TrendingUp,
      description: 'Overall performance',
      color: 'text-orange-600',
    },
    {
      title: 'Growth Rate',
      value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Last 30 days',
      color: stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
