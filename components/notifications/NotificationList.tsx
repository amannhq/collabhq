'use client';

import { useState, useEffect } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import { EmptyState } from '@/components/shared';
import type { Notification } from '@/types/notification';
import { NotificationStatus } from '@/types';

interface NotificationListProps {
  userId: string;
  organizationId: string;
  onNotificationRead?: () => void;
  onMarkAllRead?: () => void;
}

export function NotificationList({
  userId,
  organizationId,
  onNotificationRead,
  onMarkAllRead,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(activeTab === 'unread' && { status: 'unread' }),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const { data } = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id.toString() === notificationId
              ? { ...n, status: NotificationStatus.READ, readAt: new Date() }
              : n
          )
        );
        onNotificationRead?.();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh notifications
        await fetchNotifications();
        onMarkAllRead?.();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const unreadNotifications = notifications.filter((n) => n.status === 'unread');

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
          >
            {markingAllRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="all" className="flex-1">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex-1">
            Unread {unreadNotifications.length > 0 && `(${unreadNotifications.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 m-0">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                title="No notifications"
                description="You're all caught up!"
                className="h-full"
              />
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id.toString()}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="flex-1 m-0">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : unreadNotifications.length === 0 ? (
              <EmptyState
                title="No unread notifications"
                description="You've read all your notifications"
                className="h-full"
              />
            ) : (
              <div className="divide-y">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id.toString()}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
