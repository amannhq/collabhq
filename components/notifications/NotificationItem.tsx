'use client';

import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Bell,
  TrendingUp,
  Trophy,
  MessageSquare,
  UserPlus,
  Users,
  Folder,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const notificationIcons = {
  post_submitted: FileText,
  post_approved: CheckCircle2,
  post_rejected: XCircle,
  metrics_reminder: Bell,
  metrics_updated: TrendingUp,
  milestone_reached: Trophy,
  admin_message: MessageSquare,
  creator_invited: UserPlus,
  creator_joined: Users,
  project_created: Folder,
  weekly_report: BarChart3,
  system_alert: AlertCircle,
};

const priorityColors = {
  low: 'text-muted-foreground',
  normal: 'text-foreground',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();
  const Icon = notificationIcons[notification.type] || Bell;
  const isUnread = notification.status === 'unread';

  const handleClick = () => {
    // Mark as read if unread
    if (isUnread) {
      onMarkAsRead(notification._id.toString());
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        isUnread && 'bg-muted/30'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 mt-1',
          priorityColors[notification.priority]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              isUnread && 'font-semibold'
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <time className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </time>

          {notification.actionText && notification.actionUrl && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                {notification.actionText}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
