'use client';

import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  Heart,
  BarChart3,
  Activity,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from './DateRangePicker';
import { ExportButton } from './ExportButton';
import {
  EngagementOverTimeChart,
  PostsByProjectChart,
  TopCreatorsChart,
  GrowthTrendsChart,
} from './charts';

interface AnalyticsDashboardProps {
  organizationId: string;
}

interface MetricCardData {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  description: string;
}

export function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const [metrics, setMetrics] = useState<MetricCardData[]>([]);

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, organizationId]);

  const loadMetrics = async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/analytics/organization?${params}`);
      const result = await response.json();
      const data = result?.data || {};

      // Set metrics with default values
      setMetrics([
        {
          title: 'Total Posts',
          value: (data.totalPosts || 0).toLocaleString(),
          change: data.postsGrowth || 0,
          icon: FileText,
          description: 'Posts published in period',
        },
        {
          title: 'Active Creators',
          value: (data.activeCreators || 0).toLocaleString(),
          change: data.creatorsGrowth || 0,
          icon: Users,
          description: 'Creators with activity',
        },
        {
          title: 'Total Impressions',
          value: ((data.totalImpressions || 0) / 1000).toFixed(1) + 'K',
          change: data.impressionsGrowth || 0,
          icon: Eye,
          description: 'Cumulative reach',
        },
        {
          title: 'Engagement Rate',
          value: (data.avgEngagementRate || 0).toFixed(2) + '%',
          change: data.engagementGrowth || 0,
          icon: Heart,
          description: 'Average across posts',
        },
      ]);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
          const isPositive = metric.change >= 0;

          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={isPositive ? 'text-green-600' : 'text-red-600'}
                  >
                    {isPositive ? '+' : ''}
                    {metric.change.toFixed(1)}%
                  </span>
                  <span className="ml-1">{metric.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Posts by Project</CardTitle>
                <CardDescription>
                  Distribution of posts across projects
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <PostsByProjectChart
                  organizationId={organizationId}
                  dateRange={dateRange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Creators</CardTitle>
                <CardDescription>
                  Creators ranked by total engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <TopCreatorsChart
                  organizationId={organizationId}
                  dateRange={dateRange}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>
                Posts, creators, and engagement over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <GrowthTrendsChart
                organizationId={organizationId}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>
                Likes, comments, and shares trends
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <EngagementOverTimeChart
                organizationId={organizationId}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Creators with highest engagement rates
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <TopCreatorsChart
                  organizationId={organizationId}
                  dateRange={dateRange}
                  sortBy="engagement"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active</CardTitle>
                <CardDescription>
                  Creators with most posts published
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <TopCreatorsChart
                  organizationId={organizationId}
                  dateRange={dateRange}
                  sortBy="posts"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
