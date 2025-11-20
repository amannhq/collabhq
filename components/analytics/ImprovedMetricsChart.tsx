'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
  previousValue?: number;
}

interface ImprovedMetricsChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  dataKey?: string;
  valueFormatter?: (value: number) => string;
  color?: string;
  showTrend?: boolean;
  showComparison?: boolean;
  chartHeight?: string;
}

function ImprovedMetricsChartComponent({
  title,
  description,
  data,
  dataKey = 'value',
  valueFormatter = (value) => value.toLocaleString(),
  color = 'hsl(var(--primary))',
  showTrend = true,
  showComparison = false,
  chartHeight = '300px',
}: ImprovedMetricsChartProps) {
  const chartConfig = {
    [dataKey]: {
      label: title,
      color: color,
    },
    previousValue: {
      label: 'Previous Period',
      color: 'hsl(var(--muted-foreground))',
    },
  };

  // Calculate trend
  const calculateTrend = () => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };

    const recentValues = data.slice(-7); // Last 7 days
    const olderValues = data.slice(-14, -7); // Previous 7 days

    if (recentValues.length === 0 || olderValues.length === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    const recentAvg = recentValues.reduce((sum, d) => sum + (d.value || 0), 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, d) => sum + (d.value || 0), 0) / olderValues.length;

    if (olderAvg === 0) return { direction: 'stable', percentage: 0 };

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    return {
      direction: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable',
      percentage: Math.abs(percentChange),
    };
  };

  const trend = showTrend ? calculateTrend() : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.direction === 'up' && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{trend.percentage.toFixed(1)}%</span>
                </div>
              )}
              {trend.direction === 'down' && (
                <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span>-{trend.percentage.toFixed(1)}%</span>
                </div>
              )}
              {trend.direction === 'stable' && (
                <div className="flex items-center gap-1 text-sm font-medium text-zinc-600">
                  <Minus className="h-4 w-4" />
                  <span>Stable</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="w-full max-w-[1200px]" style={{ height: chartHeight }}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
              {showComparison && (
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.02} />
                </linearGradient>
              )}
            </defs>
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
              tickFormatter={valueFormatter}
              tickMargin={8}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            {showComparison && (
              <Area
                type="monotone"
                dataKey="previousValue"
                stroke="hsl(var(--muted-foreground))"
                fill="url(#colorPrevious)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`url(#color-${dataKey})`}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
            {showComparison && <Legend />}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders
export const ImprovedMetricsChart = React.memo(ImprovedMetricsChartComponent, (prevProps, nextProps) => {
  // Only re-render if data, title, or key props change
  return (
    prevProps.data === nextProps.data &&
    prevProps.title === nextProps.title &&
    prevProps.dataKey === nextProps.dataKey &&
    prevProps.color === nextProps.color
  );
});

ImprovedMetricsChart.displayName = 'ImprovedMetricsChart';
