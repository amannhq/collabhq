'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EngagementData {
  date: string;
  engagement: number;
}

interface EngagementChart30DaysProps {
  data: EngagementData[];
  totalEngagement: number;
  averageEngagement: number;
}

export function EngagementChart30Days({ data, totalEngagement, averageEngagement }: EngagementChart30DaysProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-lg font-normal">30-Day Engagement</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-semibold">{formatNumber(totalEngagement)}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Daily Avg</p>
            <p className="text-2xl font-semibold text-emerald-600">{formatNumber(Math.round(averageEngagement))}</p>
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#d1d5db"
                  tickLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#d1d5db"
                  tickLine={false}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '6px 10px',
                    boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)',
                  }}
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                  formatter={(value: number) => [formatNumber(value), 'Engagement']}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-10" />
              <p className="font-medium">No engagement data available</p>
              <p className="text-sm mt-1">Start posting to see your trend</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
