'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { TrendingUp, TrendingDown, Users, FileText, Eye, Heart } from 'lucide-react';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ProjectAnalyticsProps {
  projectId: string;
  organizationId: string;
}

export function ProjectAnalytics({ projectId, organizationId }: ProjectAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [metrics, setMetrics] = useState({
    totalPosts: 0,
    totalEngagement: 0,
    totalImpressions: 0,
    avgEngagementRate: 0,
    postsGrowth: 0,
    engagementGrowth: 0,
  });
  const [timelineData, setTimelineData] = useState([]);
  const [creatorsData, setCreatorsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dateRange]);

  async function fetchAnalytics() {
    setIsLoading(true);
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
        setMetrics(result.data.metrics || {});
        setTimelineData(result.data.timeline || []);
        setCreatorsData(result.data.creators || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
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
            value: metrics.totalPosts.toLocaleString(),
            change: metrics.postsGrowth,
            icon: FileText,
          },
          {
            title: 'Total Engagement',
            value: metrics.totalEngagement.toLocaleString(),
            change: metrics.engagementGrowth,
            icon: Heart,
          },
          {
            title: 'Total Impressions',
            value: (metrics.totalImpressions / 1000).toFixed(1) + 'K',
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
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
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

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Comparison</CardTitle>
              <CardDescription>
                Compare this project with others in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <p>Comparison feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
