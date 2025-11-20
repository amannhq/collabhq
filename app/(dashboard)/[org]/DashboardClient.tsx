'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { fetcher } from '@/lib/swr/config';
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
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import { ImprovedMetricsChart } from '@/components/analytics/ImprovedMetricsChart';
import { StackedEngagementChart } from '@/components/analytics/StackedEngagementChart';

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

interface TopCreator {
  _id: string;
  creatorName: string;
  creatorHandle?: string;
  postCount: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
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
  topCreators: TopCreator[];
}

export function DashboardClient({ organizationId }: { organizationId: string }) {
  const params = useParams();
  const {
    data,
    error,
    isLoading,
    mutate,
    isValidating,
  } = useSWR<{ success: boolean; data: DashboardData }>(
    `/api/organizations/${organizationId}/stats`,
    fetcher,
    {
      dedupingInterval: 30000,
      refreshInterval: 180000,
      revalidateIfStale: true,
      keepPreviousData: true,
      revalidateOnMount: true, // Always fetch on mount
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3, // Increased retries
      errorRetryInterval: 1000, // Retry faster (1s)
    }
  );

  useEffect(() => {
    if (!data && !isLoading && !error) {
      const timer = setTimeout(() => {
        console.log('[Dashboard] Force fetching stuck data');
        mutate();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [data, isLoading, error, mutate]);

  // Show loading while truly loading OR stuck without data
  if (isLoading || (!data && !error)) {
    return <DashboardSkeleton />;
  }

  if (error) {
    const errorStatus = (error as { status?: number })?.status;
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        {errorStatus === 401 && (
          <p className="text-sm text-destructive">
            Authentication error. Please refresh the page.
          </p>
        )}
        <Button onClick={() => mutate()} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={() => mutate()} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const { stats, recentPosts, chartData, topCreators } = data.data;

  // Fill in missing dates and transform chart data for last 30 days
  const fillMissingDates = (data: Array<{
    _id: string;
    count?: number;
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
  }>, days: number = 30) => {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = data.find(item => item._id === dateStr);
      result.push({
        _id: dateStr,
        ...existing,
        likes: existing?.likes || 0,
        retweets: existing?.retweets || 0,
        replies: existing?.replies || 0,
        impressions: existing?.impressions || 0,
        count: existing?.count || 0,
      });
    }

    return result;
  };

  const filledData = fillMissingDates(chartData || []);

  // Transform chart data with proper date formatting
  const impressionsData = filledData.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.impressions || 0,
  }));

  const engagementData = filledData.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: item.likes || 0,
    retweets: item.retweets || 0,
    replies: item.replies || 0,
  }));

  const growthData = filledData.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    current: item.count || 0,
  }));

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2> */}
          <h2 className="text-2xl font-serif font- tracking-tight text-muted-foreground">Welcome back! Here&apos;s your overview.</h2>
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
          <Button
            variant="outline"
            onClick={() => mutate(undefined, true)}
            disabled={isValidating}
          >
            <RefreshCcw className="h-4 w-4" />
            {/* {isValidating ? 'Refreshing...' : 'Refresh'} */}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm text-zinc-600">Total Projects</CardTitle>
            <div className="rounded-lg bg-zinc-100 p-2">
              <FolderKanban className="h-5 w-5 text-zinc-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalProjects}</div>
            <p className="text-sm text-zinc-500 mt-1">
              <span className="font-medium text-zinc-700">{stats.activeProjects}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm text-zinc-600">Total Creators</CardTitle>
            <div className="rounded-lg bg-zinc-100 p-2">
              <Users className="h-5 w-5 text-zinc-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalCreators}</div>
            <p className="text-sm text-zinc-500 mt-1">
              <span className="font-medium text-zinc-700">{stats.activeCreators}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm text-zinc-600">Total Posts</CardTitle>
            <div className="rounded-lg bg-zinc-100 p-2">
              <FileText className="h-5 w-5 text-zinc-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalPosts}</div>
            <p className="text-sm text-zinc-500 mt-1">
              <span className="font-medium text-zinc-700">{stats.approvedPosts}</span> approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm text-zinc-600">Engagement</CardTitle>
            <div className="rounded-lg bg-zinc-100 p-2">
              <TrendingUp className="h-5 w-5 text-zinc-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalEngagement.toLocaleString()}</div>
            <p className="text-sm text-zinc-500 mt-1">
              <span className="font-medium text-zinc-700">{stats.totalImpressions.toLocaleString()}</span> impressions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        {/* Impressions Chart with Top Creators Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ImprovedMetricsChart
              data={impressionsData}
              title="Impressions Over Time"
              description="Total impressions across all posts (last 30 days)"
              dataKey="value"
              valueFormatter={(value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toLocaleString();
              }}
              color="hsl(220, 70%, 50%)"
              showTrend={true}
              chartHeight="300px"
            />
          </div>

          {/* Top Creators Leaderboard */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Top Creators</CardTitle>
              <CardDescription>Ranked by engagement</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div
                className="h-[280px] overflow-y-auto space-y-3 pr-2 custom-scrollbar w-full"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d4d4d8 transparent'
                }}
              >
                {topCreators && topCreators.length > 0 ? (
                  topCreators.map((creator, index) => (
                    <div
                      key={creator._id}
                      className="flex items-center gap-3 p-1 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Creator Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900">
                          {creator.creatorName || 'Unknown'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {creator.postCount} {creator.postCount === 1 ? 'post' : 'posts'}
                        </div>
                      </div>

                      {/* Engagement */}
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-semibold text-zinc-900">
                          {creator.totalEngagement.toLocaleString()}
                        </div>
                        <div className="text-xs text-zinc-500 whitespace-nowrap">
                          {creator.avgEngagementRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                    No creator data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <StackedEngagementChart
            data={engagementData}
            title="Engagement Breakdown"
            description="Daily engagement metrics (last 30 days)"
            stacked={true}
          />
          <GrowthChart
            data={growthData}
            title="Posts Published"
            description="Number of posts with metrics updated daily"
          />
        </div>
      </div>
 
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Posts</CardTitle>
          <CardDescription>Latest posts from your creators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No posts yet. Invite creators to start posting!
              </p>
            ) : (
              recentPosts.map((post) => (
                <div key={post._id} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {post.creatorId?.name || post.creatorId?.email || 'Unknown Creator'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      <span className="font-medium">{post.projectId?.name || 'No Project'}</span> •{' '}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {post.status === 'approved' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </span>
                    )}
                    {post.status === 'pending' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3" />
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
            <div className="mt-6 pt-4 border-t border-zinc-100">
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
