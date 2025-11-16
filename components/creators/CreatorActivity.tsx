'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  _id: string;
  type: 'post_submitted' | 'post_approved' | 'post_rejected' | 'notification_sent' | 'metrics_updated';
  description: string;
  timestamp: Date;
  metadata?: {
    postId?: string;
    postUrl?: string;
    projectName?: string;
    adminName?: string;
    metricChange?: number;
  };
}

interface CreatorActivityProps {
  activities: ActivityItem[];
}

export function CreatorActivity({ activities }: CreatorActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_submitted':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'post_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'post_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'notification_sent':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'metrics_updated':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'post_submitted':
        return <Badge variant="outline">Submitted</Badge>;
      case 'post_approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'post_rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'notification_sent':
        return <Badge variant="secondary">Notification</Badge>;
      case 'metrics_updated':
        return <Badge variant="default">Metrics</Badge>;
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="flex gap-4 pb-4 border-b last:border-0"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="rounded-full bg-muted p-2">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none mb-1">
                        {activity.description}
                      </p>
                      {activity.metadata && (
                        <div className="text-xs text-muted-foreground space-y-1 mt-2">
                          {activity.metadata.projectName && (
                            <p>Project: {activity.metadata.projectName}</p>
                          )}
                          {activity.metadata.adminName && (
                            <p>By: {activity.metadata.adminName}</p>
                          )}
                          {activity.metadata.postUrl && (
                            <a
                              href={activity.metadata.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline block truncate max-w-md"
                            >
                              {activity.metadata.postUrl}
                            </a>
                          )}
                          {activity.metadata.metricChange !== undefined && (
                            <div className="flex items-center gap-1">
                              {activity.metadata.metricChange >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span
                                className={
                                  activity.metadata.metricChange >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {activity.metadata.metricChange >= 0 ? '+' : ''}
                                {activity.metadata.metricChange}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getActivityBadge(activity.type)}
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
