'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface EngagementDataPoint {
  name: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions?: number;
}

interface EngagementChartProps {
  title: string;
  description?: string;
  data: EngagementDataPoint[];
}

export function EngagementChart({
  title,
  description,
  data,
}: EngagementChartProps) {
  const chartConfig = {
    likes: {
      label: 'Likes',
      color: 'hsl(var(--chart-1))',
    },
    retweets: {
      label: 'Retweets',
      color: 'hsl(var(--chart-2))',
    },
    replies: {
      label: 'Replies',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="likes" fill="var(--color-likes)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retweets" fill="var(--color-retweets)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="replies" fill="var(--color-replies)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
