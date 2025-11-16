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
  timestamp: Date;
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
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'post_submitted':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'post_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'post_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'metrics_updated':
        return 'bg-blue-500/10';
      case 'post_submitted':
        return 'bg-purple-500/10';
      case 'post_approved':
        return 'bg-green-500/10';
      case 'post_rejected':
        return 'bg-red-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  <div className={`rounded-full p-2 h-fit ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    {activity.metadata?.postUrl && (
                      <a
                        href={activity.metadata.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        View Post
                      </a>
                    )}
                    {activity.metadata?.metrics && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.metadata.metrics.likes && (
                          <span>{activity.metadata.metrics.likes} likes</span>
                        )}
                        {activity.metadata.metrics.retweets && (
                          <span>• {activity.metadata.metrics.retweets} retweets</span>
                        )}
                        {activity.metadata.metrics.impressions && (
                          <span>• {activity.metadata.metrics.impressions} impressions</span>
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
