'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface GrowthDataPoint {
  date: string;
  current: number;
  previous?: number;
}

interface GrowthChartProps {
  title: string;
  description?: string;
  data: GrowthDataPoint[];
  showComparison?: boolean;
}

export function GrowthChart({
  title,
  description,
  data,
  showComparison = false,
}: GrowthChartProps) {
  const chartConfig = {
    current: {
      label: 'Current Period',
      color: 'hsl(var(--chart-1))',
    },
    previous: {
      label: 'Previous Period',
      color: 'hsl(var(--chart-2))',
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
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-current)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-current)" stopOpacity={0} />
                </linearGradient>
                {showComparison && (
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-previous)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-previous)" stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
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
              <Area
                type="monotone"
                dataKey="current"
                stroke="var(--color-current)"
                fill="url(#colorCurrent)"
                strokeWidth={2}
              />
              {showComparison && (
                <Area
                  type="monotone"
                  dataKey="previous"
                  stroke="var(--color-previous)"
                  fill="url(#colorPrevious)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
