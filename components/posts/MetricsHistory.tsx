'use client';

import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsData {
  _id: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  growth?: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  recordedAt: string | Date;
}

interface MetricsHistoryProps {
  metrics: MetricsData[];
}

export function MetricsHistory({ metrics }: MetricsHistoryProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getGrowthIcon = (growth?: number) => {
    if (!growth) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getGrowthColor = (growth?: number) => {
    if (!growth) return 'text-muted-foreground';
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metrics History</CardTitle>
          <CardDescription>No metrics recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Metrics will appear here once they are updated.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics History</CardTitle>
        <CardDescription>
          {metrics.length} update{metrics.length !== 1 ? 's' : ''} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Retweets</TableHead>
                <TableHead className="text-right">Replies</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {format(new Date(record.recordedAt), 'PPp')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatNumber(record.metrics.likes)}</span>
                      {record.growth && (
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(record.growth.likes)}
                          <span
                            className={`text-xs ${getGrowthColor(
                              record.growth.likes
                            )}`}
                          >
                            {record.growth.likes > 0 ? '+' : ''}
                            {formatNumber(record.growth.likes)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatNumber(record.metrics.retweets)}</span>
                      {record.growth && (
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(record.growth.retweets)}
                          <span
                            className={`text-xs ${getGrowthColor(
                              record.growth.retweets
                            )}`}
                          >
                            {record.growth.retweets > 0 ? '+' : ''}
                            {formatNumber(record.growth.retweets)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatNumber(record.metrics.replies)}</span>
                      {record.growth && (
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(record.growth.replies)}
                          <span
                            className={`text-xs ${getGrowthColor(
                              record.growth.replies
                            )}`}
                          >
                            {record.growth.replies > 0 ? '+' : ''}
                            {formatNumber(record.growth.replies)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatNumber(record.metrics.impressions)}</span>
                      {record.growth && (
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(record.growth.impressions)}
                          <span
                            className={`text-xs ${getGrowthColor(
                              record.growth.impressions
                            )}`}
                          >
                            {record.growth.impressions > 0 ? '+' : ''}
                            {formatNumber(record.growth.impressions)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
