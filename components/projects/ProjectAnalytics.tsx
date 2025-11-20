'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, Eye, Heart, Info } from 'lucide-react';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { DateRange } from 'react-day-picker';

interface ProjectAnalyticsProps {
  projectId: string;
  organizationId: string;
}

const ENGAGEMENT_COLORS = {
  likes: '#3b82f6',
  retweets: '#10b981',
  replies: '#f59e0b',
};

export function ProjectAnalytics({ projectId, organizationId }: ProjectAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [metrics, setMetrics] = useState({
    totalPosts: 0,
    totalEngagement: 0,
    totalImpressions: 0,
    avgEngagementRate: 0,
    postsGrowth: 0,
    engagementGrowth: 0,
  });
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [creatorsData, setCreatorsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dateRange]);

  async function fetchAnalytics() {
    setIsLoading(true);
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
        setMetrics(result.data.metrics || {
          totalPosts: 0,
          totalEngagement: 0,
          totalImpressions: 0,
          avgEngagementRate: 0,
          postsGrowth: 0,
          engagementGrowth: 0,
        });
        setTimelineData(result.data.timeline || []);
        setCreatorsData(result.data.creators || []);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Calculate engagement breakdown for pie chart
  const engagementBreakdown = timelineData.reduce(
    (acc, point) => {
      // Assuming the data has individual engagement types
      return acc;
    },
    { likes: 0, retweets: 0, replies: 0 }
  );

  if (error) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Total Posts',
            value: formatNumber(metrics.totalPosts),
            change: metrics.postsGrowth,
            icon: FileText,
          },
          {
            title: 'Total Engagement',
            value: formatNumber(metrics.totalEngagement),
            change: metrics.engagementGrowth,
            icon: Heart,
          },
          {
            title: 'Total Impressions',
            value: formatNumber(metrics.totalImpressions),
            change: 0,
            icon: Eye,
          },
          {
            title: 'Avg Engagement Rate',
            value: metrics.avgEngagementRate.toFixed(2) + '%',
            change: 0,
            icon: TrendingUp,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;

          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
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

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>
                Track posts and engagement trends for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : timelineData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
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
                      dataKey="posts"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorPosts)"
                      name="Posts"
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorEngagement)"
                      name="Engagement"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creator Performance</CardTitle>
              <CardDescription>
                Compare engagement across creators in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : creatorsData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" />
                  <p>No creator data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={creatorsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="posts"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 8, 8, 0]}
                      name="Posts"
                    />
                    <Bar
                      dataKey="engagement"
                      fill="hsl(var(--chart-2))"
                      radius={[0, 8, 8, 0]}
                      name="Engagement"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Engagement Rate Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate Trend</CardTitle>
                <CardDescription>
                  How engagement rate changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : timelineData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
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
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Engagement"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  Performance summary for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <p className="text-sm font-medium">Average Posts Per Period</p>
                      <p className="text-xs text-muted-foreground">Based on timeline data</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {timelineData.length > 0
                        ? Math.round(metrics.totalPosts / timelineData.length)
                        : 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <p className="text-sm font-medium">Avg Engagement Per Post</p>
                      <p className="text-xs text-muted-foreground">Total engagement / posts</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {metrics.totalPosts > 0
                        ? formatNumber(Math.round(metrics.totalEngagement / metrics.totalPosts))
                        : 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <p className="text-sm font-medium">Active Creators</p>
                      <p className="text-xs text-muted-foreground">Contributing to project</p>
                    </div>
                    <p className="text-2xl font-bold">{creatorsData.length}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Growth Status</p>
                      <p className="text-xs text-muted-foreground">Compared to previous period</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {metrics.engagementGrowth >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <p className={`text-2xl font-bold ${metrics.engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.engagementGrowth >= 0 ? '+' : ''}
                        {metrics.engagementGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed breakdown of project performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Post Frequency</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.totalPosts)}</p>
                  <div className="flex items-center gap-1 text-sm">
                    {metrics.postsGrowth >= 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">+{metrics.postsGrowth.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">{metrics.postsGrowth.toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs previous</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Reach</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.totalImpressions)}</p>
                  <p className="text-sm text-muted-foreground">Total impressions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Engagement Quality</p>
                  <p className="text-3xl font-bold">{metrics.avgEngagementRate.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Average rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
