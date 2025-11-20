'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface EngagementDataPoint {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
  total?: number;
}

interface StackedEngagementChartProps {
  title: string;
  description?: string;
  data: EngagementDataPoint[];
  stacked?: boolean;
}

function StackedEngagementChartComponent({
  title,
  description,
  data,
  stacked = true,
}: StackedEngagementChartProps) {
  // Add total engagement to each data point
  const enrichedData = data.map(item => ({
    ...item,
    total: item.likes + item.retweets + item.replies,
  }));

  const chartConfig = {
    likes: {
      label: 'Likes',
      color: '#10b981', // green-500
    },
    retweets: {
      label: 'Retweets',
      color: '#3b82f6', // blue-500
    },
    replies: {
      label: 'Replies',
      color: '#f59e0b', // amber-500
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-[1200px]">
          <BarChart data={enrichedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="date"
              className="text-xs"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              className="text-xs"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}k`;
                }
                return value.toString();
              }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
            />
            <Legend />
            <Bar
              dataKey="likes"
              fill="var(--color-likes)"
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "a" : undefined}
            />
            <Bar
              dataKey="retweets"
              fill="var(--color-retweets)"
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "a" : undefined}
            />
            <Bar
              dataKey="replies"
              fill="var(--color-replies)"
              radius={stacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "a" : undefined}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders
export const StackedEngagementChart = React.memo(StackedEngagementChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.title === nextProps.title &&
    prevProps.stacked === nextProps.stacked
  );
});

StackedEngagementChart.displayName = 'StackedEngagementChart';
