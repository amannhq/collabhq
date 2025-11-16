'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { MetricsChart } from '@/components/analytics/MetricsChart';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import { GrowthChart } from '@/components/analytics/GrowthChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  FolderKanban,
  TrendingUp,
  Plus,
  UserPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCreators: number;
  activeCreators: number;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  totalEngagement: number;
  totalImpressions: number;
}

interface RecentPost {
  _id: string;
  postUrl: string;
  status: string;
  createdAt: string;
  creatorId?: { name?: string; email?: string };
  projectId?: { name?: string };
}

interface DashboardData {
  stats: DashboardStats;
  recentPosts: RecentPost[];
  chartData: Array<{
    _id: string;
    count?: number;
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
  }>;
}

export function DashboardClient({ organizationId }: { organizationId: string }) {
  const params = useParams();
  const { data, error, isLoading } = useSWR<{ success: boolean; data: DashboardData }>(
    `/api/organizations/${organizationId}/stats`
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data?.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, recentPosts, chartData } = data.data;

  // Transform chart data
  const metricsData = chartData.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.impressions || 0,
  }));

  const engagementData = chartData.map((item) => ({
    name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: item.likes || 0,
    retweets: item.retweets || 0,
    replies: item.replies || 0,
  }));

  const growthData = chartData.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    current: item.count || 0,
  }));

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${params.org}/creators/invite`}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Creator
            </Button>
          </Link>
          <Link href={`/${params.org}/projects/new`}>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreators}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCreators} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedPosts} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalImpressions.toLocaleString()} impressions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricsChart data={metricsData} title="Impressions" />
        <EngagementChart data={engagementData} title="Engagement" />
      </div>

      <GrowthChart data={growthData} title="Posts Growth" />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Latest posts from your creators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No posts yet. Invite creators to start posting!
              </p>
            ) : (
              recentPosts.map((post) => (
                <div key={post._id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {post.creatorId?.name || post.creatorId?.email || 'Unknown Creator'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.projectId?.name || 'No Project'} •{' '}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === 'approved' && (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approved
                      </span>
                    )}
                    {post.status === 'pending' && (
                      <span className="flex items-center text-xs text-yellow-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </span>
                    )}
                    <Link href={`/${params.org}/posts/${post._id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          {stats.pendingPosts > 0 && (
            <div className="mt-4">
              <Link href={`/${params.org}/posts/pending`}>
                <Button variant="outline" className="w-full">
                  View {stats.pendingPosts} Pending Post{stats.pendingPosts !== 1 ? 's' : ''}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>

      <Skeleton className="h-80" />
    </div>
  );
}
