'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  _id: string;
  type: 'metrics_updated' | 'post_submitted' | 'post_approved' | 'post_rejected';
  description: string;
  timestamp: string;
  metadata?: {
    postUrl?: string;
    metrics?: {
      likes?: number;
      retweets?: number;
      impressions?: number;
    };
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'metrics_updated':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'post_submitted':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'post_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'post_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'metrics_updated':
        return 'bg-blue-50';
      case 'post_submitted':
        return 'bg-purple-50';
      case 'post_approved':
        return 'bg-green-50';
      case 'post_rejected':
        return 'bg-red-50';
      default:
        return 'bg-zinc-50';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription className="text-xs">Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-900 mb-1">No recent activity</p>
            <p className="text-xs text-muted-foreground">Your activity will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity._id} className="flex gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <div className={`rounded-lg p-2 h-fit ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{activity.description}</p>
                    {activity.metadata?.postUrl && (
                      <a
                        href={activity.metadata.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-block"
                      >
                        View Post →
                      </a>
                    )}
                    {activity.metadata?.metrics && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {activity.metadata.metrics.likes !== undefined && (
                          <span className="font-medium">{activity.metadata.metrics.likes.toLocaleString()} likes</span>
                        )}
                        {activity.metadata.metrics.retweets !== undefined && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{activity.metadata.metrics.retweets.toLocaleString()} retweets</span>
                          </>
                        )}
                        {activity.metadata.metrics.impressions !== undefined && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{activity.metadata.metrics.impressions.toLocaleString()} impressions</span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
