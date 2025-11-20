'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback } from 'react';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  Heart,
  Info,
  BarChart3,
  Activity,
} from 'lucide-react';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { ImprovedMetricsChart } from '@/components/analytics/ImprovedMetricsChart';
import { StackedEngagementChart } from '@/components/analytics/StackedEngagementChart';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { LeaderboardCard } from '@/components/analytics/LeaderboardCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ImprovedProjectAnalyticsProps {
  projectId: string;
  organizationId: string;
}

export function ImprovedProjectAnalytics({ projectId, organizationId }: ImprovedProjectAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [data, setData] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        projectId,
        organizationId,
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/analytics/project?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, [projectId, organizationId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  if (error) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isInitialLoad) {
    return <AnalyticsSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const metrics = data.metrics || {};

  // Transform timeline data for charts
  const impressionsData = data.timeline?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    value: item.impressions || 0,
  })) || [];

  const engagementData = data.timeline?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    likes: item.likes || 0,
    retweets: item.retweets || 0,
    replies: item.replies || 0,
  })) || [];

  const postsOverTimeData = data.timeline?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    value: item.posts || 0,
  })) || [];

  // Engagement breakdown for pie chart
  const engagementBreakdownData = [
    { name: 'Likes', value: data.engagementBreakdown?.totalLikes || 0, color: '#10b981' },
    { name: 'Retweets', value: data.engagementBreakdown?.totalRetweets || 0, color: '#3b82f6' },
    { name: 'Replies', value: data.engagementBreakdown?.totalReplies || 0, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-end gap-2">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        <div className="w-[110px] h-[20px]">
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Total Posts',
            value: formatNumber(metrics.totalPosts || 0),
            change: metrics.postsGrowth || 0,
            icon: FileText,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
          },
          {
            title: 'Total Engagement',
            value: formatNumber(metrics.totalEngagement || 0),
            change: metrics.engagementGrowth || 0,
            icon: Heart,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
          },
          {
            title: 'Total Impressions',
            value: formatNumber(metrics.totalImpressions || 0),
            change: 0,
            icon: Eye,
            color: 'text-purple-500',
            bgColor: 'bg-purple-50',
          },
          {
            title: 'Avg Engagement Rate',
            value: (metrics.avgEngagementRate || 0).toFixed(2) + '%',
            change: 0,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50',
          },
        ].map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;

          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`${metric.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
                {metric.change !== 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {isPositive ? '+' : ''}
                      {metric.change.toFixed(1)}%
                    </span>
                    <span className="ml-1">vs previous period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">
            <Activity className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Heart className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="creators">
            <Users className="h-4 w-4 mr-2" />
            Creators
          </TabsTrigger>
          <TabsTrigger value="top-posts">
            <BarChart3 className="h-4 w-4 mr-2" />
            Top Posts
          </TabsTrigger>
        </TabsList>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-6">
          <ImprovedMetricsChart
            data={impressionsData}
            title="Impressions Over Time"
            description="Total impressions across all project posts"
            dataKey="value"
            valueFormatter={(value: number) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toLocaleString();
            }}
            color="hsl(220, 70%, 50%)"
            showTrend={true}
          />

          <ImprovedMetricsChart
            data={postsOverTimeData}
            title="Posts Published Over Time"
            description="Number of posts published daily"
            dataKey="value"
            valueFormatter={(value: number) => value.toLocaleString()}
            color="hsl(142, 71%, 45%)"
            showTrend={false}
          />
        </TabsContent>

        {/* ENGAGEMENT TAB */}
        <TabsContent value="engagement" className="space-y-6">
          <StackedEngagementChart
            data={engagementData}
            title="Engagement Breakdown Over Time"
            description="Daily engagement metrics (likes, retweets, replies)"
            stacked={true}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PieChartComponent
              title="Engagement Type Distribution"
              description="How users interact with project content"
              data={engagementBreakdownData}
            />

            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>Key takeaways from engagement data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Growth Trend</div>
                      <p className="text-sm text-muted-foreground">
                        {metrics.engagementGrowth >= 0 ? (
                          <>+{metrics.engagementGrowth.toFixed(1)}% increase in engagement</>
                        ) : (
                          <>{metrics.engagementGrowth.toFixed(1)}% decrease in engagement</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-pink-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Engagement Rate</div>
                      <p className="text-sm text-muted-foreground">
                        {metrics.avgEngagementRate?.toFixed(2)}% - 
                        {metrics.avgEngagementRate > 3 ? ' Excellent!' : ' Room for improvement'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Total Interactions</div>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(metrics.totalEngagement)} engagements in this period
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CREATORS TAB */}
        <TabsContent value="creators" className="space-y-6">
          <LeaderboardCard
            title="Top Creators by Engagement"
            description="Creators ranked by total engagement in this project"
            data={data.creators?.map((c: any) => ({
              creatorName: c.name || 'Unknown Creator',
              totalEngagement: c.engagement || 0,
              totalImpressions: c.totalImpressions || 0,
              postCount: c.posts || 0,
              avgEngagementRate: c.engagementRate || 0,
            })) || []}
            metric="engagement"
          />

          <Card>
            <CardHeader>
              <CardTitle>Creator Performance Details</CardTitle>
              <CardDescription>Detailed breakdown by creator</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.creators?.slice(0, 10).map((creator: any, index: number) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div>
                      <div className="font-medium">{creator.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {creator.posts} posts • {creator.engagementRate?.toFixed(1)}% engagement rate
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(creator.engagement)}</div>
                      <div className="text-xs text-muted-foreground">Total Engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOP POSTS TAB */}
        <TabsContent value="top-posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Performing Posts</CardTitle>
              <CardDescription>Top posts by engagement in this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topPosts?.map((post: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{post.creatorName}</div>
                      {post.caption && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.caption}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatNumber(post.likes)} likes</span>
                        <span>{formatNumber(post.retweets)} retweets</span>
                        <span>{formatNumber(post.replies)} replies</span>
                        <span>{formatNumber(post.impressions)} impressions</span>
                        <span className="font-medium text-green-600">
                          {post.engagementRate?.toFixed(1)}% rate
                        </span>
                      </div>
                    </div>
                    {post.postUrl && (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        View Post
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

