// src/types/notification.ts

import { ObjectId, NotificationType, NotificationStatus, NotificationPriority } from './index';

export interface NotificationRelatedEntity {
  type: 'post' | 'project' | 'creator' | 'organization' | 'metrics';
  id: ObjectId;
}

export interface NotificationEmailDelivery {
  shouldSend: boolean;
  sent: boolean;
  sentAt?: Date;
  deliveryStatus?: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  emailProvider?: string;
  messageId?: string;
  errorMessage?: string;
  openedAt?: Date;
  clickedAt?: Date;
}

export interface NotificationPushDelivery {
  shouldSend: boolean;
  sent: boolean;
  sentAt?: Date;
  deviceTokens?: string[];
  deliveryStatus?: 'sent' | 'failed';
  errorMessage?: string;
}

export interface Notification {
  _id: ObjectId;
  recipientId: ObjectId;
  senderId?: ObjectId;
  organizationId: ObjectId;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  relatedEntity?: NotificationRelatedEntity;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  readAt?: Date;
  archivedAt?: Date;
  emailDelivery?: NotificationEmailDelivery;
  pushDelivery?: NotificationPushDelivery;
  groupKey?: string;
  groupCount?: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateNotificationDto {
  recipientId: ObjectId;
  senderId?: ObjectId;
  organizationId: ObjectId;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  relatedEntity?: NotificationRelatedEntity;
  metadata?: Record<string, unknown>;
  shouldSendEmail?: boolean;
}

export interface BulkNotificationDto {
  recipientIds: ObjectId[];
  type: NotificationType;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}

export interface NotificationWithSender extends Notification {
  sender?: {
    _id: ObjectId;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface NotificationGroup {
  groupKey: string;
  count: number;
  latestNotification: Notification;
  notifications: Notification[];
}