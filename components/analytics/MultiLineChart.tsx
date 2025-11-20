'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  label: string;
  color: string;
  strokeWidth?: number;
}

interface MultiLineChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  valueFormatter?: (value: number) => string;
}

function MultiLineChartComponent({
  title,
  description,
  data,
  lines,
  xAxisKey,
  valueFormatter = (value) => value.toLocaleString(),
}: MultiLineChartProps) {
  const chartConfig = lines.reduce((acc, line) => {
    acc[line.dataKey] = {
      label: line.label,
      color: line.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-[400px] w-full max-w-[1200px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey={xAxisKey}
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
              tickFormatter={valueFormatter}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={line.strokeWidth || 2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const MultiLineChart = React.memo(MultiLineChartComponent, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && prevProps.title === nextProps.title;
});

MultiLineChart.displayName = 'MultiLineChart';
