'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Eye,
  Target,
} from 'lucide-react';

interface CreatorStatsProps {
  stats: {
    totalPosts: number;
    approvedPosts: number;
    pendingPosts: number;
    rejectedPosts: number;
    totalEngagement: number;
    totalImpressions: number;
    avgEngagementRate: string;
  };
}

export function CreatorStats({ stats }: CreatorStatsProps) {
  const statCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      description: 'All time',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Approved',
      value: stats.approvedPosts,
      icon: CheckCircle,
      description: 'Live posts',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingPosts,
      icon: Clock,
      description: 'Awaiting review',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Total Engagement',
      value: stats.totalEngagement.toLocaleString(),
      icon: TrendingUp,
      description: 'Likes + Retweets + Replies',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Impressions',
      value: stats.totalImpressions.toLocaleString(),
      icon: Eye,
      description: 'Total views',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Avg Engagement Rate',
      value: `${stats.avgEngagementRate}%`,
      icon: Target,
      description: 'Overall performance',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
