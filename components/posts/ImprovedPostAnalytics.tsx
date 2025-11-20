'use client';

import { useEffect, useState, useCallback } from 'react';
import { addDays, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import Link from 'next/link';
import {
  ThumbsUp,
  Repeat2,
  MessageCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ExternalLink,
  Activity,
  Target,
  Edit,
} from 'lucide-react';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { ImprovedMetricsChart } from '@/components/analytics/ImprovedMetricsChart';
import { StackedEngagementChart } from '@/components/analytics/StackedEngagementChart';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { UpdateMetricsModal } from '@/components/admin/UpdateMetricsModal';

interface ImprovedPostAnalyticsProps {
  postId: string;
  organizationId: string;
  orgSlug: string;
}

interface PostData {
  _id: string;
  postUrl: string;
  caption: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  projectName: string;
  creatorName: string;
  creatorEmail: string;
  creatorHandle?: string;
}

interface Metrics {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  totalEngagement: number;
  engagementRate: number;
}

interface EngagementBreakdown {
  likes: number;
  retweets: number;
  replies: number;
  likesPercent: number;
  retweetsPercent: number;
  repliesPercent: number;
}

interface EngagementDataPoint {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  engagement: number;
  growth: number;
}

interface Insights {
  totalDataPoints: number;
  overallGrowth: number;
  maxEngagement: number;
  avgEngagement: number;
  comparisonVsProjectAvg: number;
  performanceBenchmark: string;
}

interface AnalyticsData {
  post: PostData;
  currentMetrics: Metrics;
  engagementBreakdown: EngagementBreakdown;
  engagementOverTime: EngagementDataPoint[];
  insights: Insights;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export function ImprovedPostAnalytics({ postId, organizationId, orgSlug }: ImprovedPostAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        postId,
        organizationId,
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/analytics/post?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch post analytics:', error);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, [postId, organizationId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isInitialLoad) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load analytics data
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const pieChartData = [
    { name: 'Likes', value: data.engagementBreakdown.likes, color: PIE_COLORS[0] },
    { name: 'Retweets', value: data.engagementBreakdown.retweets, color: PIE_COLORS[1] },
    { name: 'Replies', value: data.engagementBreakdown.replies, color: PIE_COLORS[2] },
  ].filter(item => item.value > 0);

  // Transform data for charts
  const impressionsData = data.engagementOverTime.map(point => ({
    date: format(new Date(point.date), 'MMM dd'),
    value: point.impressions,
  }));

  const engagementData = data.engagementOverTime.map(point => ({
    date: format(new Date(point.date), 'MMM dd'),
    likes: point.likes,
    retweets: point.retweets,
    replies: point.replies,
  }));

  const totalEngagementData = data.engagementOverTime.map(point => ({
    date: format(new Date(point.date), 'MMM dd'),
    value: point.engagement,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Post Analytics</h2>
          <p className="text-muted-foreground">Detailed performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setMetricsModalOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Update Metrics
          </Button>
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
      </div>

      {/* Post Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Post Information</CardTitle>
              <CardDescription className="mt-2">
                Posted on {format(new Date(data.post.createdAt), 'MMMM dd, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig[data.post.status]?.variant || 'secondary'}>
                {statusConfig[data.post.status]?.label || data.post.status}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <a href={data.post.postUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.post.caption && (
            <div>
              <h4 className="text-sm font-medium mb-2">Caption</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.post.caption}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-4 border-t">
            <div>
              <span className="text-muted-foreground">Project</span>
              <p className="font-medium">{data.post.projectName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Creator</span>
              <p className="font-medium">{data.post.creatorName}</p>
            </div>
            {data.post.creatorHandle && (
              <div>
                <span className="text-muted-foreground">Handle</span>
                <p className="font-medium text-blue-600">@{data.post.creatorHandle}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
            <div className="bg-green-50 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatNumber(data.currentMetrics.totalEngagement)}</div>
            {data.insights.overallGrowth !== 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {data.insights.overallGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={data.insights.overallGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {data.insights.overallGrowth >= 0 ? '+' : ''}{data.insights.overallGrowth}%
                </span>
                <span className="ml-1">growth</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
            <div className="bg-purple-50 p-2 rounded-lg">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatNumber(data.currentMetrics.impressions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.currentMetrics.engagementRate.toFixed(2)}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Engagement</CardTitle>
            <div className="bg-blue-50 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatNumber(data.insights.avgEngagement)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              per data point
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Benchmark</CardTitle>
            <div className="bg-amber-50 p-2 rounded-lg">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{data.insights.performanceBenchmark}</div>
            {data.insights.comparisonVsProjectAvg !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.insights.comparisonVsProjectAvg >= 0 ? '+' : ''}
                {data.insights.comparisonVsProjectAvg.toFixed(1)}% vs project avg
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs with Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Activity className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <Target className="h-4 w-4 mr-2" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ImprovedMetricsChart
            data={impressionsData}
            title="Impressions Over Time"
            description="Total impressions for this post over time"
            dataKey="value"
            valueFormatter={(value: number) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toLocaleString();
            }}
            color="hsl(261, 70%, 50%)"
            showTrend={true}
          />

          <ImprovedMetricsChart
            data={totalEngagementData}
            title="Total Engagement Over Time"
            description="Combined engagement (likes + retweets + replies) over time"
            dataKey="value"
            valueFormatter={(value: number) => formatNumber(value)}
            color="hsl(142, 71%, 45%)"
            showTrend={true}
          />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <StackedEngagementChart
            data={engagementData}
            title="Engagement Breakdown Over Time"
            description="Individual engagement metrics (likes, retweets, replies)"
            stacked={false}
          />

          <Card>
            <CardHeader>
              <CardTitle>Engagement Insights</CardTitle>
              <CardDescription>Performance analysis for this post</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Overall Growth</div>
                    <p className="text-sm text-muted-foreground">
                      {data.insights.overallGrowth >= 0 ? '+' : ''}{data.insights.overallGrowth.toFixed(1)}% change in engagement
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Performance vs Project</div>
                    <p className="text-sm text-muted-foreground">
                      {data.insights.performanceBenchmark} - 
                      {data.insights.comparisonVsProjectAvg >= 0 ? ' +' : ' '}
                      {data.insights.comparisonVsProjectAvg.toFixed(1)}% compared to project average
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Peak Engagement</div>
                    <p className="text-sm text-muted-foreground">
                      Maximum {formatNumber(data.insights.maxEngagement)} engagements in a single period
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PieChartComponent
              title="Engagement Distribution"
              description="Breakdown by engagement type"
              data={pieChartData}
            />

            <Card>
              <CardHeader>
                <CardTitle>Current Metrics</CardTitle>
                <CardDescription>Latest engagement numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Likes</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {formatNumber(data.currentMetrics.likes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Retweets</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {formatNumber(data.currentMetrics.retweets)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Replies</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {formatNumber(data.currentMetrics.replies)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Impressions</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {formatNumber(data.currentMetrics.impressions)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/posts`}>
            Back to Posts
          </Link>
        </Button>
      </div>

      {/* Update Metrics Modal */}
      <UpdateMetricsModal
        open={metricsModalOpen}
        onOpenChange={setMetricsModalOpen}
        postId={postId}
        currentMetrics={{
          likes: data.currentMetrics.likes,
          retweets: data.currentMetrics.retweets,
          replies: data.currentMetrics.replies,
          impressions: data.currentMetrics.impressions,
        }}
        onSuccess={() => {
          // Refresh analytics data after successful update
          fetchAnalytics();
        }}
      />
    </div>
  );
}

