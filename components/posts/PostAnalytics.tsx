'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ThumbsUp,
  Repeat2,
  MessageCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import Link from 'next/link';

interface PostAnalyticsProps {
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

const COLORS = {
  likes: 'hsl(var(--chart-1))',
  retweets: 'hsl(var(--chart-2))',
  replies: 'hsl(var(--chart-3))',
  impressions: 'hsl(var(--chart-4))',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export function PostAnalytics({ postId, organizationId, orgSlug }: PostAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, dateRange]);

  async function fetchAnalytics() {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  if (isLoading) {
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

  const chartData = data.engagementOverTime.map(point => ({
    date: format(new Date(point.date), 'MMM dd'),
    Likes: point.likes,
    Retweets: point.retweets,
    Replies: point.replies,
    Impressions: point.impressions,
    'Total Engagement': point.engagement,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Post Analytics</h2>
          <p className="text-muted-foreground">Detailed performance metrics and insights</p>
        </div>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.currentMetrics.totalEngagement)}</div>
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
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.currentMetrics.impressions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.currentMetrics.engagementRate.toFixed(2)}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.insights.avgEngagement)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              per data point
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benchmark</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.insights.performanceBenchmark}</div>
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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics Over Time</CardTitle>
              <CardDescription>
                Track how your post performance evolved
                {dateRange && ' (filtered period)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Total Engagement"
                      stroke={COLORS.likes}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Impressions"
                      stroke={COLORS.impressions}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>
                Individual engagement metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.likes} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.likes} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRetweets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.retweets} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.retweets} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.replies} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.replies} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Likes"
                      stroke={COLORS.likes}
                      fillOpacity={1}
                      fill="url(#colorLikes)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Retweets"
                      stroke={COLORS.retweets}
                      fillOpacity={1}
                      fill="url(#colorRetweets)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Replies"
                      stroke={COLORS.replies}
                      fillOpacity={1}
                      fill="url(#colorReplies)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>
                  Breakdown by engagement type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pieChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No engagement data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

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
    </div>
  );
}
