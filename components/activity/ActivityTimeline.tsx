'use client';

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import {
  ActivitySquare,
  AlertCircle,
  Bell,
  Building,
  CircleDot,
  FileText,
  MailPlus,
  UserRound,
  Workflow,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ActivityLogResponseDto } from '@/types/activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const entityIconMap: Record<string, ElementType> = {
  user: UserRound,
  organization: Building,
  project: Workflow,
  post: FileText,
  metrics: ActivitySquare,
  invitation: MailPlus,
  notification: Bell,
  default: CircleDot,
};

const severityBadgeStyles: Record<
  ActivityLogResponseDto['severity'],
  string
> = {
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-red-50 text-red-700 border-red-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
};

interface ActivityTimelineProps {
  logs: ActivityLogResponseDto[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const formatLabel = (value?: string | null) => {
  if (!value) {
    return '';
  }
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function ActivityTimeline({
  logs,
  isLoading,
  error,
  onRetry,
  className,
}: ActivityTimelineProps) {
  const [selectedLog, setSelectedLog] = useState<ActivityLogResponseDto | null>(
    null,
  );

  const timelineItems = useMemo(() => logs ?? [], [logs]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <LoadingSpinner text="Loading recent activity..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <EmptyState
            icon={AlertCircle}
            title="Unable to load activity"
            description={error}
            action={
              onRetry
                ? {
                    label: 'Try again',
                    onClick: onRetry,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  if (!timelineItems.length) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <EmptyState
            icon={CircleDot}
            title="No activity yet"
            description="All actions from admins, creators, and automations will appear here as soon as they happen."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-3xl font-serif font-normal tracking-tight">
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[720px] pr-4">
            <div className="space-y-6">
              {timelineItems.map((log, index) => {
                const Icon =
                  entityIconMap[log.entityType] ?? entityIconMap.default ?? CircleDot;
                const severityStyle = severityBadgeStyles[log.severity] ?? severityBadgeStyles.info;
                return (
                  <div key={log._id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg"
                        aria-hidden="true"
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < timelineItems.length - 1 && (
                        <div className="mt-2 w-px flex-1 bg-zinc-200" />
                      )}
                    </div>
                    <div className="flex-1 rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                            <span>{log.userName}</span>
                            <span aria-hidden="true">•</span>
                            <span className="capitalize">{log.userRole}</span>
                            <span aria-hidden="true">•</span>
                            <span>
                              {formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="mt-2 text-lg font-medium text-zinc-900">
                            {log.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {formatLabel(log.action)}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {log.entityType}
                            </Badge>
                            {log.metadata?.success === false && (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                            {log.projectName && (
                              <Badge variant="outline">
                                Project: {log.projectName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <Badge className={severityStyle}>
                            {formatLabel(log.severity)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setSelectedLog(log)}
                          >
                            View details
                          </Button>
                        </div>
                      </div>
                      {log.tags && log.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {log.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-zinc-100 text-zinc-700">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-normal">
                  {formatLabel(selectedLog.action)}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedLog.createdAt), 'PPpp')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Actor
                    </p>
                    <p className="font-medium text-zinc-900">
                      {selectedLog.userName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.userEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Entity
                    </p>
                    <p className="font-medium text-zinc-900">
                      {selectedLog.entityName ?? formatLabel(selectedLog.entityType)}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedLog.entityType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Outcome
                    </p>
                    <p className="font-medium text-zinc-900">
                      {selectedLog.metadata?.success ? 'Success' : 'Failed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Severity
                    </p>
                    <Badge className={severityBadgeStyles[selectedLog.severity]}>
                      {formatLabel(selectedLog.severity)}
                    </Badge>
                  </div>
                </section>

                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <section>
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      Changes
                    </p>
                    <div className="space-y-3 rounded-xl border border-zinc-200/60 bg-zinc-50 p-4">
                      {selectedLog.changes.map((change) => (
                        <div key={change.field} className="text-sm">
                          <p className="font-medium text-zinc-900">{change.field}</p>
                          <p className="text-xs text-muted-foreground">
                            {JSON.stringify(change.oldValue)} →{' '}
                            {JSON.stringify(change.newValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedLog.request && (
                  <section className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        IP Address
                      </p>
                      <p className="text-sm text-zinc-900">
                        {selectedLog.request.ipAddress || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        User Agent
                      </p>
                      <p className="text-sm text-zinc-900">
                        {selectedLog.request.userAgent || '—'}
                      </p>
                    </div>
                  </section>
                )}

                {selectedLog.tags && selectedLog.tags.length > 0 && (
                  <section>
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

