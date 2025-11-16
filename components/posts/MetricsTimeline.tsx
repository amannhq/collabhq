'use client';

import { formatDistanceToNow } from 'date-fns';
import { Calendar, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TimelineEvent {
  type: 'created' | 'approved' | 'rejected' | 'metrics_updated';
  date: Date | string;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
}

interface MetricsTimelineProps {
  events: TimelineEvent[];
}

export function MetricsTimeline({ events }: MetricsTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'metrics_updated':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'border-blue-200 bg-blue-50';
      case 'approved':
        return 'border-green-200 bg-green-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'metrics_updated':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>No activity recorded</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent activity for this post</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {events.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Icon */}
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-background">
                {getIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div
                  className={`rounded-lg border p-4 ${getEventColor(
                    event.type
                  )}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.date), {
                        addSuffix: true,
                      })}
                    </time>
                  </div>

                  {/* Additional data */}
                  {event.data && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {event.data.likes !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Likes:</span>{' '}
                            <span className="font-medium">{(event.data as { likes?: number })?.likes || 0}</span>
                          </div>
                        )}
                        {event.data.retweets !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Retweets:</span>{' '}
                            <span className="font-medium">{(event.data as { retweets?: number })?.retweets || 0}</span>
                          </div>
                        )}
                        {event.data.replies !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Replies:</span>{' '}
                            <span className="font-medium">{(event.data as { replies?: number })?.replies || 0}</span>
                          </div>
                        )}
                        {event.data.impressions !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Views:</span>{' '}
                            <span className="font-medium">
                              {(event.data as { impressions?: number })?.impressions || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
