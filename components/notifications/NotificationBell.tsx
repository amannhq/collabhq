'use client';

import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationList } from './NotificationList';
import { Badge } from '@/components/ui/badge';
import { RealtimeIndicator } from '@/components/shared';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface NotificationBellProps {
  userId?: string;
  organizationId?: string;
}

export function NotificationBell({ userId, organizationId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    unreadCount,
    status,
    lastNotification,
    refreshUnreadCount,
    decrementUnread,
    resetUnread,
  } = useRealtimeNotifications({
    organizationId,
    enabled: Boolean(userId),
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen);
      if (nextOpen) {
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount]
  );

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" aria-label="Notification Center">
        <NotificationList
          realtimeRefreshToken={lastNotification?.id}
          onNotificationRead={() => decrementUnread()}
          onMarkAllRead={resetUnread}
        />
        <div className="border-t bg-[#f3f1ea] px-4 py-2">
          <RealtimeIndicator status={status} compact className="ml-auto" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
