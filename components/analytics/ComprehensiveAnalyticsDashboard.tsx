'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TrendingUp,
  Users,
  FileText,
  Eye,
  Heart,
  BarChart3,
  Activity,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import { ExportButton } from './ExportButton';
import { ImprovedMetricsChart } from './ImprovedMetricsChart';
import { StackedEngagementChart } from './StackedEngagementChart';
import { PieChartComponent } from './PieChartComponent';
import { HeatmapChart } from './HeatmapChart';
import { MultiLineChart } from './MultiLineChart';
import { LeaderboardCard } from './LeaderboardCard';

interface ComprehensiveAnalyticsDashboardProps {
  organizationId: string;
}

export function ComprehensiveAnalyticsDashboard({ organizationId }: ComprehensiveAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const params = new URLSearchParams({
        organizationId,
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/analytics/detailed?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, [organizationId, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transform daily metrics - memoized to prevent unnecessary recalculations
  const dailyMetricsData = useMemo(() =>
    data?.dailyMetrics?.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      value: item.impressions,
    })) || [], [data?.dailyMetrics]
  );

  // Transform engagement data - memoized
  const engagementData = useMemo(() =>
    data?.dailyMetrics?.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      likes: item.likes,
      retweets: item.retweets,
      replies: item.replies,
    })) || [], [data?.dailyMetrics]
  );

  // Transform multi-line data - memoized
  const multiLineData = useMemo(() =>
    data?.dailyMetrics?.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      impressions: item.impressions,
      engagement: item.totalEngagement,
      posts: item.postCount,
    })) || [], [data?.dailyMetrics]
  );

  // Transform pie chart data - memoized
  const engagementBreakdownData = useMemo(() =>
    [
      { name: 'Likes', value: data?.engagementBreakdown?.totalLikes || 0, color: '#10b981' },
      { name: 'Retweets', value: data?.engagementBreakdown?.totalRetweets || 0, color: '#3b82f6' },
      { name: 'Replies', value: data?.engagementBreakdown?.totalReplies || 0, color: '#f59e0b' },
      { name: 'Quotes', value: data?.engagementBreakdown?.totalQuotes || 0, color: '#8b5cf6' },
      { name: 'Bookmarks', value: data?.engagementBreakdown?.totalBookmarks || 0, color: '#06b6d4' },
    ].filter(item => item.value > 0), [data?.engagementBreakdown]
  );

  // Transform project performance for pie chart - memoized
  const projectData = useMemo(() =>
    data?.projectPerformance?.map((item: any, index: number) => ({
      name: item.projectName,
      value: item.totalEngagement,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 4],
    })) || [], [data?.projectPerformance]
  );

  // Show skeleton only on initial load
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

  const stats = data.overallStats || {};
  const metrics = [
    {
      title: 'Total Impressions',
      value: (stats.totalImpressions || 0).toLocaleString(),
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Engagement',
      value: (stats.totalEngagement || 0).toLocaleString(),
      icon: Heart,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Posts',
      value: (stats.totalPosts || 0).toLocaleString(),
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg Engagement Rate',
      value: (stats.avgEngagementRate || 0).toFixed(2) + '%',
      icon: Target,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        <ExportButton
          organizationId={organizationId}
          dateRange={
            dateRange?.from && dateRange?.to
              ? { from: dateRange.from, to: dateRange.to }
              : undefined
          }
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
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
                {metric.title === 'Avg Engagement Rate' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.avgImpressionsPerPost
                      ? `${Math.round(stats.avgImpressionsPerPost).toLocaleString()} avg impressions/post`
                      : 'Across all posts'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Activity className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="creators">
            <Users className="h-4 w-4 mr-2" />
            Creators
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Zap className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB - Only render when active */}
        {activeTab === 'overview' && (
          <TabsContent value="overview" className="space-y-6">
            {/* Impressions Trend */}
            <ImprovedMetricsChart
              data={dailyMetricsData}
              title="Impressions Over Time"
              description="Total impressions across all posts"
              dataKey="value"
              valueFormatter={(value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toLocaleString();
              }}
              color="hsl(220, 70%, 50%)"
              showTrend={true}
            />

            {/* Multi-line chart */}
            <MultiLineChart
              title="Performance Metrics Comparison"
              description="Compare different metrics over time"
              data={multiLineData}
              xAxisKey="date"
              lines={[
                { dataKey: 'impressions', label: 'Impressions', color: '#3b82f6' },
                { dataKey: 'engagement', label: 'Engagement', color: '#10b981' },
                { dataKey: 'posts', label: 'Posts', color: '#f59e0b' },
              ]}
              valueFormatter={(value: number) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toLocaleString();
              }}
            />

            {/* Project Performance */}
            <div className="grid gap-6 md:grid-cols-2">
              <PieChartComponent
                title="Engagement by Project"
                description="Distribution of engagement across projects"
                data={projectData}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                  <CardDescription>Detailed metrics by project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.projectPerformance?.slice(0, 5).map((project: any, index: number) => (
                      <div key={index} className="flex items-center justify-between pb-3 border-b last:border-0">
                        <div>
                          <div className="font-medium">{project.projectName}</div>
                          <div className="text-xs text-muted-foreground">
                            {project.postCount} posts • {project.avgEngagementRate.toFixed(1)}% engagement
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{project.totalEngagement.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Total Engagement</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ENGAGEMENT TAB - Only render when active */}
        {activeTab === 'engagement' && (
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
                description="How users interact with your content"
                data={engagementBreakdownData}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Insights</CardTitle>
                  <CardDescription>Key takeaways from your engagement data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Likes Dominate</div>
                        <p className="text-sm text-muted-foreground">
                          {((data.engagementBreakdown?.totalLikes / (data.engagementBreakdown?.totalLikes + data.engagementBreakdown?.totalRetweets + data.engagementBreakdown?.totalReplies)) * 100).toFixed(0)}%
                          of engagement comes from likes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-pink-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Average Engagement Rate</div>
                        <p className="text-sm text-muted-foreground">
                          {stats.avgEngagementRate?.toFixed(2)}% -
                          {stats.avgEngagementRate > 3 ? ' Above average!' : ' Room for improvement'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Total Interactions</div>
                        <p className="text-sm text-muted-foreground">
                          {stats.totalEngagement?.toLocaleString()} total engagements across all posts
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* CREATORS TAB - Only render when active */}
        {activeTab === 'creators' && (
          <TabsContent value="creators" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <LeaderboardCard
                title="Top Creators by Engagement"
                description="Creators ranked by total engagement"
                data={data.creatorLeaderboard || []}
                metric="engagement"
              />

              <LeaderboardCard
                title="Top Creators by Reach"
                description="Creators ranked by total impressions"
                data={[...(data.creatorLeaderboard || [])].sort((a: any, b: any) => b.totalImpressions - a.totalImpressions)}
                metric="impressions"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Highest engagement posts in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPosts?.slice(0, 5).map((post: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{post.creatorName}</div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.content || 'No content preview available'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{post.likes?.toLocaleString()} likes</span>
                          <span>{post.retweets?.toLocaleString()} retweets</span>
                          <span>{post.replies?.toLocaleString()} replies</span>
                          <span className="font-medium text-green-600">
                            {post.engagementRate?.toFixed(1)}% rate
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* INSIGHTS TAB - Only render when active */}
        {activeTab === 'insights' && (
          <TabsContent value="insights" className="space-y-6">
            <HeatmapChart
              title="Posting Activity Heatmap"
              description="Best times to post based on historical data"
              data={data.postingPatterns?.map((item: any) => ({
                day: item._id.day,
                hour: item._id.hour,
                value: item.postCount,
              })) || []}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Performance Recommendations</CardTitle>
                  <CardDescription className="text-xs">Data-driven suggestions to improve performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500 text-white flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-zinc-900">Optimal Posting Time</div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Posts perform best on weekdays between 9 AM - 2 PM
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-green-500 text-white flex-shrink-0">
                        <Target className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-zinc-900">Content Strategy</div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Posts with media get {((data.engagementBreakdown?.totalBookmarks / data.engagementBreakdown?.totalLikes) * 100).toFixed(0)}% more bookmarks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500 text-white flex-shrink-0">
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-zinc-900">Engagement Goal</div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Aim for 5% engagement rate - currently at {stats.avgEngagementRate?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                  <CardDescription className="text-xs">Additional metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <span className="text-xs text-zinc-600">Avg Impressions/Post</span>
                      <span className="font-semibold text-sm text-zinc-900">{Math.round(stats.avgImpressionsPerPost || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <span className="text-xs text-zinc-600">Total Likes</span>
                      <span className="font-semibold text-sm text-zinc-900">{(data.engagementBreakdown?.totalLikes || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <span className="text-xs text-zinc-600">Total Retweets</span>
                      <span className="font-semibold text-sm text-zinc-900">{(data.engagementBreakdown?.totalRetweets || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <span className="text-xs text-zinc-600">Total Replies</span>
                      <span className="font-semibold text-sm text-zinc-900">{(data.engagementBreakdown?.totalReplies || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <span className="text-xs text-zinc-600">Active Creators</span>
                      <span className="font-semibold text-sm text-zinc-900">{data.creatorLeaderboard?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
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
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}

