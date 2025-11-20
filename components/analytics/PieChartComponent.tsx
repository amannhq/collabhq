'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartComponentProps {
  title: string;
  description?: string;
  data: PieDataPoint[];
  valueFormatter?: (value: number) => string;
}

const DEFAULT_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
];

function PieChartComponentImpl({
  title,
  description,
  data,
  valueFormatter = (value) => value.toLocaleString(),
}: PieChartComponentProps) {
  const enrichedData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom label renderer to only show percentage
  const renderLabel = (entry: any) => {
    const percent = entry.percent * 100;
    // Only show label if percentage is greater than 5% to avoid clutter
    if (percent < 5) return '';
    return `${percent.toFixed(0)}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-0">
        <div className="w-full">
          {/* Responsive Pie Chart */}
          <div className="h-[300px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0];
                    const value = typeof data.value === 'number' ? data.value : 0;
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';

                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: data.payload.color }}
                            />
                            <span className="font-medium">{data.name}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground text-sm">Value:</span>
                            <span className="font-mono font-medium">{valueFormatter(value)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground text-sm">Percentage:</span>
                            <span className="font-mono font-medium">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={enrichedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={0}
                  outerRadius="70%"
                  label={renderLabel}
                  labelLine={false}
                  paddingAngle={2}
                >
                  {enrichedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend - Shows names without duplication */}
          <div className="mt-6 space-y-2">
            {enrichedData.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div
                  key={`legend-${index}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm text-muted-foreground">{valueFormatter(item.value)}</span>
                    <span className="text-sm font-semibold min-w-[3rem] text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const PieChartComponent = React.memo(PieChartComponentImpl, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && prevProps.title === nextProps.title;
});

PieChartComponent.displayName = 'PieChartComponent';
