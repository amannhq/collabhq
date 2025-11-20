'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RealtimeMessage } from '@/types/realtime';
import { useRealtime, type ConnectionStatus } from './useRealtime';

interface UseRealtimeNotificationsOptions {
  organizationId?: string;
  enabled?: boolean;
  pollInterval?: number;
  initialUnreadCount?: number;
}

interface UseRealtimeNotificationsReturn {
  status: ConnectionStatus;
  unreadCount: number;
  lastNotification?: RealtimeMessage;
  refreshUnreadCount: () => Promise<number | null>;
  decrementUnread: (count?: number) => void;
  resetUnread: () => void;
  reconnect: () => void;
}

const DEFAULT_POLL_INTERVAL = 120000; // 2 minutes

export function useRealtimeNotifications({
  organizationId,
  enabled = true,
  pollInterval = DEFAULT_POLL_INTERVAL,
  initialUnreadCount = 0,
}: UseRealtimeNotificationsOptions = {}): UseRealtimeNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [lastNotification, setLastNotification] = useState<RealtimeMessage>();

  const refreshUnreadCount = useCallback(async (): Promise<number | null> => {
    try {
      const response = await fetch('/api/notifications?status=unread&count=true', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      const { data } = await response.json();
      const count = typeof data?.count === 'number' ? data.count : 0;
      setUnreadCount(count);
      return count;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Initial fetch of unread count
    void refreshUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, refreshUnreadCount]);

  const decrementUnread = useCallback((count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const realtime = useRealtime({
    organizationId,
    resources: ['notifications'],
    enabled,
    onEvent: (event) => {
      if (event.resource !== 'notifications') {
        return;
      }

      setLastNotification(event);

      if (event.action === 'created') {
        setUnreadCount((prev) => prev + 1);
      } else if (event.action === 'updated') {
        const nextStatus = (event.payload as { status?: string } | undefined)?.status;
        if (nextStatus === 'read' || nextStatus === 'archived') {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    },
  });

  return {
    status: realtime.status,
    unreadCount,
    lastNotification,
    refreshUnreadCount,
    decrementUnread,
    resetUnread,
    reconnect: realtime.reconnect,
  };
}

