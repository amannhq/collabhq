'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

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

function GrowthChartComponent({
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
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-[1200px]">
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const GrowthChart = React.memo(GrowthChartComponent, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && prevProps.title === nextProps.title;
});

GrowthChart.displayName = 'GrowthChart';
