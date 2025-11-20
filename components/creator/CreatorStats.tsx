'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  CheckCircle,
  Clock,
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
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const statCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      description: 'All time',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Approved',
      value: stats.approvedPosts,
      icon: CheckCircle,
      description: 'Live posts',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingPosts,
      icon: Clock,
      description: 'Awaiting review',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Total Engagement',
      value: formatNumber(stats.totalEngagement),
      icon: TrendingUp,
      description: 'Likes + Retweets + Replies',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Impressions',
      value: formatNumber(stats.totalImpressions),
      icon: Eye,
      description: 'Total views',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Avg Engagement Rate',
      value: `${stats.avgEngagementRate}%`,
      icon: Target,
      description: 'Overall performance',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
