'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, CheckCircle, Clock, TrendingUp, Eye } from 'lucide-react';

interface ProjectStatsProps {
  stats: {
    totalPosts: number;
    approvedPosts: number;
    pendingPosts: number;
    totalCreators: number;
    totalEngagement: number;
    totalImpressions: number;
    avgEngagementRate: number;
  };
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  const statCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts.toLocaleString(),
      icon: FileText,
      description: 'All posts in this project',
    },
    {
      title: 'Active Creators',
      value: stats.totalCreators.toLocaleString(),
      icon: Users,
      description: 'Contributing to this project',
    },
    {
      title: 'Approved Posts',
      value: stats.approvedPosts.toLocaleString(),
      icon: CheckCircle,
      description: 'Ready for tracking',
      className: 'text-green-600',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingPosts.toLocaleString(),
      icon: Clock,
      description: 'Awaiting review',
      className: 'text-yellow-600',
    },
    {
      title: 'Total Engagement',
      value: stats.totalEngagement.toLocaleString(),
      icon: TrendingUp,
      description: 'Likes, retweets, replies',
    },
    {
      title: 'Total Impressions',
      value: (stats.totalImpressions / 1000).toFixed(1) + 'K',
      icon: Eye,
      description: 'Cumulative reach',
    },
    {
      title: 'Avg Engagement Rate',
      value: stats.avgEngagementRate.toFixed(2) + '%',
      icon: TrendingUp,
      description: 'Across all posts',
      className: stats.avgEngagementRate > 5 ? 'text-green-600' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.className || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
